const http = require('http');
const url = require('url');

// Simple in-memory user storage for testing
let users = [];
let currentId = 1;

function handleRequest(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  console.log(`${req.method} ${path}`);

  // Health check
  if (path === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      service: 'Auth Service',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Registration
  if (path === '/api/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const userData = JSON.parse(body);
        const newUser = {
          id: currentId++,
          email: userData.email,
          full_name: userData.full_name,
          password: userData.password // In real app, hash this!
        };
        users.push(newUser);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'User registered successfully',
          userId: newUser.id
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Login
  if (path === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const loginData = JSON.parse(body);
        const user = users.find(u => u.email === loginData.email && u.password === loginData.password);
        
        if (user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            token: 'fake-token-for-testing',
            user: { id: user.id, email: user.email, full_name: user.full_name }
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

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
      <form action="/api/register" method="POST" style="display: none;" id="registerForm">
        <input type="email" id="email" placeholder="Email" required><br><br>
        <input type="password" id="password" placeholder="Password" required><br><br>
        <input type="text" id="full_name" placeholder="Full Name" required><br><br>
        <button type="submit">Register User</button>
      </form>
      
      <div id="simpleForm">
        <input type="email" id="simpleEmail" placeholder="Email" required><br><br>
        <input type="password" id="simplePassword" placeholder="Password" required><br><br>
        <input type="text" id="simpleName" placeholder="Full Name" required><br><br>
        <button onclick="registerUser()">Register User</button>
      </div>
      
      <div id="result"></div>
      
      <script>
        async function registerUser() {
          const email = document.getElementById('simpleEmail').value;
          const password = document.getElementById('simplePassword').value;
          const full_name = document.getElementById('simpleName').value;
          
          try {
            const response = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, full_name })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              document.getElementById('result').innerHTML = '<p class="success">User registered! Refresh page to see.</p>';
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

const server = http.createServer(handleRequest);

server.listen(3001, () => {
  console.log('Auth Service running on port 3001');
});