const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401));
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

module.exports = { auth };
