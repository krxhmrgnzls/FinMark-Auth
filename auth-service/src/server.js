// auth-service/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Initialize database FIRST
require('./config/database');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Auth Service',
    timestamp: new Date().toISOString()
  });
});

const authController = require('./controllers/authController');
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);
app.post('/api/logout', authController.logout);
app.get('/api/verify', authController.verifyToken);

app.get('/api/users', async (req, res) => {
  try {
    const db = require('./config/database');
    const users = db.prepare('SELECT id, email, full_name, role, created_at FROM users').all();
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/users', (req, res) => {
  try {
    const db = require('./config/database');
    const users = db.prepare('SELECT id, email, full_name, created_at FROM users').all();
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>FinMark Users</title>
      <style>
        body { font-family: Arial; margin: 40px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .success { color: green; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>FinMark Users in Database</h1>
      <p class="success">Database location: ${db.name}</p>
    `;
    
    if (users.length === 0) {
      html += '<p class="error">No users found in database!</p>';
    } else {
      html += `
        <p class="success">Found ${users.length} users:</p>
        <table>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Full Name</th>
            <th>Created At</th>
          </tr>
      `;
      
      users.forEach(user => {
        html += `
          <tr>
            <td>${user.id}</td>
            <td>${user.email}</td>
            <td>${user.full_name}</td>
            <td>${user.created_at}</td>
          </tr>
        `;
      });
      
      html += '</table>';
    }
    
    html += `
      <br>
      <h2>Add New User</h2>
      <div id="simpleForm">
        <input type="email" id="email" placeholder="Email" required><br><br>
        <input type="password" id="password" placeholder="Password" required><br><br>
        <input type="text" id="full_name" placeholder="Full Name" required><br><br>
        <button onclick="registerUser()">Register User</button>
      </div>
      
      <div id="result"></div>
      
      <script>
        async function registerUser() {
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const full_name = document.getElementById('full_name').value;
          
          try {
            const response = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, full_name })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              document.getElementById('result').innerHTML = '<p class="success">User registered! Refresh page to see.</p>';
              setTimeout(() => location.reload(), 1500);
            } else {
              document.getElementById('result').innerHTML = '<p class="error">Error: ' + data.error + '</p>';
            }
          } catch (error) {
            document.getElementById('result').innerHTML = '<p class="error">Error: ' + error.message + '</p>';
          }
        }
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).send('<h1>Error</h1><p>' + error.message + '</p>');
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
  console.log(`Database initialized and ready`);
  console.log(`View users at http://localhost:${PORT}/users`);
  console.log(`Health check at http://localhost:${PORT}/health`);
});

module.exports = app;