// Quick DOM inspector — runs from project root where playwright is installed
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS = '/Users/josephgannon/mertlereskin/artifacts/e2e-run-1775285532/screenshots';
fs.mkdirSync(SCREENSHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGE ERR: ' + err.message));

  const resp = await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('STATUS:', resp.status());
  await page.waitForTimeout(2000);

  await page.screenshot({ path: SCREENSHOTS + '/00-initial.png', fullPage: true });
  console.log('Screenshot taken: 00-initial.png');

  // List all IDs
  const ids = await page.evaluate(() => {
    return [...document.querySelectorAll('[id]')].map(el => el.id);
  });
  console.log('\n--- ALL IDs ---');
  console.log(JSON.stringify(ids, null, 2));

  // Check visibility of main containers
  const selectors = ['#hero', '#heroInput', '#heroGo', '#chatInput', '#sendBtn', '#buildOutput', '#histPanel', '#modalBg', '#btnSettings', '#btnNew', '#btnHistory'];
  console.log('\n--- SELECTOR EXISTENCE ---');
  for (const sel of selectors) {
    const el = await page.$(sel);
    const visible = el ? await el.isVisible() : false;
    console.log(`  ${sel}: ${el ? (visible ? 'VISIBLE' : 'EXISTS (hidden)') : 'NOT FOUND'}`);
  }

  // Page text
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log('\n--- PAGE TEXT ---');
  console.log(text);

  console.log('\n--- CONSOLE ERRORS ---');
  if (errors.length === 0) console.log('(none)');
  errors.forEach(e => console.log(' -', e));

  await browser.close();
})();
