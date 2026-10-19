/* eslint-disable */
// Screenshots automáticos do jogo com Chromium headless (QA visual).
// Uso: node tools/shots.cjs [arquivo-de-cenarios.json] [--out dir]
// Cada cenário: { name, query, steps: [["wait",ms],["down","KeyZ"],["up","KeyZ"],["press","KeyZ"],["hold","ArrowUp",ms],["shot","nome"],["eval","js"]] }
const http = require('http');
const fs = require('fs');
const path = require('path');
const mod = require('@sparticuz/chromium');
const chromium = mod.default || mod;
const puppeteer = require('puppeteer-core');

const dist = path.join(__dirname, '..', 'dist');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : path.join(__dirname, '..', 'shots');
const scenarioFile = args.find((a) => a.endsWith('.json'));
fs.mkdirSync(outDir, { recursive: true });

const defaultScenarios = [
  { name: 'title', query: '', steps: [['wait', 1200], ['shot', 'title']] },
  { name: 'island', query: '?room=island&look=gray&name=???', steps: [['wait', 1500], ['shot', 'island_intro'], ['press', 'KeyZ'], ['wait', 300], ['press', 'KeyZ'], ['wait', 300], ['press', 'KeyZ'], ['wait', 500], ['shot', 'island'], ['hold', 'ArrowRight', 1500], ['shot', 'island_walk']] },
];

async function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(dist, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, r));
  return { server, port: server.address().port };
}

(async () => {
  const scenarios = scenarioFile ? JSON.parse(fs.readFileSync(scenarioFile, 'utf8')) : defaultScenarios;
  const { server, port } = await serve();
  const exe = await chromium.executablePath();
  const browser = await puppeteer.launch({
    executablePath: exe,
    args: [...chromium.args, '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
    headless: 'shell',
    defaultViewport: { width: 960, height: 540, deviceScaleFactor: 1 },
  });
  let failures = 0;
  for (const sc of scenarios) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
    });
    await page.goto(`http://127.0.0.1:${port}/${sc.query || ''}`, { waitUntil: 'load' });
    await page.waitForSelector('canvas', { timeout: 15000 }).catch(() => errors.push('sem canvas'));
    await page.evaluate(() => document.querySelector('canvas')?.focus());
    for (const step of sc.steps) {
      const [op, a, b] = step;
      if (op === 'wait') await new Promise((r) => setTimeout(r, a));
      else if (op === 'down') await page.keyboard.down(a);
      else if (op === 'up') await page.keyboard.up(a);
      else if (op === 'press') {
        await page.keyboard.down(a);
        await new Promise((r) => setTimeout(r, 60));
        await page.keyboard.up(a);
      } else if (op === 'hold') {
        await page.keyboard.down(a);
        await new Promise((r) => setTimeout(r, b));
        await page.keyboard.up(a);
      } else if (op === 'shot') {
        const file = path.join(outDir, `${a}.png`);
        await page.screenshot({ path: file });
        console.log('shot', file);
      } else if (op === 'eval') {
        const v = await page.evaluate(a);
        console.log('eval', a, '=>', JSON.stringify(v));
      }
    }
    if (errors.length) {
      failures++;
      console.log(`[${sc.name}] erros de console:`);
      for (const e of errors.slice(0, 15)) console.log('   ', e);
    } else console.log(`[${sc.name}] ok, sem erros de console`);
    await page.close();
  }
  await browser.close();
  server.close();
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
