const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'poolcasino_secret';

function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authorization.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = {
      id: payload.id,
      username: payload.username,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = authMiddleware;
