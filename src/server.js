require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const publicRoutes = require('./routes/public');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const posRoutes = require('./routes/pos');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Asset Pipeline
app.use('/assets', express.static(path.join(__dirname, 'public/assets'), { maxAge: '1y' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), { maxAge: '1y' }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes Mounting
app.use('/api', publicRoutes);
app.use('/api', ordersRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pos', posRoutes);

// SPA Fallback for React Router (e.g., /shop, /cart, /admin, /pos, /product/:slug, /lp/:slug)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` E-Commerce & POS Server Reconstructed & Running!   `);
    console.log(` URL: http://localhost:${PORT}                       `);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
