// Converte dist/index.html (documento completo do Vite) no fragmento que o Artifact espera.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
const pick = (re) => (src.match(re) || [])[0] || '';
const title = pick(/<title>[\s\S]*?<\/title>/);
const style = pick(/<style>[\s\S]*?<\/style>/);
const scripts = src.match(/<script type="module"[\s\S]*?<\/script>/g) || [];
const body = (src.match(/<body>([\s\S]*?)<\/body>/) || [])[1] || '';
const out = [
  title,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />',
  style,
  body.trim(),
  ...scripts,
].join('\n');
fs.writeFileSync(path.join(__dirname, '..', 'dist', 'polis.html'), out);
console.log('dist/polis.html', (out.length / 1024).toFixed(0), 'kB');
