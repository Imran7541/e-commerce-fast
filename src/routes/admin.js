const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protect all admin routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'super_admin', 'manager']));

// Catalog Summary Dashboard
router.get('/catalog/summary', (req, res) => {
  try {
    const totalProducts = db.get(`SELECT COUNT(*) as c FROM products`).c;
    const activeProducts = db.get(`SELECT COUNT(*) as c FROM products WHERE status = 'active'`).c;
    const lowStock = db.get(`SELECT COUNT(*) as c FROM products WHERE stock <= low_stock_threshold`).c;
    const totalCategories = db.get(`SELECT COUNT(*) as c FROM categories`).c;
    const totalOrders = db.get(`SELECT COUNT(*) as c FROM orders`).c;
    const pendingOrders = db.get(`SELECT COUNT(*) as c FROM orders WHERE status = 'pending'`).c;
    const totalRevenue = db.get(`SELECT SUM(total) as s FROM orders WHERE status IN ('delivered', 'completed')`).s || 0;

    res.json({
      totalProducts,
      activeProducts,
      lowStock,
      totalCategories,
      totalOrders,
      pendingOrders,
      totalRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Orders
router.get('/orders', (req, res) => {
  try {
    const { status, limit = 50, page = 1, search } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (order_number LIKE ? OR phone LIKE ? OR customer_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const orders = db.all(sql, params).map(o => {
      const items = db.all(`SELECT * FROM order_items WHERE order_id = ?`, [o.id]);
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        phone: o.phone,
        address: o.address,
        subtotal: o.subtotal,
        shippingCost: o.shipping_cost,
        discount: o.discount,
        total: o.total,
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        courierName: o.courier_name,
        courierTrackingId: o.courier_tracking_id,
        courierStatus: o.courier_status,
        createdAt: o.created_at,
        items
      };
    });

    const total = db.get(`SELECT COUNT(*) as c FROM orders`).c;

    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    db.run(`UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, req.params.id]);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders/:id/courier-ship', (req, res) => {
  try {
    const { courierName = 'Pathao' } = req.body;
    const trackingId = `TRK-${Date.now()}`;
    db.run(`
      UPDATE orders 
      SET courier_name = ?, courier_tracking_id = ?, courier_status = 'In Transit', status = 'shipped', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [courierName, trackingId, req.params.id]);

    res.json({ success: true, trackingId, courierName, courierStatus: 'In Transit' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Products CRUD & List
router.get('/products/list', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      category = 'all',
      brand = 'all',
      status = 'all',
      stock = 'all',
      sort = 'id',
      dir = 'desc'
    } = req.query;

    let sql = `
      SELECT p.*, c.name as categoryName, b.name as brandName 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.slug LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category && category !== 'all') {
      sql += ' AND (p.category_id = ? OR c.slug = ?)';
      params.push(isNaN(category) ? category : parseInt(category, 10), category);
    }

    if (brand && brand !== 'all') {
      sql += ' AND (p.brand_id = ? OR b.name = ?)';
      params.push(isNaN(brand) ? brand : parseInt(brand, 10), brand);
    }

    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (stock === 'out') {
      sql += ' AND p.stock <= 0';
    } else if (stock === 'low') {
      sql += ' AND p.stock > 0 AND p.stock <= p.low_stock_threshold';
    } else if (stock === 'in') {
      sql += ' AND p.stock > 0';
    }

    // Sort order
    const allowedSortFields = ['id', 'name', 'price', 'stock', 'created_at'];
    const sortField = allowedSortFields.includes(sort) ? `p.${sort}` : 'p.id';
    const sortDir = dir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortField} ${sortDir}`;

    // Get total matching
    const countSql = sql.replace('SELECT p.*, c.name as categoryName, b.name as brandName', 'SELECT COUNT(*) as c');
    const total = db.get(countSql, params).c;

    // Apply pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize, 10), offset);

    const rows = db.all(sql, params).map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku,
      price: r.price,
      salePrice: r.sale_price,
      stock: r.stock,
      status: r.status,
      categoryId: r.category_id,
      categoryName: r.categoryName,
      brandId: r.brand_id,
      brandName: r.brandName,
      image: r.image,
      images: (() => {
        try {
          return r.images ? JSON.parse(r.images) : (r.image ? [r.image] : []);
        } catch (e) {
          return r.image ? [r.image] : [];
        }
      })()
    }));

    // Summary statistics
    const summaryTotal = db.get(`SELECT COUNT(*) as c FROM products`).c;
    const summaryActive = db.get(`SELECT COUNT(*) as c FROM products WHERE status = 'active'`).c;
    const summaryDraft = db.get(`SELECT COUNT(*) as c FROM products WHERE status = 'draft'`).c;
    const summaryOut = db.get(`SELECT COUNT(*) as c FROM products WHERE stock <= 0`).c;
    const summaryLow = db.get(`SELECT COUNT(*) as c FROM products WHERE stock > 0 AND stock <= low_stock_threshold`).c;
    const summaryValue = db.get(`SELECT SUM(price * stock) as s FROM products`).s || 0;

    res.json({
      rows,
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      summary: {
        total: summaryTotal,
        active: summaryActive,
        draft: summaryDraft,
        archived: 0,
        unpublished: 0,
        out: summaryOut,
        low: summaryLow,
        value: summaryValue
      }
    });
  } catch (err) {
    console.error('Error in /products/list:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/products', (req, res) => {
  try {
    const rows = db.all(`
      SELECT p.*, c.name as categoryName, b.name as brandName 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `);
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku,
      price: r.price,
      salePrice: r.sale_price,
      stock: r.stock,
      status: r.status,
      categoryId: r.category_id,
      categoryName: r.categoryName,
      brandId: r.brand_id,
      brandName: r.brandName,
      image: r.image,
      images: (() => {
        try {
          return r.images ? JSON.parse(r.images) : (r.image ? [r.image] : []);
        } catch (e) {
          return r.image ? [r.image] : [];
        }
      })()
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', (req, res) => {
  try {
    const p = req.body;
    const image = p.image || (Array.isArray(p.images) && p.images[0]) || null;
    const imagesStr = typeof p.images === 'string' ? p.images : JSON.stringify(p.images || (image ? [image] : []));

    const result = db.run(`
      INSERT INTO products (
        name, slug, sku, price, sale_price, stock, category_id, brand_id, description, image, images, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      p.name,
      p.slug || `prod-${Date.now()}`,
      p.sku || `SKU-${Date.now()}`,
      parseFloat(p.price) || 0,
      p.salePrice ? parseFloat(p.salePrice) : null,
      parseInt(p.stock, 10) || 0,
      p.categoryId || null,
      p.brandId || 1, // default EM-BRAND
      p.description || '',
      image,
      imagesStr,
      p.status || 'active'
    ]);

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const p = req.body;
    const image = p.image || (Array.isArray(p.images) && p.images[0]) || null;
    const imagesStr = typeof p.images === 'string' ? p.images : (p.images ? JSON.stringify(p.images) : null);

    let sql = `
      UPDATE products 
      SET name = ?, price = ?, sale_price = ?, stock = ?, category_id = ?, status = ?
    `;
    const params = [
      p.name,
      parseFloat(p.price) || 0,
      p.salePrice ? parseFloat(p.salePrice) : null,
      parseInt(p.stock, 10) || 0,
      p.categoryId || null,
      p.status || 'active'
    ];

    if (image !== undefined) {
      sql += `, image = ?`;
      params.push(image);
    }
    if (imagesStr !== null && imagesStr !== undefined) {
      sql += `, images = ?`;
      params.push(imagesStr);
    }
    if (p.brandId !== undefined) {
      sql += `, brand_id = ?`;
      params.push(p.brandId);
    }

    sql += ` WHERE id = ?`;
    params.push(req.params.id);

    db.run(sql, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    db.run(`DELETE FROM products WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Product Variations Management
router.get('/products/:id/variations', (req, res) => {
  try {
    const variations = db.all('SELECT * FROM product_variations WHERE product_id = ? ORDER BY id ASC', [req.params.id]).map(v => {
      let comb = {};
      try {
        comb = typeof v.attribute_values === 'string' ? JSON.parse(v.attribute_values) : (v.attribute_values || {});
      } catch {
        comb = {};
      }
      return {
        id: v.id,
        productId: v.product_id,
        combination: comb,
        name: v.name || '',
        sku: v.sku || '',
        barcode: '',
        price: v.price != null ? String(v.price) : '',
        salePrice: v.sale_price != null ? String(v.sale_price) : '',
        wholesalePrice: '',
        stock: v.stock !== undefined && v.stock !== null ? String(v.stock) : '0',
        image: v.image || '',
        status: 'active'
      };
    });
    res.json(variations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id/variations', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const prod = db.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variationsList = Array.isArray(req.body.variations) ? req.body.variations : [];

    // Delete existing variations for this product
    db.run('DELETE FROM product_variations WHERE product_id = ?', [productId]);

    let totalStock = 0;
    const insertStmt = db.db.prepare(`
      INSERT INTO product_variations (product_id, name, sku, price, sale_price, stock, image, attribute_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (const v of variationsList) {
      const comb = v.combination && typeof v.combination === 'object' ? v.combination : {};
      const label = v.label || v.name || Object.entries(comb).map(([k, val]) => `${k}: ${val}`).join(' / ') || 'Variation';
      const sku = v.sku ? v.sku.trim() : `${prod.sku || 'SKU'}-VAR-${Date.now()}`;
      const price = v.price !== undefined && v.price !== '' ? parseFloat(v.price) : prod.price;
      const salePrice = v.salePrice !== undefined && v.salePrice !== '' && v.salePrice !== null ? parseFloat(v.salePrice) : null;
      const stock = Number(v.stock) || 0;
      totalStock += stock;
      const image = v.image || null;

      insertStmt.run(
        productId,
        label,
        sku,
        price,
        salePrice,
        stock,
        image,
        JSON.stringify(comb)
      );
    }

    // Update parent product stock and has_variations flag
    const hasVariations = variationsList.length > 0 ? 1 : 0;
    if (hasVariations) {
      db.run(
        'UPDATE products SET stock = ?, has_variations = 1 WHERE id = ?',
        [totalStock, productId]
      );
    } else {
      db.run(
        'UPDATE products SET has_variations = 0 WHERE id = ?',
        [productId]
      );
    }

    res.json({
      success: true,
      message: 'Variations updated successfully',
      count: variationsList.length,
      totalStock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attributes Management CRUD
router.get('/attributes', (req, res) => {
  try {
    const rows = db.all('SELECT * FROM product_attributes ORDER BY id ASC');
    const attrs = rows.map(r => ({
      id: r.id,
      name: r.name,
      values: (() => {
        try {
          return r.values_json ? JSON.parse(r.values_json) : [];
        } catch {
          return [];
        }
      })(),
      createdAt: r.created_at
    }));
    res.json(attrs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attributes', (req, res) => {
  try {
    const { name, values = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Attribute name is required' });
    }
    const cleanValues = Array.isArray(values) ? values : (typeof values === 'string' ? values.split(',').map(s => s.trim()).filter(Boolean) : []);
    const result = db.run(
      'INSERT INTO product_attributes (name, values_json, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [name.trim(), JSON.stringify(cleanValues)]
    );
    res.status(201).json({
      success: true,
      message: 'Attribute created successfully',
      id: result.lastInsertRowid,
      attribute: {
        id: result.lastInsertRowid,
        name: name.trim(),
        values: cleanValues
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/attributes/:id', (req, res) => {
  try {
    const existing = db.get('SELECT * FROM product_attributes WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Attribute not found' });
    }
    const name = req.body.name !== undefined ? req.body.name.trim() : existing.name;
    let values = existing.values_json ? JSON.parse(existing.values_json) : [];
    if (req.body.values !== undefined) {
      values = Array.isArray(req.body.values) ? req.body.values : (typeof req.body.values === 'string' ? req.body.values.split(',').map(s => s.trim()).filter(Boolean) : []);
    }
    db.run(
      'UPDATE product_attributes SET name = ?, values_json = ? WHERE id = ?',
      [name, JSON.stringify(values), req.params.id]
    );
    res.json({
      success: true,
      message: 'Attribute updated successfully',
      attribute: {
        id: parseInt(req.params.id, 10),
        name,
        values
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/attributes/:id', (req, res) => {
  try {
    db.run('DELETE FROM product_attributes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Attribute deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Categories CRUD & Reorder
router.get('/categories', (req, res) => {
  try {
    const categories = db.all(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON p.category_id = c.id 
      GROUP BY c.id 
      ORDER BY c.sort_order ASC, c.id ASC
    `).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id,
      parent_id: c.parent_id,
      image: c.image,
      icon: c.icon,
      banner: c.banner,
      sortOrder: c.sort_order,
      sort_order: c.sort_order,
      featured: Boolean(c.is_featured),
      isFeatured: Boolean(c.is_featured),
      is_featured: c.is_featured,
      status: c.status || 'active',
      productCount: c.product_count || 0,
      product_count: c.product_count || 0,
      createdAt: c.created_at
    }));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name, slug, parentId, parent_id, image, icon, banner, featured, isFeatured, sortOrder, sort_order, status = 'active' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const catSlug = (slug && slug.trim()) ? slug.trim() : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const pId = parentId !== undefined ? parentId : (parent_id !== undefined ? parent_id : null);
    const isFeat = featured !== undefined ? (featured ? 1 : 0) : (isFeatured ? 1 : 0);
    const sOrder = sortOrder !== undefined ? parseInt(sortOrder, 10) : (sort_order !== undefined ? parseInt(sort_order, 10) : 0);

    const result = db.run(`
      INSERT INTO categories (name, slug, parent_id, image, icon, banner, is_featured, sort_order, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [name.trim(), catSlug, pId || null, image || null, icon || null, banner || null, isFeat, sOrder || 0, status]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      id: result.lastInsertRowid,
      category: {
        id: result.lastInsertRowid,
        name: name.trim(),
        slug: catSlug,
        parentId: pId || null,
        image,
        icon,
        banner,
        featured: Boolean(isFeat),
        sortOrder: sOrder || 0,
        status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/reorder', (req, res) => {
  try {
    const categoriesList = Array.isArray(req.body.categories) ? req.body.categories : [];
    const stmt = db.db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
    for (const item of categoriesList) {
      if (item.id != null && item.sortOrder != null) {
        stmt.run(parseInt(item.sortOrder, 10), parseInt(item.id, 10));
      }
    }
    res.json({ success: true, message: 'Categories reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', (req, res) => {
  try {
    const catId = parseInt(req.params.id, 10);
    const existing = db.get('SELECT * FROM categories WHERE id = ?', [catId]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const name = req.body.name !== undefined ? req.body.name.trim() : existing.name;
    const slug = req.body.slug !== undefined ? req.body.slug.trim() : existing.slug;
    const pId = req.body.parentId !== undefined ? req.body.parentId : (req.body.parent_id !== undefined ? req.body.parent_id : existing.parent_id);
    const image = req.body.image !== undefined ? req.body.image : existing.image;
    const icon = req.body.icon !== undefined ? req.body.icon : existing.icon;
    const banner = req.body.banner !== undefined ? req.body.banner : existing.banner;
    const isFeat = req.body.featured !== undefined ? (req.body.featured ? 1 : 0) : (req.body.isFeatured !== undefined ? (req.body.isFeatured ? 1 : 0) : existing.is_featured);
    const sOrder = req.body.sortOrder !== undefined ? parseInt(req.body.sortOrder, 10) : (req.body.sort_order !== undefined ? parseInt(req.body.sort_order, 10) : existing.sort_order);
    const status = req.body.status !== undefined ? req.body.status : existing.status;

    db.run(`
      UPDATE categories 
      SET name = ?, slug = ?, parent_id = ?, image = ?, icon = ?, banner = ?, is_featured = ?, sort_order = ?, status = ?
      WHERE id = ?
    `, [name, slug, pId || null, image || null, icon || null, banner || null, isFeat, sOrder || 0, status, catId]);

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    const catId = parseInt(req.params.id, 10);
    db.run('UPDATE categories SET parent_id = NULL WHERE parent_id = ?', [catId]);
    db.run('UPDATE products SET category_id = NULL WHERE category_id = ?', [catId]);
    db.run('DELETE FROM categories WHERE id = ?', [catId]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Brands CRUD & Product Counts
router.get('/brands/product-counts', (req, res) => {
  try {
    const counts = db.all(`
      SELECT brand_id, COUNT(*) as count 
      FROM products 
      WHERE brand_id IS NOT NULL 
      GROUP BY brand_id
    `);
    const result = {};
    for (const c of counts) {
      result[String(c.brand_id)] = c.count;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/brands', (req, res) => {
  try {
    const { name, slug, logo, website, status = 'active' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }
    const brandSlug = (slug && slug.trim()) ? slug.trim() : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = db.run(`
      INSERT INTO brands (name, slug, logo, website, status, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [name.trim(), brandSlug, logo || null, website || null, status]);

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      id: result.lastInsertRowid,
      brand: {
        id: result.lastInsertRowid,
        name: name.trim(),
        slug: brandSlug,
        logo,
        website,
        status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/brands/:id', (req, res) => {
  try {
    const brandId = parseInt(req.params.id, 10);
    const existing = db.get('SELECT * FROM brands WHERE id = ?', [brandId]);
    if (!existing) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    const name = req.body.name !== undefined ? req.body.name.trim() : existing.name;
    const slug = req.body.slug !== undefined ? req.body.slug.trim() : existing.slug;
    const logo = req.body.logo !== undefined ? req.body.logo : existing.logo;
    const website = req.body.website !== undefined ? req.body.website : existing.website;
    const status = req.body.status !== undefined ? req.body.status : existing.status;

    db.run(`
      UPDATE brands 
      SET name = ?, slug = ?, logo = ?, website = ?, status = ?
      WHERE id = ?
    `, [name, slug, logo || null, website || null, status, brandId]);

    res.json({ success: true, message: 'Brand updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/brands/:id', (req, res) => {
  try {
    const brandId = parseInt(req.params.id, 10);
    db.run('UPDATE products SET brand_id = NULL WHERE brand_id = ?', [brandId]);
    db.run('DELETE FROM brands WHERE id = ?', [brandId]);
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Settings Update
router.post('/settings', (req, res) => {
  try {
    const updates = req.body;
    const stmt = db.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    for (const [key, val] of Object.entries(updates)) {
      stmt.run(key, typeof val === 'string' ? val : JSON.stringify(val));
    }
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Health
router.get('/system/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'sqlite',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Staff & User Management CRUD
router.get('/users', (req, res) => {
  try {
    const users = db.all(`
      SELECT id, name, email, phone, role, permissions, status, created_at 
      FROM users 
      ORDER BY id ASC
    `).map(u => ({
      ...u,
      permissions: (() => {
        try {
          return u.permissions ? JSON.parse(u.permissions) : [];
        } catch {
          return [];
        }
      })()
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', (req, res) => {
  try {
    const { name, email, phone, role = 'staff', permissions = [], password, status = 'active' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.get(`SELECT id FROM users WHERE LOWER(email) = ?`, [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const permString = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);

    const result = db.run(`
      INSERT INTO users (name, email, phone, password_hash, role, permissions, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [name.trim(), cleanEmail, phone ? phone.trim() : null, hash, role, permString, status]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      id: result.lastInsertRowid,
      user: {
        id: result.lastInsertRowid,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role,
        permissions: Array.isArray(permissions) ? permissions : [],
        status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', (req, res) => {
  try {
    const { name, email, phone, role, permissions, password, status } = req.body;
    const user = db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let sql = `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, permissions = ?, status = ?`;
    const cleanEmail = email ? email.trim().toLowerCase() : user.email;
    const permString = permissions !== undefined ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : user.permissions;

    const params = [
      name ? name.trim() : user.name,
      cleanEmail,
      phone !== undefined ? (phone ? phone.trim() : null) : user.phone,
      role || user.role,
      permString,
      status || user.status
    ];

    if (password && password.trim().length >= 6) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password.trim(), salt);
      sql += `, password_hash = ?`;
      params.push(hash);
    }

    sql += ` WHERE id = ?`;
    params.push(req.params.id);

    db.run(sql, params);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (id === 1) {
      return res.status(400).json({ error: 'Cannot delete primary Super Admin user' });
    }
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run(`DELETE FROM users WHERE id = ?`, [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/password', (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password.trim(), salt);
    db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, req.params.id]);
    res.json({ success: true, message: 'User password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permission Modules
router.get('/permission-modules', (req, res) => {
  res.json([
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'products', name: 'Products Catalog' },
    { id: 'orders', name: 'Order Management' },
    { id: 'pos', name: 'Point of Sale' },
    { id: 'customers', name: 'Customers CRM' },
    { id: 'expenses', name: 'Expenses Ledger' },
    { id: 'reports', name: 'Analytics & Reports' },
    { id: 'settings', name: 'System Settings' }
  ]);
});

module.exports = router;
