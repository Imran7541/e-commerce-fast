const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// Admin / Staff Login
router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.get(`SELECT * FROM users WHERE email = ? AND status = 'active'`, [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: JSON.parse(user.permissions || '[]')
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: JSON.parse(user.permissions || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin / Staff Current Profile
router.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// Customer Sign In
router.post('/auth/customer-login', (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const customer = db.get(`SELECT * FROM customers WHERE phone = ? AND status = 'active'`, [phone.trim()]);
    if (!customer) {
      return res.status(401).json({ error: 'Customer not found' });
    }

    const isValid = bcrypt.compareSync(password, customer.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Register
router.post('/auth/register', (req, res) => {
  try {
    const { name, phone, password, address, district, thana } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }

    const existing = db.get(`SELECT id FROM customers WHERE phone = ?`, [phone.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Customer with this phone already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const result = db.run(`
      INSERT INTO customers (name, phone, password_hash, address, district, thana, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [name.trim(), phone.trim(), hash, address || '', district || '', thana || '']);

    const token = jwt.sign(
      {
        id: result.lastInsertRowid,
        name,
        phone,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      customer: {
        id: result.lastInsertRowid,
        name,
        phone,
        address
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Account Details & Orders
router.get('/account/me', authenticateToken, (req, res) => {
  try {
    const customer = db.get(`SELECT id, name, phone, email, address, district, thana FROM customers WHERE id = ?`, [req.user.id]);
    const orders = db.all(`SELECT * FROM orders WHERE phone = ? ORDER BY id DESC`, [req.user.phone || '']);

    res.json({
      customer,
      orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
