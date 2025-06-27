const http = require('http');
const url = require('url');

// Simple in-memory user storage
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
          password: userData.password
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

  // Login - MOVED INSIDE THE FUNCTION
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
            token: 'fake-jwt-token-for-testing',
            user: {
              id: user.id,
              email: user.email,
              full_name: user.full_name
            },
            loginTime: '< 1s'
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

const server = http.createServer(handleRequest);

server.listen(3001, () => {
  console.log('Auth Service running on port 3001');
});
