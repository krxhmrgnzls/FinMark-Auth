const jwt = require('jsonwebtoken');

// Simple in-memory cache for token validation
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No valid token provided. Please include a Bearer token in the Authorization header.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Check cache first for performance
    const cached = tokenCache.get(token);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      req.user = cached.user;
      console.log(`Token validated from cache for user: ${req.user.email}`);
      return next();
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
      console.log(`Token verified for user: ${decoded.email}`);
    } catch (jwtError) {
      console.log(`Invalid token attempt: ${jwtError.message}`);
      return res.status(401).json({ 
        error: 'Invalid token', 
        message: 'The provided token is invalid or expired. Please login again.' 
      });
    }

    // Cache the validated token
    tokenCache.set(token, {
      user: decoded,
      timestamp: Date.now()
    });

    // Add user info to request object
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred while processing your authentication'
    });
  }
};

module.exports = authMiddleware;