const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateOrderNumber } = require('../services/orderService');

router.use(authenticateToken);
router.use(requireRole(['admin', 'super_admin', 'manager', 'pos_operator']));

// Current Cash Counter
router.get('/counter', (req, res) => {
  try {
    const counter = db.get(`SELECT * FROM pos_counters WHERE status = 'open' ORDER BY id DESC LIMIT 1`);
    res.json({
      isOpen: Boolean(counter),
      counter: counter || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Open Counter
router.post('/counter/open', (req, res) => {
  try {
    const { openingCash = 0 } = req.body;
    const existing = db.get(`SELECT id FROM pos_counters WHERE status = 'open' LIMIT 1`);
    if (existing) {
      return res.status(400).json({ error: 'A cash counter is already open' });
    }

    const result = db.run(`
      INSERT INTO pos_counters (user_id, opening_cash, total_sales, status, opened_at)
      VALUES (?, ?, 0, 'open', CURRENT_TIMESTAMP)
    `, [req.user.id, parseFloat(openingCash) || 0]);

    db.run(`
      INSERT INTO pos_drawer_events (counter_id, type, amount, reason, created_at)
      VALUES (?, 'open_float', ?, 'Opening cash float', CURRENT_TIMESTAMP)
    `, [result.lastInsertRowid, parseFloat(openingCash) || 0]);

    res.json({
      success: true,
      message: 'Counter opened successfully',
      counterId: result.lastInsertRowid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Close Counter
router.post('/counter/close', (req, res) => {
  try {
    const { closingCash = 0 } = req.body;
    const counter = db.get(`SELECT * FROM pos_counters WHERE status = 'open' LIMIT 1`);
    if (!counter) {
      return res.status(400).json({ error: 'No open counter found' });
    }

    const expectedCash = counter.opening_cash + counter.total_sales;
    const difference = parseFloat(closingCash) - expectedCash;

    db.run(`
      UPDATE pos_counters 
      SET closing_cash = ?, difference = ?, status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [parseFloat(closingCash), difference, counter.id]);

    res.json({
      success: true,
      counter: {
        id: counter.id,
        openingCash: counter.opening_cash,
        totalSales: counter.total_sales,
        closingCash: parseFloat(closingCash),
        difference
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POS Product Lookup
router.get('/products', (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    let sql = `SELECT id, name, sku, barcode, price, sale_price as salePrice, stock, image FROM products WHERE status = 'active'`;
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name ASC LIMIT ?';
    params.push(parseInt(limit, 10));

    const products = db.all(sql, params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POS Instant Sale
router.post('/sale', (req, res) => {
  try {
    const {
      customerName = 'Walk-in Customer',
      phone = '01700000000',
      items = [],
      subtotal = 0,
      discount = 0,
      paidAmount = 0,
      paymentMethod = 'cash'
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const orderNumber = generateOrderNumber();
    const total = parseFloat(subtotal) - parseFloat(discount);

    // Record order
    const insertOrder = db.db.prepare(`
      INSERT INTO orders (
        order_number, customer_name, phone, address, subtotal, shipping_cost, discount,
        total, advance_payment, cod_amount, status, payment_method, payment_status,
        source, created_at, updated_at
      ) VALUES (
        ?, ?, ?, 'POS In-Store', ?, 0, ?,
        ?, ?, 0, 'completed', ?, 'paid',
        'pos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    const result = insertOrder.run(
      orderNumber,
      customerName,
      phone,
      parseFloat(subtotal),
      parseFloat(discount),
      total,
      parseFloat(paidAmount),
      paymentMethod
    );

    const orderId = result.lastInsertRowid;

    // Record items & decrement inventory
    const insertItem = db.db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.db.prepare(`
      UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
    `);

    for (const it of items) {
      const price = parseFloat(it.salePrice || it.price) || 0;
      const qty = parseInt(it.quantity, 10) || 1;
      insertItem.run(orderId, it.id, it.name, price, qty, price * qty);
      updateStock.run(qty, it.id);
    }

    // Update open counter sales
    const openCounter = db.get(`SELECT id FROM pos_counters WHERE status = 'open' LIMIT 1`);
    if (openCounter) {
      db.run(`UPDATE pos_counters SET total_sales = total_sales + ? WHERE id = ?`, [total, openCounter.id]);
      db.run(`
        INSERT INTO pos_drawer_events (counter_id, type, amount, reason, created_at)
        VALUES (?, 'sale', ?, ?, CURRENT_TIMESTAMP)
      `, [openCounter.id, total, `POS Order ${orderNumber}`]);
    }

    res.status(201).json({
      success: true,
      orderNumber,
      total,
      receipt: {
        orderNumber,
        customerName,
        phone,
        items,
        subtotal,
        discount,
        total,
        paidAmount,
        change: Math.max(0, parseFloat(paidAmount) - total),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
