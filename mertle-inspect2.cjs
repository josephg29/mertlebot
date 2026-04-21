// Inspect the clarify dialog structure
const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOTS = '/Users/josephgannon/mertlereskin/artifacts/e2e-run-1775285532/screenshots';
fs.mkdirSync(SCREENSHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Submit build
  await page.fill('#heroInput', 'blink an LED on Arduino Uno');
  await page.click('#heroGo');
  await page.waitForTimeout(2000);

  // Check clarify dialog structure
  const clarifyBg = await page.$('#clarifyBg');
  console.log('\n--- CLARIFY BG ---');
  console.log('exists:', !!clarifyBg);

  if (clarifyBg) {
    const isOpen = await clarifyBg.evaluate(el => el.classList.contains('open'));
    console.log('open class:', isOpen);

    const html = await clarifyBg.evaluate(el => el.innerHTML.substring(0, 3000));
    console.log('HTML:', html);
  }

  // All IDs on page
  const ids = await page.evaluate(() => [...document.querySelectorAll('[id]')].map(el => el.id));
  console.log('\nAll IDs:', JSON.stringify(ids));

  // All classes containing 'clarify'
  const clarifyEls = await page.evaluate(() => {
    return [...document.querySelectorAll('[class*="clarify"], [id*="clarify"]')].map(el => ({
      tag: el.tagName,
      id: el.id,
      classes: el.className,
      text: el.innerText?.substring(0, 100)
    }));
  });
  console.log('\nClarify elements:', JSON.stringify(clarifyEls, null, 2));

  await page.screenshot({ path: SCREENSHOTS + '/clarify-state.png' });
  console.log('\nScreenshot saved.');

  await browser.close();
})();
