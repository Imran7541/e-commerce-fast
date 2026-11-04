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

// Admin Categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.all(`SELECT * FROM categories ORDER BY sort_order ASC, id ASC`);
    res.json(categories);
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
