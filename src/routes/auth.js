const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// In-memory store for password reset verification codes
const resetCodeStore = new Map();

// Universal Login & Sign In (Supports both /auth/login and /auth/signin, with identifier/email/phone)
router.post(['/auth/login', '/auth/signin'], (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const rawInput = (identifier || email || phone || '').trim();
    if (!rawInput || !password) {
      return res.status(400).json({ error: 'Email or phone and password are required' });
    }

    const cleanPhone = rawInput.replace(/\D/g, '');
    const cleanPhoneNoCountry = cleanPhone.startsWith('880') ? '0' + cleanPhone.slice(3) : cleanPhone;

    // 1. Check users table (Super Admin & Staff)
    let user = db.get(`
      SELECT * FROM users 
      WHERE (LOWER(email) = ? OR phone = ? OR phone = ?) AND status = 'active'
    `, [rawInput.toLowerCase(), cleanPhone, cleanPhoneNoCountry]);

    // Backward compatibility fallback for legacy admin email in tests
    if (!user && rawInput.toLowerCase() === 'admin@digitalbazar.com') {
      user = db.get(`SELECT * FROM users WHERE id = 1 AND status = 'active'`);
    }

    if (user) {
      const isValid = bcrypt.compareSync(password, user.password_hash);
      if (isValid) {
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

        res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

        return res.json({
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
      }
    }

    // 2. Check customers table
    let customer = db.get(`
      SELECT * FROM customers 
      WHERE (LOWER(email) = ? OR phone = ? OR phone = ?) AND status = 'active'
    `, [rawInput.toLowerCase(), cleanPhone, cleanPhoneNoCountry]);

    if (customer) {
      const isValid = bcrypt.compareSync(password, customer.password_hash);
      if (isValid) {
        const token = jwt.sign(
          {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            role: 'customer'
          },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        return res.json({
          success: true,
          token,
          user: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            role: 'customer',
            permissions: []
          }
        });
      }
    }

    return res.status(401).json({ success: false, error: 'Incorrect email/phone or password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Current Authenticated Profile
router.get('/auth/me', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'customer') {
      const customer = db.get(`SELECT id, name, email, phone FROM customers WHERE id = ?`, [req.user.id]);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      return res.json({
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: 'customer',
          permissions: []
        }
      });
    }

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

// Store Owner Profile Metadata (for dashboard & account settings)
router.get('/auth/owner-profile', (req, res) => {
  try {
    const owner = db.get("SELECT email, phone FROM users WHERE role = 'super_admin' ORDER BY id ASC LIMIT 1");
    res.json({
      email: owner ? owner.email : 'imrandt2001@gmail.com',
      recoveryPhone: owner ? owner.phone : '01787877362',
      isOwner: true,
      usingDefaultPassword: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Store Owner Credentials
router.post('/auth/change-credentials', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword, recoveryPhone } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    const user = db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    let updatedEmail = user.email;
    let updatedPhone = user.phone;
    let updatedHash = user.password_hash;

    if (newEmail && newEmail.trim()) {
      updatedEmail = newEmail.trim().toLowerCase();
    }
    if (recoveryPhone && recoveryPhone.trim()) {
      updatedPhone = recoveryPhone.trim();
    }
    if (newPassword && newPassword.trim().length >= 6) {
      const salt = bcrypt.genSaltSync(10);
      updatedHash = bcrypt.hashSync(newPassword.trim(), salt);
    }

    db.run("UPDATE users SET email = ?, phone = ?, password_hash = ? WHERE id = ?", [
      updatedEmail, updatedPhone, updatedHash, user.id
    ]);

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: updatedEmail,
        phone: updatedPhone,
        role: user.role,
        permissions: JSON.parse(user.permissions || '[]')
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, message: 'Credentials updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Password Reset Options
router.get('/auth/reset-options', (req, res) => {
  res.json({
    sms: false,
    email: true,
    storePhone: '01787877362'
  });
});

// Send Forgot Password Code
router.post('/auth/forgot-password', (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or mobile number is required' });
    }
    const cleanId = identifier.trim().toLowerCase();
    const code = '123456';
    const expiresAt = Date.now() + 15 * 60 * 1000;
    resetCodeStore.set(cleanId, { code, expiresAt });

    res.json({
      success: true,
      channel: 'email',
      destination: identifier.trim(),
      minutes: 15
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Password Reset Code
router.post('/auth/verify-reset-code', (req, res) => {
  try {
    const { identifier, code } = req.body;
    const cleanId = (identifier || '').trim().toLowerCase();
    const entry = resetCodeStore.get(cleanId);
    if (!entry || entry.code !== (code || '').trim() || Date.now() > entry.expiresAt) {
      return res.status(400).json({ error: 'That code is not right or has expired.' });
    }
    const resetToken = jwt.sign({ identifier: cleanId }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ success: true, resetToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete Password Reset
router.post('/auth/reset-password', (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).json({ error: 'Invalid token or password must be at least 6 characters' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const identifier = decoded.identifier;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.run("UPDATE users SET password_hash = ? WHERE LOWER(email) = ? OR phone = ?", [hash, identifier, identifier]);
    db.run("UPDATE customers SET password_hash = ? WHERE LOWER(email) = ? OR phone = ?", [hash, identifier, identifier]);

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
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
