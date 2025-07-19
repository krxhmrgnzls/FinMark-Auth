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

    console.log('Registration attempt for:', email);

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'full_name']
      });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    const insertUser = db.transaction(() => {
      const insert = db.prepare(
        'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)'
      );
      
      const result = insert.run(email, hashedPassword, full_name);
      
  
      const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      
      if (!newUser) {
        throw new Error('User creation failed - could not retrieve new user');
      }
      
      console.log('User created in database:', {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name
      });
      
      return newUser;
    });

    const newUser = insertUser();

    db.pragma('wal_checkpoint(RESTART)');
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: newUser.id,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const startTime = Date.now();

    console.log(' Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Check cache first
    const cachedUser = cache.get(email);
    if (cachedUser && await bcrypt.compare(password, cachedUser.password)) {
      const token = generateToken(cachedUser);
      
      console.log(`Login completed in ${Date.now() - startTime}ms (cached)`);
      
      return res.json({
        token,
        user: {
          id: cachedUser.id,
          email: cachedUser.email,
          full_name: cachedUser.full_name
        },
        loginTime: `${Date.now() - startTime}ms`,
        cached: true
      });
    }

    // Database lookup
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    cache.set(email, user);

    const token = generateToken(user);
    const createSession = db.transaction(() => {
      const insertSession = db.prepare(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
      );
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      insertSession.run(user.id, token, expiresAt.toISOString());
    });

    createSession();

    console.log(`Login completed in ${Date.now() - startTime}ms`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      loginTime: `${Date.now() - startTime}ms`,
      cached: false
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const result = db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      console.log(`🚪 Logout: Removed ${result.changes} session(s)`);
      
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

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    
    const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")').get(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    
    res.json({
      valid: true,
      user: decoded,
      sessionActive: !!session
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, full_name, role, created_at FROM users').all();
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error(' Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};