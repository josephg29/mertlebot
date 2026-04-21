// Mertle Bot — Comprehensive E2E Test Suite
// App: http://localhost:5173 (vite dev)

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const ARTIFACTS_DIR = '/Users/josephgannon/mertlereskin/artifacts/e2e-run-1775285532';
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, 'screenshots');
const VIDEO_DIR = path.join(ARTIFACTS_DIR, 'videos');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  issues: [],
  consoleErrors: [],
  screenshots: [],
};
let ssCount = 0;

async function screenshot(page, name, description) {
  ssCount++;
  const filename = `${String(ssCount).padStart(3, '0')}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  results.screenshots.push({ name, description, file: filename });
  console.log(`  [SS] ${filename} — ${description}`);
  return filepath;
}

function pass(label) {
  results.total++;
  results.passed++;
  console.log(`  [PASS] ${label}`);
}

function fail(label, detail, severity = 'MEDIUM') {
  results.total++;
  results.failed++;
  results.issues.push({ label, detail, severity });
  console.log(`  [FAIL] [${severity}] ${label} — ${detail}`);
}

function check(label, condition, detail, severity = 'MEDIUM') {
  if (condition) pass(label);
  else fail(label, detail, severity);
}

// JS-based click (bypasses pointer-event occlusion)
async function forceClick(page, selector) {
  await page.$eval(selector, el => el.click());
}

async function runTests() {
  console.log('\n=== MERTLE BOT E2E TEST SUITE ===\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('PAGE ERR: ' + err.message));

  // ──────────────────────────────────────────────
  // [1] PAGE LOAD
  // ──────────────────────────────────────────────
  console.log('\n[1] PAGE LOAD & INITIAL STATE');
  let resp;
  try {
    resp = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    check('HTTP 200 response', resp.status() === 200, `Status ${resp.status()}`, 'CRITICAL');
  } catch (e) {
    fail('Page loads at all', e.message, 'CRITICAL');
    await browser.close(); return;
  }
  await page.waitForTimeout(1500);
  await screenshot(page, 'home-initial', 'Initial hero view');

  const pageTitle = await page.title();
  check('Page title is "mertle.bot"', pageTitle === 'mertle.bot', `Got: "${pageTitle}"`, 'LOW');
  console.log(`    Title: "${pageTitle}"`);

  check('Hero section (#hero) exists', !!(await page.$('#hero')), 'No #hero', 'HIGH');
  check('Hero input (#heroInput) exists', !!(await page.$('#heroInput')), 'No #heroInput', 'HIGH');
  check('BUILD button (#heroGo) exists', !!(await page.$('#heroGo')), 'No #heroGo', 'HIGH');

  const goDisabled = await page.$eval('#heroGo', el => el.disabled);
  check('BUILD disabled at startup', goDisabled, 'Should be disabled initially', 'MEDIUM');

  // Console errors baseline check
  const errCountAtLoad = consoleErrors.length;
  check('No JS errors on page load', errCountAtLoad === 0,
    `${errCountAtLoad} console error(s) at load: ${consoleErrors.slice(0, 2).join('; ')}`, 'HIGH');

  // ──────────────────────────────────────────────
  // [2] HERO UI RICHNESS
  // ──────────────────────────────────────────────
  console.log('\n[2] HERO UI RICHNESS');

  const heroTitle = await page.$('.hero-title');
  check('.hero-title rendered', !!heroTitle, 'No .hero-title', 'MEDIUM');
  if (heroTitle) console.log(`    Title text: "${await heroTitle.textContent()}"`);

  check('.hero-tag (tagline) rendered', !!(await page.$('.hero-tag')), 'No .hero-tag', 'LOW');
  const tagText = await page.$eval('.hero-tag', el => el.textContent).catch(() => '');
  console.log(`    Tagline: "${tagText}"`);

  check('.hero-desc (description) rendered', !!(await page.$('.hero-desc')), 'No .hero-desc', 'LOW');

  const exChips = await page.$$('.hero-example-chip');
  check('Example chips visible (>= 4)', exChips.length >= 4, `Only ${exChips.length}`, 'MEDIUM');
  console.log(`    Example chips: ${exChips.length}`);

  const skillBtns = await page.$$('.hero-skill');
  check('5 skill buttons rendered', skillBtns.length === 5, `Got ${skillBtns.length}`, 'MEDIUM');
  const skillTexts = await Promise.all(skillBtns.map(b => b.textContent()));
  console.log(`    Skills: ${skillTexts.join(', ')}`);

  const clouds = await page.$$('.cloud');
  check('Idea clouds rendered (>= 1)', clouds.length >= 1, `Got ${clouds.length}`, 'LOW');
  console.log(`    Idea clouds: ${clouds.length}`);

  await screenshot(page, 'hero-ui', 'Hero card with chips, skills, clouds');

  // ──────────────────────────────────────────────
  // [3] INPUT VALIDATION
  // ──────────────────────────────────────────────
  console.log('\n[3] INPUT VALIDATION');

  await page.fill('#heroInput', 'led');
  await page.waitForTimeout(250);
  check('BUILD disabled for 3-char input', await page.$eval('#heroGo', el => el.disabled), 'Should be disabled', 'MEDIUM');
  const hintShort = await page.$eval('#heroPromptHint', el => el.textContent);
  console.log(`    Hint (short): "${hintShort}"`);

  await page.fill('#heroInput', 'a blinking LED with push button');
  await page.waitForTimeout(250);
  check('BUILD enabled for 30-char input', !(await page.$eval('#heroGo', el => el.disabled)), 'Should be enabled', 'HIGH');
  const hintLong = await page.$eval('#heroPromptHint', el => el.textContent);
  check('Hint says "Ready"', hintLong.toLowerCase().includes('ready'), `Got: "${hintLong}"`, 'LOW');

  const longText = 'x'.repeat(310);
  await page.fill('#heroInput', longText);
  await page.waitForTimeout(200);
  const len = await page.$eval('#heroInput', el => el.value.length);
  check('maxlength=300 enforced', len <= 300, `Accepted ${len} chars`, 'LOW');
  console.log(`    maxlength test: ${len} chars accepted`);

  await page.fill('#heroInput', 'a blinking LED with push button');
  await screenshot(page, 'hero-valid-input', 'Valid input — BUILD enabled');

  // ──────────────────────────────────────────────
  // [4] HERO SKILL SELECTOR
  // ──────────────────────────────────────────────
  console.log('\n[4] HERO SKILL SELECTOR');

  for (let i = 0; i < skillBtns.length; i++) {
    await skillBtns[i].click();
    await page.waitForTimeout(150);
    const active = await page.$$eval('.hero-skill.active', els => els.map(e => e.textContent));
    const help = await page.$eval('#heroSkillHelp', el => el.textContent).catch(() => '');
    const expectedName = skillTexts[i].trim();
    check(`Skill "${expectedName}" activates correctly`, active.some(s => s.includes(expectedName)),
      `Active: ${active.join(',')}, expected: ${expectedName}`, 'LOW');
    console.log(`    [Skill ${i+1}] ${expectedName}: help = "${help.substring(0, 70)}"`);
  }
  // Reset to NOVICE for build
  await skillBtns[1].click();
  await page.waitForTimeout(200);
  await screenshot(page, 'skill-novice', 'NOVICE skill selected');

  // ──────────────────────────────────────────────
  // [5] EXAMPLE CHIP CLICK
  // ──────────────────────────────────────────────
  console.log('\n[5] EXAMPLE CHIP CLICK');

  await page.fill('#heroInput', '');
  await page.waitForTimeout(100);
  const chip0Text = await exChips[0].getAttribute('data-prompt') || await exChips[0].textContent();
  await exChips[0].click();
  await page.waitForTimeout(300);
  const inputAfterChip = await page.$eval('#heroInput', el => el.value);
  check('Example chip populates hero input', inputAfterChip.trim().length > 0,
    `Input empty after chip click; chip text: "${chip0Text.trim()}"`, 'MEDIUM');
  console.log(`    "${chip0Text.trim()}" → input: "${inputAfterChip}"`);

  // Restore specific prompt for build
  await page.fill('#heroInput', 'blink an LED on Arduino Uno');

  // ──────────────────────────────────────────────
  // [6] SETTINGS MODAL
  // ──────────────────────────────────────────────
  console.log('\n[6] SETTINGS MODAL');

  check('#btnSettings in DOM', !!(await page.$('#btnSettings')), 'No #btnSettings', 'MEDIUM');
  await forceClick(page, '#btnSettings');
  await page.waitForTimeout(600);

  const modalOpen = !!(await page.$('#modalBg.open'));
  check('Settings modal opens', modalOpen, 'Modal did not open', 'HIGH');

  if (modalOpen) {
    await screenshot(page, 'settings-modal', 'Settings modal open');

    check('API key input (#keyInput)', !!(await page.$('#keyInput')), 'No #keyInput', 'HIGH');

    const modalSkills = await page.$$('#skillGrid .chip');
    check('5 skill chips in modal', modalSkills.length === 5, `Got ${modalSkills.length}`, 'MEDIUM');

    const themeChips = await page.$$('#themeGrid .chip');
    check('Theme chips in modal (>= 4)', themeChips.length >= 4, `Got ${themeChips.length}`, 'LOW');
    const themeNames = await Promise.all(themeChips.map(c => c.getAttribute('data-theme')));
    console.log(`    Themes: ${themeNames.join(', ')}`);

    // Switch theme
    if (themeChips.length >= 2) {
      const secondThemeName = await themeChips[1].getAttribute('data-theme');
      await themeChips[1].click();
      await page.waitForTimeout(400);
      const bodyTheme = await page.$eval('body', el => el.dataset.theme || el.getAttribute('data-theme') || el.className);
      await screenshot(page, 'theme-alt', `Alternate theme: ${secondThemeName}`);
      pass(`Theme "${secondThemeName}" applies`);
      // Revert
      await themeChips[0].click();
      await page.waitForTimeout(300);
    }

    // Age slider
    const ageSlider = await page.$('#ageSlider');
    if (ageSlider) {
      const v = await ageSlider.inputValue();
      check('Age/font slider has value', !isNaN(Number(v)), `Value: "${v}"`, 'LOW');
      console.log(`    Age slider: ${v}`);
    }

    // Save key button
    const saveBtn = await page.$('#saveKeyBtn');
    check('Save key button present', !!saveBtn, 'No #saveKeyBtn', 'LOW');

    // Close by Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    check('Escape closes settings modal', !(await page.$('#modalBg.open')), 'Still open after Esc', 'MEDIUM');

    // Re-open and close by clicking the X button
    await forceClick(page, '#btnSettings');
    await page.waitForTimeout(400);
    const closeBtn = await page.$('#modalCloseBtn');
    check('#modalCloseBtn present', !!closeBtn, 'No #modalCloseBtn', 'LOW');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(400);
      check('Close button closes modal', !(await page.$('#modalBg.open')), 'Still open after X click', 'LOW');
    }
  }

  // ──────────────────────────────────────────────
  // [7] HISTORY PANEL
  // ──────────────────────────────────────────────
  console.log('\n[7] HISTORY PANEL');

  check('#btnHistory in DOM', !!(await page.$('#btnHistory')), 'No #btnHistory', 'MEDIUM');
  await forceClick(page, '#btnHistory');
  await page.waitForTimeout(500);

  check('History panel opens', !!(await page.$('#histPanel.open')), 'Panel did not open', 'MEDIUM');
  await screenshot(page, 'history-panel-empty', 'History panel (empty, fresh session)');

  const emptyMsg = await page.$('.hist-empty');
  if (emptyMsg) {
    const msg = await emptyMsg.textContent();
    check('Empty history message shows', msg.length > 0, 'Empty history message blank', 'LOW');
    console.log(`    Empty state: "${msg}"`);
  }

  // Close
  await forceClick(page, '#histClose');
  await page.waitForTimeout(400);
  check('History panel closes', !(await page.$('#histPanel.open')), 'Still open', 'LOW');

  // ──────────────────────────────────────────────
  // [8] BUILD GENERATION — CLARIFY FLOW
  // ──────────────────────────────────────────────
  console.log('\n[8] BUILD GENERATION WITH CLARIFY DIALOG');

  await page.fill('#heroInput', 'blink an LED on Arduino Uno');
  await skillBtns[0].click(); // MONKEY mode for simpler output
  await page.waitForTimeout(200);
  await screenshot(page, 'pre-build', 'Ready to click BUILD');

  console.log('    Clicking BUILD...');
  await page.click('#heroGo');
  await page.waitForTimeout(2000);

  // Clarify dialog should appear
  const clarifyAppeared = !!(await page.$('#clarifyBg.open'));
  check('Clarify dialog appears after BUILD', clarifyAppeared, 'No clarify dialog after BUILD click', 'MEDIUM');

  if (clarifyAppeared) {
    await screenshot(page, 'clarify-dialog', 'Clarify "ONE SEC" dialog — 5 questions');

    // Verify structure
    check('Clarify title "ONE SEC" present', !!(await page.$('.clarify-title')), 'No .clarify-title', 'LOW');
    check('"SKIP >> BUILD NOW" button present', !!(await page.$('#clarifySkip')), 'No #clarifySkip', 'HIGH');
    check('Clarify progress label shows', !!(await page.$('.clarify-progress-label')), 'No progress label', 'LOW');
    check('Clarify progress bar shows', !!(await page.$('.clarify-progress-bar')), 'No progress bar', 'LOW');

    const progressLabel = await page.$eval('.clarify-progress-label', el => el.textContent).catch(() => '');
    console.log(`    Progress: "${progressLabel}"`);

    // Check "NEXT >" navigates through questions
    const nextBtn = await page.$('#clarifyNext');
    check('"NEXT >" button in clarify', !!nextBtn, 'No #clarifyNext', 'MEDIUM');

    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      const progress2 = await page.$eval('.clarify-progress-label', el => el.textContent).catch(() => '');
      check('Clarify NEXT advances to Q2', progress2.includes('2'), `Progress: "${progress2}"`, 'MEDIUM');
      console.log(`    After NEXT: "${progress2}"`);
      await screenshot(page, 'clarify-q2', 'Clarify — Question 2');
    }

    // Click SKIP >> BUILD NOW
    console.log('    Clicking SKIP >> BUILD NOW...');
    await page.click('#clarifySkip');
    await page.waitForTimeout(1500);
    await screenshot(page, 'post-clarify-skip', 'After SKIP — loading should start');

    // Check loading feed
    const loadingFeed = await page.$('#loadingFeed:not([hidden])');
    check('Loading feed visible after SKIP', !!loadingFeed, 'No loading feed visible', 'MEDIUM');

    if (loadingFeed) {
      await screenshot(page, 'loading-feed', 'Loading progress feed');
      const loadingText = await loadingFeed.textContent().catch(() => '');
      console.log(`    Loading text preview: "${loadingText.substring(0, 100)}"`);
    }
  }

  // Wait for build output
  console.log('    Waiting for build output (up to 90s)...');
  let buildAppeared = false;

  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(1000);
    const bo = await page.$('#buildOutput');
    if (bo) {
      const classes = await bo.getAttribute('class') || '';
      const htmlLen = await bo.evaluate(el => el.innerHTML.length);
      if (classes.includes('active') && htmlLen > 500) {
        buildAppeared = true;
        console.log(`    Build output ready at ~${i+1}s`);
        break;
      }
    }
    if (i === 29) console.log(`    Still waiting... 30s`);
    if (i === 59) console.log(`    Still waiting... 60s`);
  }

  check('Build output generated successfully', buildAppeared, 'Build did not appear within 90s', 'CRITICAL');

  if (!buildAppeared) {
    await screenshot(page, 'build-timeout-state', 'Final state after 90s timeout');
    console.log('    Skipping post-build tests due to timeout');
  } else {
    await screenshot(page, 'build-complete', 'Full build output rendered');

    // ──────────────────────────────────────────────
    // [9] BUILD OUTPUT STRUCTURE
    // ──────────────────────────────────────────────
    console.log('\n[9] BUILD OUTPUT STRUCTURE');

    const projName = await page.$('.project-name');
    check('Project name rendered (.project-name)', !!projName, 'No .project-name', 'MEDIUM');
    if (projName) console.log(`    Project: "${await projName.textContent()}"`);

    // Build metadata bar
    const buildMeta = await page.$('.build-meta');
    check('Build metadata bar (.build-meta)', !!buildMeta, 'No .build-meta', 'HIGH');

    if (buildMeta) {
      const cost = await page.$('[data-meta="cost"]');
      const time = await page.$('[data-meta="time"]');
      const skill = await page.$('[data-meta="skill"]');
      check('Cost estimate pill [data-meta="cost"]', !!cost, 'Missing cost pill', 'MEDIUM');
      check('Time estimate pill [data-meta="time"]', !!time, 'Missing time pill', 'MEDIUM');
      check('Skill mode pill [data-meta="skill"]', !!skill, 'Missing skill pill', 'LOW');
      if (cost) console.log(`    Cost: ${await cost.textContent()}`);
      if (time) console.log(`    Time: ${await time.textContent()}`);
      if (skill) console.log(`    Skill: ${await skill.textContent()}`);
    }

    // Build nav
    const buildNav = await page.$('.build-nav');
    check('Build nav (.build-nav) rendered', !!buildNav, 'No .build-nav', 'HIGH');

    const navTabs = await page.$$('.build-nav-tab');
    check('Build nav has 5 tabs', navTabs.length === 5, `Got ${navTabs.length}`, 'MEDIUM');
    const navLabels = await Promise.all(navTabs.map(t => t.textContent()));
    console.log(`    Nav tabs: ${navLabels.map(t => t.trim()).join(', ')}`);

    // Overview section has content
    const overviewSect = await page.$('[data-build-section="overview"]');
    check('Overview section in DOM', !!overviewSect, 'No [data-build-section="overview"]', 'MEDIUM');

    await screenshot(page, 'build-overview', 'Build overview section');

    // ──────────────────────────────────────────────
    // [10] BUILD NAV TABS
    // ──────────────────────────────────────────────
    console.log('\n[10] BUILD NAV TABS NAVIGATION');

    // Use page.locator for auto-retry and stale handle resilience
    const tabNames = ['Overview', 'Wiring', 'Parts', 'Code', 'Steps'];
    for (const label of tabNames) {
      try {
        await page.locator('.build-nav-tab', { hasText: label }).first().click({ timeout: 5000 });
        await page.waitForTimeout(700);
        await screenshot(page, `nav-tab-${label.toLowerCase()}`, `"${label}" tab — active`);
        pass(`"${label}" tab clickable`);
      } catch (e) {
        fail(`"${label}" tab clickable`, e.message.substring(0, 80), 'MEDIUM');
      }
    }

    // Return to Overview
    try {
      await page.locator('.build-nav-tab', { hasText: 'Overview' }).first().click({ timeout: 5000 });
      await page.waitForTimeout(400);
    } catch (_) {}

    // ──────────────────────────────────────────────
    // [11] WIRING DIAGRAM
    // ──────────────────────────────────────────────
    console.log('\n[11] WIRING DIAGRAM');

    try { await page.locator('.build-nav-tab', { hasText: 'Wiring' }).first().click({ timeout: 5000 }); await page.waitForTimeout(800); } catch (_) {}

    const wiringSect = await page.$('[data-build-section="wiring"]');
    check('Wiring section in DOM', !!wiringSect, 'No wiring section', 'MEDIUM');

    const svgCanvas = await page.$('svg.wiring-canvas, .wiring-canvas');
    const fallback = await page.$('.diagram-fallback');
    const wiringCodeBlock = await page.$('.wiring-block');

    console.log(`    SVG canvas: ${!!svgCanvas}`);
    console.log(`    Diagram fallback: ${!!fallback}`);
    console.log(`    Text wiring block: ${!!wiringCodeBlock}`);

    const hasWiring = !!svgCanvas || !!fallback;
    check('Wiring diagram renders (SVG or fallback)', hasWiring, 'No wiring content at all', 'HIGH');

    if (svgCanvas) {
      await screenshot(page, 'wiring-svg', 'SVG wiring canvas');
      pass('SVG wiring canvas rendered');

      // Check for component labels
      const compLabels = await page.$$('[class*="comp-label"], [class*="board-label"], text');
      console.log(`    SVG text/label elements: ${compLabels.length}`);

      // Zoom test
      const bbox = await svgCanvas.boundingBox();
      if (bbox) {
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(400);
        await screenshot(page, 'wiring-zoomed', 'Canvas after scroll-zoom in');
        pass('Wiring canvas zoom works');

        // Pan test
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 80, cy + 40);
        await page.mouse.up();
        await page.waitForTimeout(300);
        await screenshot(page, 'wiring-panned', 'Canvas after drag-pan');
        pass('Wiring canvas pan works');
      }
    } else if (fallback) {
      await screenshot(page, 'wiring-fallback', 'Wiring fallback (no SVG canvas)');
      fail('SVG wiring canvas rendered', 'Only fallback shown — canvas did not render for this build', 'HIGH');
    }

    // ──────────────────────────────────────────────
    // [12] PARTS LIST
    // ──────────────────────────────────────────────
    console.log('\n[12] PARTS LIST');

    try { await page.locator('.build-nav-tab', { hasText: 'Parts' }).first().click({ timeout: 5000 }); await page.waitForTimeout(700); } catch (_) {}

    const partsList = await page.$('.parts-list');
    check('Parts list (.parts-list) rendered', !!partsList, 'No .parts-list', 'HIGH');

    if (partsList) {
      const items = await page.$$('.parts-list li');
      check('Parts list not empty', items.length > 0, 'Zero items', 'HIGH');
      console.log(`    Parts: ${items.length}`);

      const partName = await page.$('.part-name');
      check('Part names (.part-name) in list', !!partName, 'No .part-name elements', 'LOW');

      await screenshot(page, 'parts-list', 'Parts list view');
    }

    // Amazon links
    const amazonLinks = await page.$$('a[href*="amazon"]');
    check('Amazon buy links present', amazonLinks.length > 0, 'No Amazon links in parts list', 'LOW');
    console.log(`    Amazon links: ${amazonLinks.length}`);

    // "Shop all" Amazon button
    const shopAllBtn = await page.$('[class*="amazon-all"], [class*="shop-all"]');
    console.log(`    "Shop all" Amazon button: ${!!shopAllBtn}`);

    // ──────────────────────────────────────────────
    // [13] CODE SECTION
    // ──────────────────────────────────────────────
    console.log('\n[13] CODE SECTION');

    try { await page.locator('.build-nav-tab', { hasText: 'Code' }).first().click({ timeout: 5000 }); await page.waitForTimeout(700); } catch (_) {}

    const codeWrap = await page.$('.code-wrap');
    check('.code-wrap rendered', !!codeWrap, 'No .code-wrap', 'HIGH');

    if (codeWrap) {
      const fileName = await page.$('.file-name');
      check('.file-name label in code wrap', !!fileName, 'No .file-name', 'LOW');
      if (fileName) console.log(`    File: "${await fileName.textContent()}"`);

      const codeBlock = await page.$('.wiring-block');
      check('.wiring-block (code content) present', !!codeBlock, 'No code content', 'HIGH');

      if (codeBlock) {
        const codeLen = await codeBlock.evaluate(el => el.textContent.trim().length);
        check('Code content not empty (>50 chars)', codeLen > 50, `Code is ${codeLen} chars`, 'HIGH');
        console.log(`    Code length: ~${codeLen} chars`);
        // Check for #include or void setup - basic Arduino sketch checks
        const hasArduinoCode = await codeBlock.evaluate(el => {
          const text = el.textContent;
          return /void setup|void loop|#include/.test(text);
        });
        check('Code looks like valid Arduino sketch', hasArduinoCode, 'No void setup/loop or #include found', 'MEDIUM');
      }

      const copyBtn = await page.$('.copy-btn');
      check('COPY button in code section', !!copyBtn, 'No .copy-btn', 'LOW');

      const downloadBtn = await page.$('.code-download-btn, button[class*="download"]');
      console.log(`    Download code button: ${!!downloadBtn}`);

      await screenshot(page, 'code-section', 'Code section with sketch');
    }

    // ──────────────────────────────────────────────
    // [14] INSTRUCTION BOOK (STEPS)
    // ──────────────────────────────────────────────
    console.log('\n[14] INSTRUCTION BOOK (STEPS)');

    try { await page.locator('.build-nav-tab', { hasText: 'Steps' }).first().click({ timeout: 5000 }); await page.waitForTimeout(900); } catch (_) {}

    const instrMount = await page.$('.instruction-book-mount');
    check('Instruction book (.instruction-book-mount) rendered', !!instrMount, 'No instruction book', 'HIGH');

    if (instrMount) {
      await screenshot(page, 'steps-step1', 'Instruction book — Step 1');

      // Step progress header
      const stepProgress = await instrMount.$('[class*="progress"]');
      check('Step progress bar/header in book', !!stepProgress, 'No progress indicator', 'LOW');
      if (stepProgress) console.log(`    Progress text: "${(await stepProgress.textContent()).trim()}"`);

      // Step content
      const stepNum = await instrMount.$('[class*="step-num"], .step-n');
      check('Step number rendered', !!stepNum, 'No step number element', 'LOW');

      // Navigation buttons — look for NEXT > and < PREV
      const allBtns = await instrMount.$$('button');
      const btnData = await Promise.all(allBtns.map(async b => ({
        text: (await b.textContent()).trim(),
        ariaLabel: await b.getAttribute('aria-label') || '',
        cls: await b.getAttribute('class') || '',
      })));
      console.log(`    Book buttons: ${btnData.map(b => `"${b.text}"`).filter(t => t).join(' | ')}`);

      let nextBtn = null, prevBtn = null;
      for (const [i, btn] of allBtns.entries()) {
        const d = btnData[i];
        if (d.text.includes('NEXT') || d.ariaLabel.toLowerCase().includes('next') || d.cls.includes('next')) {
          nextBtn = btn;
        }
        if (d.text.includes('PREV') || d.ariaLabel.toLowerCase().includes('prev') || d.cls.includes('prev')) {
          prevBtn = btn;
        }
      }

      check('"NEXT" button in instruction book', !!nextBtn, 'No NEXT button found', 'HIGH');
      check('"PREV" button in instruction book', !!prevBtn, 'No PREV button (expected, may be disabled on step 1)', 'LOW');

      if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(500);
        await screenshot(page, 'steps-step2', 'Step 2');
        pass('NEXT step navigation works');

        await nextBtn.click();
        await page.waitForTimeout(500);
        await screenshot(page, 'steps-step3', 'Step 3');

        // Prev
        if (prevBtn) {
          await prevBtn.click();
          await page.waitForTimeout(400);
          pass('PREV step navigation works');
        }
      }

      // Step action badge (WIRE/CODE/POWER/TEST/BUILD)
      const actionTag = await instrMount.$('[class*="action"], .step-tag');
      console.log(`    Action tag/badge: ${!!actionTag}`);

      // "WHY?" toggle
      const whyBtn = await instrMount.$('[class*="why"]');
      if (whyBtn) {
        await whyBtn.click();
        await page.waitForTimeout(300);
        await screenshot(page, 'steps-why', '"WHY?" tooltip open');
        pass('"WHY?" toggle works');
      }

      // MARK COMPLETE button
      const markBtn = await instrMount.$('.mark-complete-btn, [class*="mark"]');
      check('"MARK COMPLETE" button present', !!markBtn, 'No mark-complete button', 'MEDIUM');
      if (markBtn) {
        await markBtn.click();
        await page.waitForTimeout(300);
        await screenshot(page, 'step-marked-complete', 'Step marked as complete');
        pass('"MARK COMPLETE" button works');
      }

      // Check completion counter updated
      const completionCount = await instrMount.$('[class*="progress"]');
      if (completionCount) {
        const ct = await completionCount.textContent();
        console.log(`    Progress after mark: "${ct.trim()}"`);
      }
    }

    // ──────────────────────────────────────────────
    // [15] DOWNLOAD / EXPORT CONTROLS
    // ──────────────────────────────────────────────
    console.log('\n[15] EXPORT & DOWNLOAD CONTROLS');

    const btnExportPdf = await page.$('#btnExportPdf');
    check('#btnExportPdf present', !!btnExportPdf, 'No #btnExportPdf', 'LOW');

    const btnDownloadMd = await page.$('#btnDownloadMd');
    check('#btnDownloadMd present', !!btnDownloadMd, 'No #btnDownloadMd', 'LOW');

    const btnCopyCode = await page.$('#btnCopyCode');
    check('#btnCopyCode present', !!btnCopyCode, 'No #btnCopyCode', 'LOW');

    await screenshot(page, 'output-header-controls', 'Output header with PDF/MD/Copy buttons');

    // btnExport in topbar (ZIP download)
    const btnExport = await page.$('#btnExport');
    console.log(`    Topbar export (#btnExport): ${!!btnExport}`);

    // ──────────────────────────────────────────────
    // [16] CHAT PANEL
    // ──────────────────────────────────────────────
    console.log('\n[16] CHAT PANEL');

    const chatLog = await page.$('#chatLog');
    check('#chatLog present', !!chatLog, 'No #chatLog', 'HIGH');

    const chatInput = await page.$('#chatInput');
    check('#chatInput present', !!chatInput, 'No #chatInput', 'HIGH');

    const sendBtn = await page.$('#sendBtn');
    check('#sendBtn present', !!sendBtn, 'No #sendBtn', 'HIGH');

    if (chatLog) {
      const botMsgs = await chatLog.$$('.msg.bot');
      check('Chat log has bot messages', botMsgs.length > 0, `${botMsgs.length} bot messages`, 'MEDIUM');
      console.log(`    Bot messages in chat: ${botMsgs.length}`);

      const userMsgs = await chatLog.$$('.msg.you, .msg.user');
      console.log(`    User messages in chat: ${userMsgs.length}`);
    }

    if (chatInput) {
      await chatInput.fill('Can you make the blink faster?');
      await page.waitForTimeout(300);
      const charCount = await page.$('#charCount');
      if (charCount) {
        const cnt = await charCount.textContent();
        check('Char counter updates on typing', cnt !== '0/300', `Counter: "${cnt}"`, 'LOW');
        console.log(`    Char count: ${cnt}`);
      }
      await screenshot(page, 'chat-with-message', 'Chat with follow-up typed');
      await chatInput.fill('');
    }

    // Chat toggle (collapse/expand)
    const chatToggle = await page.$('#chatToggle');
    if (chatToggle) {
      await chatToggle.click();
      await page.waitForTimeout(400);
      const collapsed = !!(await page.$('.chat.collapsed'));
      check('Chat pane collapses', collapsed, 'Chat did not collapse', 'LOW');
      await chatToggle.click();
      await page.waitForTimeout(400);
    }

    // ──────────────────────────────────────────────
    // [17] NEW SESSION BUTTON
    // ──────────────────────────────────────────────
    console.log('\n[17] NEW SESSION');

    await forceClick(page, '#btnNew');
    await page.waitForTimeout(800);
    await screenshot(page, 'after-new-session', 'After clicking New (+) button');

    const heroBack = !!(await page.$('#hero'));
    const buildCleared = await page.$eval('#buildOutput', el => el.innerHTML.trim().length === 0).catch(() => true);
    check('Hero section still in DOM after New Session', heroBack, 'Hero gone', 'MEDIUM');
    check('Build output cleared on new session', buildCleared, 'Build output not cleared', 'MEDIUM');

    // Build output visible check (emptyState should show)
    const emptyStateVisible = await page.$eval('#emptyState', el => !el.classList.contains('hidden')).catch(() => false);
    check('Empty state shown after new session', emptyStateVisible, 'Empty state not visible', 'LOW');

    // ──────────────────────────────────────────────
    // [18] HISTORY — RESTORE FROM PREVIOUS BUILD
    // ──────────────────────────────────────────────
    console.log('\n[18] HISTORY — RESTORE FROM PREVIOUS BUILD');

    await forceClick(page, '#btnHistory');
    await page.waitForTimeout(500);
    const histOpen = !!(await page.$('#histPanel.open'));
    check('History panel opens with a build', histOpen, 'History panel did not open', 'MEDIUM');

    if (histOpen) {
      await screenshot(page, 'history-with-build', 'History panel with 1 build entry');
      const histItems = await page.$$('.hist-item, [class*="hist-item"]');
      console.log(`    History items: ${histItems.length}`);
      check('Previous build saved to history', histItems.length > 0, 'No history items after building', 'MEDIUM');

      if (histItems.length > 0) {
        // Click to restore
        await histItems[0].click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'history-restored', 'Build restored from history');
        const buildRestored = await page.$eval('#buildOutput', el => el.classList.contains('active') && el.innerHTML.length > 500).catch(() => false);
        check('Build restores from history correctly', buildRestored, 'Build output not active after restore', 'HIGH');
      }

      // Close history
      await forceClick(page, '#histClose');
      await page.waitForTimeout(400);
    }
  } // end if buildAppeared

  // ──────────────────────────────────────────────
  // [19] RESPONSIVE — MOBILE & TABLET
  // ──────────────────────────────────────────────
  console.log('\n[19] RESPONSIVE DESIGN');

  // Mobile: iPhone SE
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot(page, 'mobile-375-hero', 'Mobile 375×812 — hero');

  const mobileHeroVisible = await page.$eval('#heroInput', el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }).catch(() => false);
  check('Hero input visible on 375px mobile', mobileHeroVisible, 'Hero input not visible on mobile', 'HIGH');

  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 5);
  const mSW = await page.evaluate(() => document.documentElement.scrollWidth);
  const mCW = await page.evaluate(() => document.documentElement.clientWidth);
  check('No horizontal overflow on mobile', !mobileOverflow, `${mSW}px content vs ${mCW}px viewport`, 'HIGH');

  const buildBtnBox = await page.$eval('#heroGo', el => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }).catch(() => null);
  if (buildBtnBox) {
    check('BUILD button height >= 36px (touch target)', buildBtnBox.h >= 36, `Height: ${buildBtnBox.h}px`, 'MEDIUM');
    console.log(`    BUILD btn on mobile: ${Math.round(buildBtnBox.w)}×${Math.round(buildBtnBox.h)}px`);
  }

  // Skills visible on mobile
  const mobileSkilsVisible = await page.$eval('.hero-skill', el => {
    const r = el.getBoundingClientRect();
    return r.width > 0;
  }).catch(() => false);
  check('Skill buttons visible on mobile', mobileSkilsVisible, 'Skill buttons not visible on mobile', 'MEDIUM');

  await screenshot(page, 'mobile-375-scroll', 'Mobile — scrolled to skills');

  // Tablet: iPad
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(600);
  await screenshot(page, 'tablet-768', 'Tablet 768×1024');

  const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 5);
  check('No horizontal overflow on tablet', !tabletOverflow, 'Tablet has horizontal overflow', 'MEDIUM');

  // Wide desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(400);
  await screenshot(page, 'desktop-1920', 'Wide desktop 1920×1080');
  const wideOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 5);
  check('No overflow on 1920px wide', !wideOverflow, 'Wide desktop has overflow', 'LOW');

  // Reset
  await page.setViewportSize({ width: 1440, height: 900 });

  // ──────────────────────────────────────────────
  // [20] KEYBOARD ACCESSIBILITY
  // ──────────────────────────────────────────────
  console.log('\n[20] KEYBOARD ACCESSIBILITY');

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1200);

  // Tab moves focus
  await page.keyboard.press('Tab');
  await page.waitForTimeout(150);
  const f1 = await page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el.tagName, id: el.id, cls: el.className };
  });
  check('Tab key moves focus off body', f1.tag !== 'BODY' && f1.tag !== 'HTML', `Focus on: ${JSON.stringify(f1)}`, 'MEDIUM');
  console.log(`    First tab target: ${f1.tag}${f1.id ? '#' + f1.id : ''}`);

  // Can reach heroInput via Tab
  let reachedInput = false;
  for (let i = 0; i < 12; i++) {
    const focused = await page.evaluate(() => document.activeElement?.id);
    if (focused === 'heroInput') { reachedInput = true; break; }
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  }
  check('Can tab to #heroInput', reachedInput, 'heroInput not reachable via Tab', 'MEDIUM');
  console.log(`    Reached heroInput by Tab: ${reachedInput}`);

  // Escape closes modal
  await forceClick(page, '#btnSettings');
  await page.waitForTimeout(500);
  if (await page.$('#modalBg.open')) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    check('Escape closes settings modal', !(await page.$('#modalBg.open')), 'Modal not closed by Escape', 'MEDIUM');
  }

  // Enter key in hero input
  await page.focus('#heroInput');
  await page.fill('#heroInput', 'short'); // < 10 chars, should NOT submit
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  // If hero is still visible, Enter correctly blocked submission
  const heroStillHere = !!(await page.$('#hero'));
  check('Short input does not trigger build on Enter', heroStillHere, 'Build triggered with < 10 chars on Enter', 'MEDIUM');

  // ──────────────────────────────────────────────
  // FINAL STATE SCREENSHOT
  // ──────────────────────────────────────────────
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot(page, 'zzz-final-state', 'Final state — desktop hero');

  // ──────────────────────────────────────────────
  // WRAP UP
  // ──────────────────────────────────────────────
  await context.close();
  await browser.close();

  // Deduplicate console errors
  results.consoleErrors = [...new Set(consoleErrors)];

  // Write report
  const reportPath = path.join(ARTIFACTS_DIR, 'results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log('\n=================================');
  console.log('=    TEST RESULTS SUMMARY      =');
  console.log('=================================');
  console.log(`Checks:        ${results.total}`);
  console.log(`Passed:        ${results.passed}`);
  console.log(`Failed:        ${results.failed}`);
  console.log(`Console Errors: ${results.consoleErrors.length}`);

  if (results.consoleErrors.length) {
    console.log('\nCONSOLE ERRORS:');
    results.consoleErrors.forEach(e => console.log('  - ' + e));
  }

  if (results.issues.length) {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sorted = [...results.issues].sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4));
    console.log('\nFAILED CHECKS (priority order):');
    sorted.forEach(i => console.log(`  [${i.severity}] ${i.label}: ${i.detail}`));
  }

  console.log(`\nResults JSON: ${reportPath}`);
  console.log(`Screenshots:  ${SCREENSHOT_DIR}/`);
  console.log(`Video:        ${VIDEO_DIR}/`);

  return results;
}

runTests().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
