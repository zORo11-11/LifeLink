const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lifelink_super_secret_jwt_key_2026';

// Middleware to verify JWT token in Authorization header
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authorization token missing or malformed.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, email, ... }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

// Middleware to require specific role ('donor' or 'hospital')
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Action requires ${role} privileges.`
      });
    }
    next();
  };
};

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.requireRole = requireRole;
module.exports.JWT_SECRET = JWT_SECRET;
