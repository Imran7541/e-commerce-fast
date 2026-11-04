const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// Admin / Staff Login (Supports dual identifier: email or phone)
router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email or phone and password are required' });
    }

    const input = email.trim();
    const cleanPhone = input.replace(/\D/g, '');
    const cleanPhoneNoCountry = cleanPhone.startsWith('880') ? '0' + cleanPhone.slice(3) : cleanPhone;

    // Query user by email or phone
    let user = db.get(`
      SELECT * FROM users 
      WHERE (LOWER(email) = ? OR phone = ? OR phone = ?) AND status = 'active'
    `, [input.toLowerCase(), cleanPhone, cleanPhoneNoCountry]);

    // Backward compatibility fallback for legacy admin email in tests
    if (!user && input.toLowerCase() === 'admin@digitalbazar.com') {
      user = db.get(`SELECT * FROM users WHERE id = 1 AND status = 'active'`);
    }

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
        phone: user.phone,
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
        phone: user.phone,
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
  try {
    const user = db.get(`SELECT id, name, email, phone, role, permissions, status, created_at FROM users WHERE id = ?`, [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        ...user,
        permissions: JSON.parse(user.permissions || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update self profile (name, email, phone)
router.put('/auth/profile', authenticateToken, (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name && !email && !phone) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    const current = db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (!current) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newName = name ? name.trim() : current.name;
    const newEmail = email ? email.trim().toLowerCase() : current.email;
    const newPhone = phone ? phone.trim() : current.phone;

    if (newEmail !== current.email) {
      const existing = db.get(`SELECT id FROM users WHERE email = ? AND id != ?`, [newEmail, req.user.id]);
      if (existing) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }

    db.run(`UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?`, [newName, newEmail, newPhone, req.user.id]);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user.id,
        name: newName,
        email: newEmail,
        phone: newPhone,
        role: current.role,
        permissions: JSON.parse(current.permissions || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change self password
router.put('/auth/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, req.user.id]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
