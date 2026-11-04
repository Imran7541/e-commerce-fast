const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getStoreSettings } = require('../services/orderService');

// 1. Settings & Store Config
router.get('/settings', (req, res) => {
  try {
    const settings = getStoreSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings/theme', (req, res) => {
  try {
    const row = db.get(`SELECT value FROM settings WHERE key = 'theme'`);
    const theme = row ? JSON.parse(row.value) : {};
    res.json(theme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Categories
router.get('/categories', (req, res) => {
  try {
    const isTree = req.query.tree === '1' || req.query.tree === 'true';
    const rows = db.all(`SELECT * FROM categories WHERE status = 'active' ORDER BY sort_order ASC, id ASC`);

    const formatted = rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      parentId: r.parent_id,
      image: r.image,
      icon: r.icon,
      banner: r.banner,
      sortOrder: r.sort_order,
      isFeatured: Boolean(r.is_featured),
      status: r.status
    }));

    if (isTree) {
      const map = {};
      const roots = [];
      formatted.forEach(c => {
        map[c.id] = { ...c, children: [] };
      });
      formatted.forEach(c => {
        if (c.parentId && map[c.parentId]) {
          map[c.parentId].children.push(map[c.id]);
        } else {
          roots.push(map[c.id]);
        }
      });
      return res.json(roots);
    }

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Banners
router.get('/banners', (req, res) => {
  try {
    const banners = db.all(`SELECT * FROM banners WHERE status = 'active' ORDER BY sort_order ASC, id ASC`);
    res.json(banners.map(b => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.image_url,
      linkUrl: b.link_url,
      position: b.position,
      sortOrder: b.sort_order,
      status: b.status
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Brands & Generics
router.get('/brands', (req, res) => {
  try {
    const brands = db.all(`SELECT * FROM brands WHERE status = 'active'`);
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/generics', (req, res) => {
  try {
    const generics = db.all(`SELECT * FROM generics WHERE status = 'active'`);
    res.json(generics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Products Catalog
router.get('/products', (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      category,
      search,
      featured,
      isFlashSale,
      isBestSeller,
      isNewArrival,
      onSale,
      bestSeller,
      newArrival
    } = req.query;

    let sql = `
      SELECT p.*, c.name as categoryName, c.slug as categorySlug,
             b.name as brandName, b.slug as brandSlug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (category) {
      sql += ' AND (c.slug = ? OR p.category_id = ?)';
      params.push(category, category);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (featured === 'true' || featured === '1') {
      sql += ' AND p.featured = 1';
    }
    if (isFlashSale === 'true' || isFlashSale === '1') {
      sql += ' AND p.is_flash_sale = 1';
    }
    if (isBestSeller === 'true' || isBestSeller === '1' || bestSeller === 'true') {
      sql += ' AND p.is_best_seller = 1';
    }
    if (isNewArrival === 'true' || isNewArrival === '1' || newArrival === 'true') {
      sql += ' AND p.is_new_arrival = 1';
      // New Arrivals ordering: Feature Women's & Men's Fashion first, then Kids, Beauty & Health!
      sql += ` ORDER BY 
        CASE 
          WHEN p.category_id = 37 THEN 1 -- Woman's Fashion (Saree)
          WHEN p.category_id = 36 THEN 2 -- Men's Fashion (Panjabi / T-Shirt)
          WHEN p.category_id = 38 THEN 3 -- Kid's Fashion
          WHEN p.category_id = 41 THEN 4 -- Beauty & Care
          WHEN p.category_id = 42 THEN 5 -- Health & Wellness
          ELSE 6
        END,
        p.id DESC
        LIMIT ? OFFSET ?`;
    } else {
      // General catalog (feeds "All Products" on homepage):
      // Prioritize Men's & Women's Fashion (IDs 22, 24, 25, 31, 33, 34) so they lead the homepage,
      // and surface items not in "New Products" first to guarantee ZERO DUPLICATES with "New Products"!
      sql += ` ORDER BY 
        CASE 
          WHEN p.category_id = 36 THEN 1 -- Men's Fashion
          WHEN p.category_id = 37 THEN 2 -- Woman's Fashion
          WHEN p.category_id = 38 THEN 3 -- Kid's Fashion
          WHEN p.category_id = 41 THEN 4 -- Beauty & Care
          WHEN p.category_id = 42 THEN 5 -- Health & Wellness
          ELSE 6
        END,
        CASE WHEN p.is_new_arrival = 0 THEN 0 ELSE 1 END,
        p.id ASC
        LIMIT ? OFFSET ?`;
    }
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = db.all(sql, params);

    const products = rows.map(r => ({
      id: r.id,
      name: r.name,
      genericName: r.generic_name,
      slug: r.slug,
      sku: r.sku,
      barcode: r.barcode,
      categoryId: r.category_id,
      brandId: r.brand_id,
      description: r.description,
      shortDescription: r.short_description,
      price: r.price,
      salePrice: r.sale_price,
      stock: r.stock,
      lowStockThreshold: r.low_stock_threshold,
      unit: r.unit,
      featured: Boolean(r.featured),
      isFlashSale: Boolean(r.is_flash_sale),
      isBestSeller: Boolean(r.is_best_seller),
      isNewArrival: Boolean(r.is_new_arrival),
      rating: r.rating,
      reviewCount: r.review_count,
      image: r.image,
      images: JSON.parse(r.images || '[]'),
      hasVariations: Boolean(r.has_variations),
      freeShipping: Boolean(r.free_shipping),
      categoryName: r.categoryName,
      categorySlug: r.categorySlug,
      brandName: r.brandName,
      brandSlug: r.brandSlug
    }));

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products Browse with Facets & Filtering (used by /shop)
router.get('/products/browse', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      category,
      brand,
      generic,
      search,
      minPrice,
      maxPrice,
      inStock,
      flashSale,
      newArrival,
      sort
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.max(1, parseInt(pageSize, 10) || 20);
    const offset = (pageNum - 1) * limit;

    let whereClause = "WHERE p.status = 'active'";
    const params = [];

    if (category && category !== 'all') {
      if (!isNaN(category)) {
        whereClause += ' AND (p.category_id = ? OR c.parent_id = ?)';
        params.push(parseInt(category, 10), parseInt(category, 10));
      } else {
        whereClause += ' AND (c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ?))';
        params.push(category, category);
      }
    }

    if (brand && brand !== 'all') {
      if (!isNaN(brand)) {
        whereClause += ' AND p.brand_id = ?';
        params.push(parseInt(brand, 10));
      } else {
        whereClause += ' AND b.slug = ?';
        params.push(brand);
      }
    }

    if (generic && generic !== 'all') {
      whereClause += ' AND p.generic_name = ?';
      params.push(generic);
    }

    if (search && search.trim()) {
      whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (minPrice && !isNaN(minPrice)) {
      whereClause += ' AND COALESCE(p.sale_price, p.price) >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice && !isNaN(maxPrice)) {
      whereClause += ' AND COALESCE(p.sale_price, p.price) <= ?';
      params.push(parseFloat(maxPrice));
    }

    if (inStock === '1' || inStock === 'true') {
      whereClause += ' AND p.stock > 0';
    }

    if (flashSale === '1' || flashSale === 'true') {
      whereClause += ' AND p.is_flash_sale = 1';
    }

    if (newArrival === '1' || newArrival === 'true') {
      whereClause += ' AND p.is_new_arrival = 1';
    }

    let orderBy = `ORDER BY 
      CASE 
        WHEN p.category_id IN (36, 37) THEN 1  -- Men's & Woman's Fashion
        WHEN p.category_id = 38 THEN 2         -- Kid's Fashion
        WHEN p.category_id IN (41, 42) THEN 3  -- Beauty & Health
        ELSE 4
      END, 
      p.id DESC`;
    if (sort === 'popular') {
      orderBy = 'ORDER BY p.rating DESC, p.review_count DESC, p.id DESC';
    } else if (sort === 'price-asc') {
      orderBy = 'ORDER BY COALESCE(p.sale_price, p.price) ASC, p.id DESC';
    } else if (sort === 'price-desc') {
      orderBy = 'ORDER BY COALESCE(p.sale_price, p.price) DESC, p.id DESC';
    } else if (sort === 'newest') {
      orderBy = `ORDER BY 
        CASE 
          WHEN p.category_id IN (36, 37) THEN 1
          WHEN p.category_id = 38 THEN 2
          WHEN p.category_id IN (41, 42) THEN 3
          ELSE 4
        END, 
        p.id DESC`;
    } else if (sort === 'rating') {
      orderBy = 'ORDER BY p.rating DESC, p.id DESC';
    }

    // 1. Get filtered total count
    const countSql = `
      SELECT COUNT(*) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
    `;
    const countRow = db.get(countSql, params);
    const total = countRow ? countRow.count : 0;
    const pages = Math.ceil(total / limit) || 1;

    // 2. Get filtered items
    const itemsSql = `
      SELECT p.*, c.name as categoryName, c.slug as categorySlug,
             b.name as brandName, b.slug as brandSlug, b.logo as brandLogo
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const itemsParams = [...params, limit, offset];
    const rows = db.all(itemsSql, itemsParams);

    const items = rows.map(r => ({
      id: r.id,
      name: r.name,
      genericName: r.generic_name || null,
      slug: r.slug,
      sku: r.sku,
      barcode: r.barcode || null,
      categoryId: r.category_id,
      brandId: r.brand_id || null,
      description: r.description,
      shortDescription: r.short_description,
      price: r.price != null ? Number(r.price).toFixed(2) : '0.00',
      salePrice: r.sale_price != null ? Number(r.sale_price).toFixed(2) : null,
      stock: r.stock,
      lowStockThreshold: r.low_stock_threshold,
      unit: r.unit,
      dosage: r.dosage || null,
      requiresPrescription: Boolean(r.requires_prescription),
      batchNumber: r.batch_number || null,
      expiryDate: r.expiry_date || null,
      featured: Boolean(r.featured),
      isFlashSale: Boolean(r.is_flash_sale),
      isBestSeller: Boolean(r.is_best_seller),
      isNewArrival: Boolean(r.is_new_arrival),
      rating: r.rating != null ? Number(r.rating).toFixed(2) : '5.00',
      reviewCount: r.review_count || 0,
      image: r.image,
      images: typeof r.images === 'string' ? r.images : JSON.stringify(r.images || []),
      videoUrl: r.video_url || null,
      sizeGuideId: r.size_guide_id || null,
      freeShipping: Boolean(r.free_shipping),
      shippingCharges: r.shipping_charges || null,
      optionDisplay: r.option_display || null,
      highlights: r.highlights || null,
      howToUse: r.how_to_use || null,
      seoTitle: r.seo_title || null,
      seoDescription: r.seo_description || null,
      seoImage: r.seo_image || null,
      tags: r.tags || null,
      status: r.status || 'active',
      createdAt: r.created_at,
      categoryName: r.categoryName || '',
      categorySlug: r.categorySlug || '',
      brandName: r.brandName || '',
      brandSlug: r.brandSlug || '',
      brandLogo: r.brandLogo || ''
    }));

    // 3. Facets across active products
    const totalRow = db.get("SELECT COUNT(*) as count FROM products WHERE status = 'active'");
    const totalStore = totalRow ? totalRow.count : 0;

    const catRows = db.all(`
      SELECT category_id, COUNT(*) as count
      FROM products
      WHERE status = 'active' AND category_id IS NOT NULL
      GROUP BY category_id
    `);
    const categoriesFacet = {};
    for (const cr of catRows) {
      categoriesFacet[String(cr.category_id)] = cr.count;
    }

    const brandRows = db.all(`
      SELECT brand_id, COUNT(*) as count
      FROM products
      WHERE status = 'active' AND brand_id IS NOT NULL
      GROUP BY brand_id
    `);
    const brandsFacet = {};
    for (const br of brandRows) {
      brandsFacet[String(br.brand_id)] = br.count;
    }

    const priceRow = db.get(`
      SELECT MIN(COALESCE(sale_price, price)) as minPrice,
             MAX(COALESCE(sale_price, price)) as maxPrice
      FROM products
      WHERE status = 'active'
    `);

    const facets = {
      total: totalStore,
      categories: categoriesFacet,
      brands: brandsFacet,
      price: {
        min: priceRow?.minPrice != null ? Math.floor(Number(priceRow.minPrice)) : 0,
        max: priceRow?.maxPrice != null ? Math.ceil(Number(priceRow.maxPrice)) : 0
      }
    };

    res.json({
      items,
      total,
      page: pageNum,
      pageSize: limit,
      pages,
      facets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Product Dossier
router.get('/products/:id', (req, res) => {
  try {
    const idOrSlug = req.params.id;
    let product;

    if (!isNaN(idOrSlug)) {
      product = db.get(`
        SELECT p.*, c.name as categoryName, c.slug as categorySlug,
               b.name as brandName, b.slug as brandSlug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id = ?
      `, [idOrSlug]);
    } else {
      product = db.get(`
        SELECT p.*, c.name as categoryName, c.slug as categorySlug,
               b.name as brandName, b.slug as brandSlug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.slug = ?
      `, [idOrSlug]);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get variations
    const variations = db.all(`SELECT * FROM product_variations WHERE product_id = ?`, [product.id]).map(v => ({
      id: v.id,
      productId: v.product_id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      salePrice: v.sale_price,
      stock: v.stock,
      image: v.image,
      attributes: JSON.parse(v.attribute_values || '{}')
    }));

    // Get related products
    const related = db.all(`
      SELECT id, name, slug, price, sale_price as salePrice, image, rating, review_count as reviewCount
      FROM products
      WHERE category_id = ? AND id != ? AND status = 'active'
      LIMIT 8
    `, [product.category_id, product.id]);

    // Get reviews
    const reviews = db.all(`SELECT * FROM reviews WHERE product_id = ? AND status = 'approved'`, [product.id]);

    const formattedProduct = {
      id: product.id,
      name: product.name,
      genericName: product.generic_name,
      slug: product.slug,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.category_id,
      brandId: product.brand_id,
      description: product.description,
      shortDescription: product.short_description,
      price: product.price,
      salePrice: product.sale_price,
      stock: product.stock,
      unit: product.unit,
      featured: Boolean(product.featured),
      rating: product.rating,
      reviewCount: product.review_count,
      image: product.image,
      images: JSON.parse(product.images || '[]'),
      hasVariations: Boolean(product.has_variations),
      freeShipping: Boolean(product.free_shipping),
      shippingCharges: product.shipping_charges,
      highlights: JSON.parse(product.highlights || '[]'),
      howToUse: product.how_to_use,
      seoTitle: product.seo_title,
      seoDescription: product.seo_description,
      categoryName: product.categoryName,
      categorySlug: product.categorySlug,
      brandName: product.brandName,
      brandSlug: product.brandSlug
    };

    res.json({
      product: formattedProduct,
      variations,
      hasVariations: variations.length > 0,
      related,
      reviews,
      ratingBreakdown: { 5: 5, 4: 0, 3: 0, 2: 0, 1: 0 },
      sizeGuide: null,
      attributes: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Blog
router.get('/blog', (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const posts = db.all(`
      SELECT id, title, slug, excerpt, cover_image as coverImage, author, category, views, created_at as createdAt
      FROM blog_posts
      WHERE is_published = 1
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit, 10), parseInt(offset, 10)]);

    const total = db.get(`SELECT COUNT(*) as c FROM blog_posts WHERE is_published = 1`).c;

    res.json({
      posts,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      categories: ['Fashion', 'Beauty', 'Health', 'Lifestyle']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/blog/:slug', (req, res) => {
  try {
    const post = db.get(`SELECT * FROM blog_posts WHERE slug = ?`, [req.params.slug]);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.cover_image,
        author: post.author,
        category: post.category,
        tags: JSON.parse(post.tags || '[]'),
        views: post.views,
        createdAt: post.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/blog/:slug/view', (req, res) => {
  try {
    db.run(`UPDATE blog_posts SET views = views + 1 WHERE slug = ?`, [req.params.slug]);
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// 7. Landing Pages
router.get('/lp/:slug', (req, res) => {
  try {
    const lp = db.get(`SELECT * FROM landing_pages WHERE slug = ? AND status = 'active'`, [req.params.slug]);
    if (!lp) {
      return res.status(404).json({ error: 'Landing page not found' });
    }

    res.json({
      page: {
        id: lp.id,
        title: lp.title,
        slug: lp.slug,
        template: lp.template,
        status: lp.status,
        content: JSON.parse(lp.content || '{}'),
        views: lp.views,
        createdAt: lp.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lp/:slug/view', (req, res) => {
  try {
    db.run(`UPDATE landing_pages SET views = views + 1 WHERE slug = ?`, [req.params.slug]);
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// 8. Utility & System Endpoints
router.get('/maintenance/status', (req, res) => {
  res.json({ isUnderMaintenance: false });
});

router.get('/cache-version', (req, res) => {
  res.json({ version: 1730600000 });
});

router.get('/access-check', (req, res) => {
  res.json({ allowed: true });
});

router.post('/track/capi', (req, res) => {
  res.json({ received: true });
});

module.exports = router;
