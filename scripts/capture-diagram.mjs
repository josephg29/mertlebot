// Mounts the real WiringCanvas component in headless chromium (so onMount layout
// runs) with a sample diagram, and screenshots it. No Anthropic API needed —
// this is the genuine wiring engine output, not a mockup.
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

mkdirSync(new URL('../docs/screenshots/', import.meta.url), { recursive: true });

const vite = await createServer({
  configFile: fileURLToPath(new URL('./diagram-preview/vite.preview.config.js', import.meta.url)),
  mode: 'production',
  logLevel: 'error',
});
await vite.listen();
const url = 'http://localhost:5199/index.html';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('.wiregen-transform-group', { timeout: 15000 });
  // Hide interactive chrome so the shot is just the circuit.
  await page.addStyleTag({ content: '.wiregen-controls,.wiregen-scale,.wiregen-legend{display:none!important}' });
  await page.waitForTimeout(400);
  // Clip tightly to the rendered content with a little padding.
  const box = await page.locator('.wiregen-transform-group').boundingBox();
  const pad = 28;
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: Math.min(960, box.width + pad * 2),
    height: Math.min(640, box.height + pad * 2),
  };
  const out = fileURLToPath(new URL('../docs/screenshots/wiring-engine.png', import.meta.url));
  await page.screenshot({ path: out, clip });
  console.log('wrote', out, JSON.stringify(clip));
} finally {
  await browser.close();
  await vite.close();
}
