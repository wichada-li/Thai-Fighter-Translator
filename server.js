/**
 * server.js — Claude Cowork v.2
 * Pure Node.js — no Python dependency
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');
const {translateName} = require('./romanize.js');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.ico' : 'image/x-icon',
  '.png' : 'image/png',
};

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API
  if (req.method === 'POST' && url === '/api/translate') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const {name} = JSON.parse(body);
        const result = translateName(name);
        if (!result) throw new Error('empty input');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ok: true, result}));
      } catch(e) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ok: false, error: e.message}));
      }
    });
    return;
  }

  // Static files
  let filePath = url === '/' ? '/index.html' : url;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, {'Content-Type': MIME[ext] || 'text/plain'});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ================================');
  console.log('  Thai Fighter Name Translator');
  console.log('  Claude Cowork v.2 (Pure Node.js)');
  console.log('  ================================');
  console.log(`  URL: http://localhost:${PORT}`);
  console.log('');
});
