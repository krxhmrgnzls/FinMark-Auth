const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const NodeCache = require('node-cache');

// Initialize cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insert = db.prepare(
      'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)'
    );
    const result = insert.run(email, hashedPassword, full_name);

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const startTime = Date.now();

    // Check cache first
    const cachedUser = cache.get(email);
    if (cachedUser && await bcrypt.compare(password, cachedUser.password)) {
      const token = generateToken(cachedUser);
      
      console.log(`✅ Login completed in ${Date.now() - startTime}ms (cached)`);
      
      return res.json({
        token,
        user: {
          id: cachedUser.id,
          email: cachedUser.email,
          full_name: cachedUser.full_name
        },
        loginTime: `${Date.now() - startTime}ms`
      });
    }

    // Database lookup
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Cache the user
    cache.set(email, user);

    // Generate token
    const token = generateToken(user);

    // Store session
    const insertSession = db.prepare(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
    );
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    insertSession.run(user.id, token, expiresAt.toISOString());

    console.log(`✅ Login completed in ${Date.now() - startTime}ms`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      },
      loginTime: `${Date.now() - startTime}ms`
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Remove session from database
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Verify token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    
    res.json({
      valid: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};