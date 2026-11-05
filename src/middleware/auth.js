const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ecom_jwt_key_2026_bd';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && (req.cookies.token || req.cookies.pharma_token)) {
    token = req.cookies.token || req.cookies.pharma_token;
  } else if (req.headers && req.headers['cookie']) {
    const cookies = req.headers['cookie'].split(';').reduce((acc, c) => {
      const idx = c.indexOf('=');
      if (idx !== -1) {
        const k = c.slice(0, idx).trim();
        const v = c.slice(idx + 1).trim();
        acc[k] = decodeURIComponent(v);
      }
      return acc;
    }, {});
    token = cookies.token || cookies.pharma_token;
  } else if (req.query && (req.query.token || req.query.auth)) {
    token = req.query.token || req.query.auth;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (roles.length && !roles.includes(req.user.role) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole
};
