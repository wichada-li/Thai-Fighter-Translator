/**
 * server.js — Claude Cowork v.2
 * Starts Python romanize.py on port 3001, serves index.html on port 3000
 */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { spawn } = require('child_process');

const PORT    = process.env.PORT || 3000;
const PY_PORT = 3001;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.ico' : 'image/x-icon',
  '.png' : 'image/png',
};

// ── Spawn Python romanize server ─────────────────────────────────
const py = spawn('python', [path.join(__dirname, 'romanize.py')], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
});
py.stdout.on('data', d => process.stdout.write(d));
py.stderr.on('data', d => process.stderr.write(d));
py.on('exit', code => {
  if (code !== null) console.log(`  [WARN] Python exited (${code})`);
});

async function callPython(name) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ name });
    const req = http.request(
      { hostname:'localhost', port:PY_PORT, path:'/', method:'POST',
        headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} },
      res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.write(body); req.end();
  });
}

// ── HTTP Server ───────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API: translate name
  if (req.method === 'POST' && url === '/api/translate') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { name } = JSON.parse(body);
        let pyResult = null;
        for (let i = 0; i < 12; i++) {
          try { pyResult = await callPython(name); break; }
          catch { await new Promise(r => setTimeout(r, 500)); }
        }
        if (!pyResult || !pyResult.ok) throw new Error('Python ยังไม่พร้อม — ลองใหม่อีกครั้ง');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result: pyResult.result }));
      } catch(err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Static files
  let filePath = url === '/' ? '/index.html' : url;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('404 Not Found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ================================');
  console.log('  Thai Fighter Name Translator');
  console.log('  Claude Cowork v.2');
  console.log('  ================================');
  console.log(`  URL: http://localhost:${PORT}`);
  console.log('  Ctrl+C to stop');
  console.log('');
});

process.on('SIGINT', () => { py.kill(); process.exit(); });
process.on('SIGTERM', () => { py.kill(); process.exit(); });
