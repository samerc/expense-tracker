const { verifyToken } = require('../utils/auth');

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Require super admin role
function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Forbidden: Super admin access required' 
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin
};
