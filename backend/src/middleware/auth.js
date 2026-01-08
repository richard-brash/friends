import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'friends-outreach-jwt-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  console.log('🔍 Auth check - Headers:', JSON.stringify(req.headers, null, 2));
  const authHeader = req.headers['authorization'];
  console.log('🔍 Auth header value:', authHeader);
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log('🔍 Extracted token:', token ? token.substring(0, 20) + '...' : 'NULL');

  if (!token) {
    console.log('🚫 No token provided for:', req.method, req.originalUrl);
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('🚫 Token verification failed for:', req.method, req.originalUrl);
      console.log('   Error:', err.message);
      console.log('   Token (first 20 chars):', token.substring(0, 20) + '...');
      console.log('   JWT_SECRET set:', !!JWT_SECRET);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Optional authentication (for endpoints that work with or without auth)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  
  next();
};

export {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  JWT_SECRET
};