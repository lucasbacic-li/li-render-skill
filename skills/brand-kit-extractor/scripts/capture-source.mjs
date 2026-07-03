#!/usr/bin/env node
// capture-source.mjs — baseline GROUND-TRUTH pós-render de uma URL-fonte.
// Brand-agnóstico. Roda o JS da página (≠ curl) e grava em disco 3 artefatos por superfície:
//   <out>/<label>.rendered.html  — o DOM DEPOIS do JS (pega faixas injetadas por JS)
//   <out>/<label>.bands.json     — a TORRE de faixas em ordem, com {posição, fundo claro/escuro, texto, imgs}
//   <out>/<label>.full.png       — screenshot full-page (gate humano + diff de layout)
//
// É o baseline que a Skill 2 diffa (fail-closed: sem isto, o loop do comp NÃO computa "0 divergências").
// "Ausência" de uma faixa exige que ela não esteja no bands.json — nunca um grep no HTML cru.
//
// Uso:
//   node capture-source.mjs --url https://loja.com.br/ --out <kit>/reference --label home
//   node capture-source.mjs --url https://loja.com.br/cat --out <kit>/reference --label plp --mobile
//
// Requer: Google Chrome (ou Chromium) instalado. Zero deps npm (usa WebSocket/fetch nativos do Node ≥22).

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ---- args ----
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const URL_ = args.url, OUT = args.out, LABEL = args.label || 'home', MOBILE = !!args.mobile;
if (!URL_ || !OUT) { console.error('usage: --url <url> --out <dir> [--label home] [--mobile]'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const CHROME = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => p && existsSync(p));
if (!CHROME) { console.error('Chrome/Chromium não encontrado. Defina CHROME_BIN.'); process.exit(3); }

const PORT = 9200 + Math.floor((Date.now() % 300));
const profile = mkdtempSync(join(tmpdir(), 'capsrc-'));
const VW = MOBILE ? 390 : 1280, VH = MOBILE ? 844 : 900;

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  `--window-size=${VW},${VH}`, MOBILE ? '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' : '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function wsEndpoint() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(150);
  }
  throw new Error('CDP não subiu');
}

// minimal CDP client over native WebSocket
function cdpClient(url) {
  const ws = new WebSocket(url);
  let id = 0; const pending = new Map(); const events = new Map();
  const ready = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method && events.has(m.method)) events.get(m.method)(m.params);
  };
  return {
    ready,
    send: (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); }),
    once: (method) => new Promise(res => events.set(method, p => { events.delete(method); res(p); })),
    close: () => ws.close(),
  };
}

// extraction script (runs in page): scroll to force lazy-load, then emit ordered band tower.
const EXTRACT = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // force lazy-load: step-scroll the full height, then back to top
  const H = () => document.body.scrollHeight;
  for (let y = 0; y < H(); y += Math.round(innerHeight * 0.8)) { scrollTo(0, y); await sleep(120); }
  scrollTo(0, 0); await sleep(250);
  const lum = c => { const m = (c.match(/\\d+(\\.\\d+)?/g) || []).slice(0,3).map(Number); if (m.length < 3) return null;
    const [r,g,b] = m.map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*r+0.7152*g+0.0722*b; };
  // effective background: walk up until a non-transparent bg
  const bgOf = el => { let p = el; while (p) { const b = getComputedStyle(p).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; p = p.parentElement; } return 'rgb(255, 255, 255)'; };
  const vw = innerWidth;
  const fullWidthChildren = c => [...c.children].filter(ch => { const r = ch.getBoundingClientRect(); return r.width >= vw * 0.5 && r.height >= 24; });
  // Recursively break wrapper containers into the band tower: explode an element into its full-width
  // children when it is a CONTAINER (≥2 full-width children covering most of its height); stop at LEAF strips.
  function explode(el, depth) {
    // unwrap single full-width wrapper chains so a tall content stack isn't treated as one leaf
    let node = el;
    for (let g = 0; g < 8; g++) {
      const fw1 = fullWidthChildren(node);
      if (fw1.length === 1 && fw1[0].getBoundingClientRect().height >= node.getBoundingClientRect().height * 0.8) node = fw1[0]; else break;
    }
    const r = node.getBoundingClientRect();
    const fw = fullWidthChildren(node);
    const cover = fw.reduce((s, c) => s + c.getBoundingClientRect().height, 0);
    if (depth < 7 && fw.length >= 2 && cover >= r.height * 0.45) return fw.flatMap(c => explode(c, depth + 1));
    return [node];
  }
  let picked = explode(document.body, 0);
  const seen = new Set();
  picked = picked.filter(el => { if (seen.has(el)) return false; seen.add(el); return el.getBoundingClientRect().height >= 24; }).slice(0, 80);

  return picked.map((el, i) => {
    const r = el.getBoundingClientRect(), bg = bgOf(el), L = lum(bg);
    const text = (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 160);
    const imgs = [...el.querySelectorAll('img')].map(im => im.currentSrc || im.src).filter(Boolean);
    const bgImgs = [...el.querySelectorAll('*')].map(n => getComputedStyle(n).backgroundImage).filter(s => s && s !== 'none').slice(0, 4);
    return { i, tag: el.tagName.toLowerCase(), classes: (el.className && String(el.className).slice(0, 80)) || '',
      top: Math.round(el.offsetTop), height: Math.round(r.height),
      bg, mode: L == null ? 'unknown' : (L > 0.5 ? 'light' : 'dark'),
      heading: text, imgCount: imgs.length, imgs: imgs.slice(0, 6), bgImages: bgImgs };
  });
})()`;

(async () => {
  const cdp = cdpClient(await wsEndpoint());
  await cdp.ready;
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  if (MOBILE) await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 2, mobile: true });
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: URL_ });
  await Promise.race([loaded, sleep(20000)]);
  await sleep(4000); // settle JS-injected content (template-literal banners etc.)

  // bands + post-JS DOM
  const evalRes = await cdp.send('Runtime.evaluate', { expression: EXTRACT, awaitPromise: true, returnByValue: true });
  const bands = evalRes.result?.value || [];
  const domRes = await cdp.send('Runtime.evaluate', { expression: 'document.documentElement.outerHTML', returnByValue: true });

  writeFileSync(join(OUT, `${LABEL}.bands.json`), JSON.stringify({ url: URL_, label: LABEL, viewport: MOBILE ? 'mobile' : 'desktop', captured_at: new Date().toISOString().slice(0, 10), band_count: bands.length, bands }, null, 2));
  writeFileSync(join(OUT, `${LABEL}.rendered.html`), domRes.result?.value || '');

  // full-page screenshot
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  writeFileSync(join(OUT, `${LABEL}.full.png`), Buffer.from(shot.data, 'base64'));

  cdp.close(); chrome.kill();
  // summary to stdout
  console.log(JSON.stringify({
    ok: true, out: OUT, label: LABEL, viewport: MOBILE ? 'mobile' : 'desktop',
    band_count: bands.length,
    bands: bands.map(b => ({ i: b.i, mode: b.mode, h: b.height, tag: b.tag, head: b.heading.slice(0, 60) })),
  }, null, 2));
  process.exit(0);
})().catch(e => { console.error('FAIL:', e.message); try { chrome.kill(); } catch {} process.exit(1); });
