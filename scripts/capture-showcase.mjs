import { preview } from 'vite';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const server = await preview({ configFile: fileURLToPath(new URL('../showcase/vite.config.js', import.meta.url)), preview: { port: 5188 } });
const url = 'http://localhost:5188/mertlebot/';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1200 }, deviceScaleFactor: 1.5 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.wiregen-transform-group', { timeout: 15000 });
  await page.waitForTimeout(500);
  const out = fileURLToPath(new URL('../docs/screenshots/showcase.png', import.meta.url));
  await page.screenshot({ path: out, fullPage: true });
  console.log('SVG present:', await page.locator('.wiregen-transform-group').count(), '| errors:', JSON.stringify(errs));
  console.log('wrote', out);
} finally { await browser.close(); await server.httpServer.close(); }
