/**
 * server.js — Claude Cowork v.2
 * Calls romanize.py per-request (execFile) — works on Railway without persistent Python server
 */
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { execFile } = require('child_process');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.ico' : 'image/x-icon',
  '.png' : 'image/png',
};

// Find Python executable
const PYTHON_CANDIDATES = process.platform === 'win32'
  ? ['python', 'python3']
  : ['python3', 'python', '/usr/bin/python3', '/usr/local/bin/python3'];

let PYTHON = null;

function findPython(candidates, cb) {
  if (!candidates.length) { cb(null); return; }
  const [cmd, ...rest] = candidates;
  execFile(cmd, ['--version'], (err) => {
    if (!err) { cb(cmd); }
    else { findPython(rest, cb); }
  });
}

function callPython(name, cb) {
  if (!PYTHON) { cb(new Error('Python not found'), null); return; }
  const input = JSON.stringify({ name });
  const proc  = execFile(
    PYTHON,
    [path.join(__dirname, 'romanize_once.py')],
    { env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, timeout: 10000 },
    (err, stdout, stderr) => {
      if (err) { cb(err, null); return; }
      try { cb(null, JSON.parse(stdout.trim())); }
      catch(e) { cb(e, null); }
    }
  );
  proc.stdin.write(input);
  proc.stdin.end();
}

// ── HTTP Server ───────────────────────────────────────────────────
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
        const { name } = JSON.parse(body);
        callPython(name, (err, result) => {
          if (err) {
            res.writeHead(500, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ ok: false, error: err.message }));
          } else {
            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ ok: true, result }));
          }
        });
      } catch(e) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ ok: false, error: 'Bad request' }));
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

// Start
findPython(PYTHON_CANDIDATES, (found) => {
  PYTHON = found;
  console.log(found ? `  Python: ${found}` : '  WARNING: Python not found');

  server.listen(PORT, () => {
    console.log('');
    console.log('  ================================');
    console.log('  Thai Fighter Name Translator');
    console.log('  Claude Cowork v.2');
    console.log('  ================================');
    console.log(`  URL: http://localhost:${PORT}`);
    console.log('');
  });
});
