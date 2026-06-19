// Screenshots the live landing page of the production server.
// Usage: node scripts/capture-app.mjs <baseUrl>
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:3000';
mkdirSync(new URL('../docs/screenshots/', import.meta.url), { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
  await page.goto(base, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(800);
  const landing = fileURLToPath(new URL('../docs/screenshots/landing.png', import.meta.url));
  await page.screenshot({ path: landing });
  console.log('wrote', landing);

  // Switch to the BUILD view and capture the prompt form.
  const buildNav = page.getByRole('button', { name: /build/i }).first();
  if (await buildNav.count()) {
    await buildNav.click();
    await page.waitForTimeout(700);
    const build = fileURLToPath(new URL('../docs/screenshots/build.png', import.meta.url));
    await page.screenshot({ path: build });
    console.log('wrote', build);
  }
} finally {
  await browser.close();
}
