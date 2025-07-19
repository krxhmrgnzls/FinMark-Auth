const http = require('http');
const url = require('url');

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
  
  console.log(`Gateway: ${req.method} ${path}`);

  // Health check
  if (path === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      service: 'API Gateway',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Forward auth requests to auth service
  if (path.startsWith('/auth/')) {
    const authPath = path.replace('/auth', '');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: authPath,
      method: req.method,
      headers: req.headers
    };

    const authReq = http.request(options, (authRes) => {
      res.writeHead(authRes.statusCode, authRes.headers);
      authRes.pipe(res);
    });

    req.pipe(authReq);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

server.listen(3000, () => {
  console.log('API Gateway running on port 3000');
});