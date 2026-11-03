const express = require('express');
const router = express.Router();
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

// Admin Products CRUD
router.get('/products', (req, res) => {
  try {
    const rows = db.all(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
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
      categoryName: r.categoryName,
      image: r.image
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', (req, res) => {
  try {
    const p = req.body;
    const result = db.run(`
      INSERT INTO products (
        name, slug, sku, price, sale_price, stock, category_id, description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      p.name,
      p.slug || `prod-${Date.now()}`,
      p.sku || `SKU-${Date.now()}`,
      parseFloat(p.price) || 0,
      p.salePrice ? parseFloat(p.salePrice) : null,
      parseInt(p.stock, 10) || 0,
      p.categoryId || null,
      p.description || '',
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
    db.run(`
      UPDATE products 
      SET name = ?, price = ?, sale_price = ?, stock = ?, category_id = ?, status = ?
      WHERE id = ?
    `, [
      p.name,
      parseFloat(p.price) || 0,
      p.salePrice ? parseFloat(p.salePrice) : null,
      parseInt(p.stock, 10) || 0,
      p.categoryId || null,
      p.status || 'active',
      req.params.id
    ]);
    res.json({ success: true });
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
