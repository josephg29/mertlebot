<script>
  import { onMount } from 'svelte';
  import WiringCanvas from '$lib/wiregen/WiringCanvas.svelte';
  import InstructionBook from '$lib/InstructionBook.svelte';
  import { mount, unmount } from 'svelte';
  import { extractStepGroups, stripMarkdown, summarizeSupport, validateDiagram, repairGuide } from '$lib/projectSupport.js';

  /* ── Shared SVG icons ── */
  const ICON_TRASH = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2 0 0,1-2,2H8a2,2 0 0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4a1,1 0 0,1,1-1h4a1,1 0 0,1,1,1v2"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,5 4,8 9,2"/></svg>';
  const ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M21,15v4a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  /* ── Step instruction-book icons (pixel-art style) ── */
  const STEP_ICONS = {
    wire:     '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M4 12h6"/><path d="M14 12h6"/><circle cx="12" cy="12" r="2"/><path d="M12 4v6"/><path d="M12 14v6"/></svg>',
    code:     '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polyline points="8,6 2,12 8,18"/><polyline points="16,6 22,12 16,18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>',
    power:    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polygon points="13,2 4,14 12,14 11,22 20,10 12,10"/></svg>',
    test:     '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="10"/><polyline points="8,12 11,15 16,9"/></svg>',
    assemble: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    default:  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m-9-11h2m18 0h2"/><path d="M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42"/><path d="M19.78 4.22l-1.42 1.42M5.64 18.36l-1.42 1.42"/></svg>'
  };
  const STEP_LABELS = { wire: 'WIRE', code: 'CODE', power: 'POWER', test: 'TEST', assemble: 'BUILD', default: 'STEP' };
  const HERO_EXAMPLES = [
    'a motion-activated light',
    'a temperature sensor with LCD display',
    'a sound-reactive LED strip',
    'a soil moisture alert system',
    'a servo-controlled door lock',
    'a WiFi weather station'
  ];
  const SKILL_HELP = {
    MONKEY: 'Maximum hand-holding, no experience needed.',
    NOVICE: 'Friendly explanations with beginner-safe wiring and upload steps.',
    BUILDER: 'Balanced guidance for makers comfortable assembling circuits.',
    HACKER: 'Assumes comfort with circuits, debugging, and flashing firmware.',
    EXPERT: 'Moves fast with concise explanations and fewer training wheels.'
  };
  const BUILD_STATUS_STEPS = [
    'Understanding your idea...',
    'Selecting components...',
    'Writing the code...',
    'Creating wiring diagram...',
    'Building step-by-step guide...'
  ];
  const BUILD_NAV_ITEMS = [
    { key: 'overview', label: 'Overview' },
    { key: 'wiring', label: 'Wiring' },
    { key: 'parts', label: 'Parts' },
    { key: 'code', label: 'Code' },
    { key: 'steps', label: 'Steps' }
  ];

  function classifyAction(text) {
    const t = text.toLowerCase();
    if (/\b(connect|wire|insert|plug|jumper|breadboard|pin\s|attach.*to|hook|link|run a wire)\b/.test(t)) return 'wire';
    if (/\b(upload|flash|program|code|sketch|ide|compile|open.*ide|download.*code|load)\b/.test(t)) return 'code';
    if (/\b(power|battery|usb|plug.?in|voltage|supply|adapter|turn on|switch on)\b/.test(t)) return 'power';
    if (/\b(test|check|verify|press|try|run|blink|observe|confirm|should see|look for|watch)\b/.test(t)) return 'test';
    if (/\b(solder|mount|secure|screw|glue|tape|place|position|orient|bend|trim|cut)\b/.test(t)) return 'assemble';
    return 'default';
  }

  /* ── Helper ── */
  const gid = id => document.getElementById(id);

  /* ── DOM refs (set in onMount) ── */
  let hero, heroInput, heroGo, chatInput, sendBtn, charCount,
      statusDot, statusText, statusSkill, outputContext,
      chatLog, buildOutput, emptyState, outputScroll,
      modalBg, keyInput, saveKeyBtn, keyStatus, modalCloseBtn,
      themeGrid, skillGrid, ageSlider, ageValEl,
      fontSlider, fontValEl,
      histPanel, histList, histClose,
      chatPane, chatToggle, workspace;

  /* ── Cloud project ideas ── */
  const PROJECT_IDEAS = [
    'smart plant watering system',
    'bluetooth LED mood lamp',
    'RFID door lock',
    'weather station with e-ink display',
    'gesture-controlled robot arm',
    'solar-powered IoT sensor',
    'retro LED matrix clock',
    'voice-activated light switch',
    'DIY oscilloscope',
    'automated pet feeder',
    'capacitive touch piano',
    'GPS tracker with SMS alerts',
    'self-balancing robot',
    'ultrasonic parking sensor',
    'wireless temperature monitor',
    'MIDI controller with arcade buttons',
    'laser harp',
    'wearable step counter',
    'soil moisture dashboard',
    'programmable RGB LED cube',
  ];
  let cloudProps = [];
  function rotateCloudIdea(i) {
    const next = PROJECT_IDEAS.filter(p => p !== cloudProps[i].idea)[Math.floor(Math.random() * (PROJECT_IDEAS.length - 1))];
    cloudProps[i] = { ...cloudProps[i], idea: next };
    cloudProps = cloudProps;
  }

  /* ── State ── */
  let controller = null, generating = false, lastPrompt = '', lastGuide = '',
      lastSkill = '', lastTs = null, lastPartsForAmazon = [];
  let statusInterval = null, heroActive = true;
  const selectedTs = new Set();
  let _del = { cb: null, guide: null, prompt: null };
  let _settingsTrigger = null;
  let _wiregenInstances = [];
  let _instructionBookInstances = [];
  let loadingStepIndex = -1, loadingProgress = 0, loadingStartTs = 0;
  let loadingStepTimers = [];
  let loadingProgressFrame = null;
  let loadingHideTimer = null;
  let buildNavCleanup = () => {};

  /* ── Clarify state ── */
  let clarifyQuestions = [], clarifyAnswers = {}, clarifyIdx = 0, clarifyOriginalPrompt = '';
  let clarifyStage = 'question';

  const SKILLS = { 1: 'MONKEY', 2: 'NOVICE', 3: 'BUILDER', 4: 'HACKER', 5: 'EXPERT' };
  const INIT_MSG = '<div class="msg bot"><div class="msg-who">MERTLE.BOT</div><div class="msg-body">Ready. Describe any hardware project to get started.</div></div>';

  /* ── Helpers ── */
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function scrollChat() { if (chatLog) chatLog.scrollTop = chatLog.scrollHeight; }
  function scrollOut() { if (outputScroll) outputScroll.scrollTop = outputScroll.scrollHeight; }
  function normalizeSkillLabel(skill) { return `${skill || 'MONKEY'} MODE`; }
  function getRenderedSkill() { return lastSkill || getSkill(); }
  function hashString(str = '') {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    return Math.abs(hash).toString(36);
  }
  function updateHeroBuildState() {
    if (!heroInput || !heroGo) return;
    const valid = heroInput.value.trim().length >= 10;
    heroGo.disabled = !valid;
    const hint = gid('heroPromptHint');
    if (hint) hint.textContent = valid ? 'Ready to generate a full build guide.' : 'Describe your project in at least 10 characters.';
  }
  function updateSkillHelper(skill) {
    const message = SKILL_HELP[skill] || SKILL_HELP.MONKEY;
    const heroHelp = gid('heroSkillHelp');
    const modalHelp = gid('skillHelpModal');
    if (heroHelp) heroHelp.textContent = message;
    if (modalHelp) modalHelp.textContent = message;
  }
  function applyExamplePrompt(prompt) {
    if (!heroInput) return;
    heroInput.value = prompt;
    updateHeroBuildState();
    heroInput.focus();
  }
  function slugifySection(section) {
    const s = (section || '').toLowerCase();
    if (s.includes('wiring')) return 'wiring';
    if (s.includes('part')) return 'parts';
    if (s.includes('code') || s.includes('firmware') || s.includes('sketch')) return 'code';
    if (s.includes('step') || s.includes('build') || s.includes('assembly') || s.includes('instructions')) return 'steps';
    return 'overview';
  }
  function inferPreviewType(title, guide) {
    const text = `${title}\n${guide}`.toLowerCase();
    if (/\b(servo|lock|door|arm|sweep)\b/.test(text)) return 'servo';
    if (/\b(display|lcd|oled|weather|counter|count|screen)\b/.test(text)) return 'display';
    if (/\b(wifi|wireless|station|mqtt|radio|signal)\b/.test(text)) return 'signal';
    if (/\b(sensor|motion|moisture|ultrasonic|temperature|humidity)\b/.test(text)) return 'sensor';
    if (/\b(light|led|rgb|strip|blink|sound-reactive|lamp)\b/.test(text)) return 'led';
    return 'pulse';
  }
  function renderProjectPreview(title, guide) {
    const type = inferPreviewType(title, guide);
    const label = {
      led: 'Animated LED response preview',
      servo: 'Animated servo sweep preview',
      display: 'Animated display preview',
      signal: 'Animated wireless activity preview',
      sensor: 'Animated sensing preview',
      pulse: 'Animated project behavior preview'
    }[type];
    return `
      <div class="preview-card">
        <div class="section-header">Project Preview</div>
        <div class="preview-stage preview-${type}" aria-label="${esc(label)}">
          <div class="preview-caption">Expected behavior</div>
          <div class="preview-scene">
            <div class="preview-core"></div>
            <div class="preview-leds"><span></span><span></span><span></span><span></span></div>
            <div class="preview-servo-base"></div>
            <div class="preview-servo-arm"></div>
            <div class="preview-display-screen">
              <span class="preview-display-line"></span>
              <span class="preview-display-line"></span>
              <span class="preview-display-line"></span>
            </div>
            <div class="preview-signal">
              <span></span><span></span><span></span>
            </div>
            <div class="preview-rings">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div class="preview-description">${esc(label)}</div>
        </div>
      </div>
    `;
  }
  function renderBuildNav() {
    return `
      <nav class="build-nav" aria-label="Build sections">
        ${BUILD_NAV_ITEMS.map(item => `
          <button type="button" class="build-nav-tab" data-nav-target="${item.key}">
            ${item.label}
          </button>
        `).join('')}
      </nav>
    `;
  }
  function renderDiagramFallback(message = '') {
    return `
      <div class="diagram-fallback">
        <div class="diagram-fallback-visual" aria-hidden="true">
          <div class="diagram-board"></div>
          <div class="diagram-wire diagram-wire-a"></div>
          <div class="diagram-wire diagram-wire-b"></div>
          <div class="diagram-node diagram-node-a"></div>
          <div class="diagram-node diagram-node-b"></div>
        </div>
        <div class="diagram-fallback-title">Diagram coming soon for this module</div>
        <div class="diagram-fallback-copy">${message ? esc(message) + ' ' : ''}Ask me to describe the wiring in text instead.</div>
      </div>
    `;
  }
  function getCurrentProjectTitle() {
    return buildOutput?.querySelector('.project-name')?.textContent?.trim() || 'mertle-project';
  }
  function getBuildMarkdown() {
    if (!buildOutput) return '';
    const title = getCurrentProjectTitle();
    const overviewSection = buildOutput.querySelector('[data-build-section="overview"]');
    const description = [...(overviewSection?.querySelectorAll('p') || [])]
      .map((p) => p.textContent.trim())
      .filter(Boolean)
      .join('\n\n');
    const parts = [...buildOutput.querySelectorAll('[data-build-section="parts"] .parts-list li')]
      .map((li) => (li.querySelector('.part-name')?.textContent || li.textContent).trim())
      .filter(Boolean);
    const codes = [...buildOutput.querySelectorAll('.code-wrap')].map((wrap) => ({
      name: wrap.querySelector('.file-name')?.textContent?.trim() || 'code.txt',
      content: wrap.querySelector('.wiring-block')?.textContent?.trim() || ''
    })).filter((entry) => entry.content);
    const steps = [...buildOutput.querySelectorAll('.instruction-book-mount')].flatMap((mount) => {
      try { return JSON.parse(mount.dataset.steps || '[]'); } catch { return []; }
    });
    const lines = [`# ${title}`, '', `Skill Level: ${normalizeSkillLabel(getRenderedSkill())}`, ''];
    if (description) lines.push('## Description', '', description, '');
    if (parts.length) lines.push('## Parts', '', ...parts.map((part) => `- ${part}`), '');
    if (codes.length) {
      lines.push('## Code', '');
      codes.forEach(({ name, content }) => {
        lines.push(`### ${name}`, '', '```cpp', content, '```', '');
      });
    }
    if (steps.length) lines.push('## Steps', '', ...steps.map((step) => `${step.num}. ${step.text}`), '');
    return lines.join('\n').trim() + '\n';
  }
  function exportPdf() {
    if (!lastGuide && !buildOutput?.innerHTML.trim()) return;
    window.print();
  }
  function downloadMarkdownGuide() {
    const markdown = getBuildMarkdown();
    if (!markdown) return;
    const slug = getCurrentProjectTitle().replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'mertle-project';
    downloadBlob(markdown, `${slug}.md`, 'text/markdown');
  }
  async function copyAllCodeBlocks() {
    const blocks = [...buildOutput.querySelectorAll('.code-wrap')].map((wrap) => {
      const name = wrap.querySelector('.file-name')?.textContent?.trim() || 'code.txt';
      const content = wrap.querySelector('.wiring-block')?.textContent?.trim() || '';
      return content ? `// ${name}\n${content}` : '';
    }).filter(Boolean);
    if (!blocks.length) return;
    await navigator.clipboard.writeText(blocks.join('\n\n'));
  }

  /* ── Session ── */
  function newSession() {
    if (generating && controller) { controller.abort(); controller = null; setGenerating(false); }
    gid('clarifyBg') && gid('clarifyBg').classList.remove('open');
    clarifyQuestions = []; clarifyAnswers = {}; clarifyOriginalPrompt = '';
    clarifyStage = 'question';
    buildNavCleanup();
    buildNavCleanup = () => {};
    destroyWiregenInstances();
    destroyInstructionBookInstances();
    buildOutput.classList.remove('active'); buildOutput.innerHTML = '';
    emptyState.classList.remove('hidden'); outputContext.textContent = '';
    lastPrompt = ''; lastGuide = ''; lastSkill = ''; lastTs = null;
    chatInput.value = ''; charCount.textContent = '0/300';
    chatLog.innerHTML = INIT_MSG; chatInput.focus();
    gid('btnDelete').style.display = 'none';
    workspace.classList.add('no-build');
  }

  /* ── History ── */
  function getProjectName(item) {
    if (item.guide) { const m = item.guide.match(/^# (.+)$/m); if (m) return m[1].trim(); }
    return item.prompt;
  }
  function getHist() { try { return JSON.parse(localStorage.getItem('mrt-history') || '[]'); } catch { return []; } }
  function saveHist(h) { localStorage.setItem('mrt-history', JSON.stringify(h.slice(0, 20))); }
  function addHist(prompt, skill, guide) {
    const ts = Date.now();
    const h = getHist();
    h.unshift({ prompt, skill, guide: guide || '', chat: chatLog.innerHTML, ts });
    commitHistory(h);
    return ts;
  }
  function updateHistChat() {
    if (!lastTs) return;
    const h = getHist();
    const idx = h.findIndex(i => i.ts === lastTs);
    if (idx === -1) return;
    h[idx].chat = chatLog.innerHTML;
    saveHist(h);
  }
  function persistTitle(el) {
    if (!lastTs || !lastGuide) return;
    const newTitle = el.textContent.trim();
    if (!newTitle) return;
    lastGuide = lastGuide.replace(/^# .+$/m, '# ' + newTitle);
    const h = getHist();
    const idx = h.findIndex(i => i.ts === lastTs);
    if (idx === -1) return;
    h[idx].guide = lastGuide;
    saveHist(h);
    renderHist();
    renderHeroRecent();
  }
  function restoreProject(item) {
    if (!item.guide) return false;
    const guide = repairGuide(item.guide);
    const support = summarizeSupport(guide);
    lastPrompt = item.prompt; lastGuide = item.guide; lastSkill = item.skill; lastTs = item.ts;
    chatLog.innerHTML = item.chat || INIT_MSG;
    emptyState.classList.add('hidden');
    destroyWiregenInstances();
    destroyInstructionBookInstances();
    buildOutput.classList.add('active'); buildOutput.classList.remove('streaming-cursor');
    buildOutput.innerHTML = renderMd(guide);
    mountWiregenDiagrams();
    mountInstructionBooks();
    setupBuildNavigation();
    workspace.classList.remove('no-build');
    requestAnimationFrame(() => {
      const op = workspace.querySelector('.output');
      op.classList.add('output-entering');
      op.addEventListener('animationend', () => op.classList.remove('output-entering'), { once: true });
    });
    outputContext.textContent = normalizeSkillLabel(lastSkill || item.skill || getSkill());
    chatInput.value = ''; charCount.textContent = '0/300';
    gid('btnDelete').style.display = '';
    if (support.canSimulate) addSimBtn();
    scrollOut();
    return true;
  }

  /* ── Delete helpers ── */
  function downloadBlob(content, filename, type = 'text/plain') {
    const b = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  }
  function downloadGuide(guide, prompt) {
    const name = getProjectName({ guide, prompt });
    downloadBlob(guide, (name.slice(0, 40).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'project') + '.md', 'text/markdown');
  }

  /* ── Folder / zip download ── */
  function parseStepsFromGuide(guide) {
    return extractStepGroups(guide).map((step) => ({
      ...step,
      action: classifyAction(step.text),
    }));
  }

  async function captureWiregenSvg(diagram) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;height:640px;visibility:hidden;';
    document.body.appendChild(container);
    let inst;
    try {
      inst = mount(WiringCanvas, { target: container, props: { diagram, compact: false } });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
      const svgEl = container.querySelector('.wiregen-diagram');
      if (!svgEl) return null;
      const clone = svgEl.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.removeAttribute('style');
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('width', '960'); bg.setAttribute('height', '640'); bg.setAttribute('fill', '#1A2529');
      clone.insertBefore(bg, clone.firstChild);
      return '<?xml version="1.0" encoding="utf-8"?>' + new XMLSerializer().serializeToString(clone);
    } catch (e) {
      console.error('wiregen SVG capture failed', e); return null;
    } finally {
      if (inst) try { unmount(inst); } catch {}
      document.body.removeChild(container);
    }
  }

  function wrapTextLines(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = []; let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function buildProjectHtml(name, guide, diagramCount, steps) {
    const safeName = esc(name);
    const safeGuide = esc(guide);
    const diagramHtml = diagramCount
      ? Array.from({ length: diagramCount }, (_, i) => {
          const suffix = diagramCount > 1 ? '-' + (i + 1) : '';
          return `<figure><img src="images/wiring-diagram${suffix}.svg" alt="Wiring diagram ${i + 1}"><figcaption>Wiring diagram ${i + 1}</figcaption></figure>`;
        }).join('')
      : '<p>No wiring diagram is included for this project.</p>';
    const stepHtml = steps.length
      ? steps.map((step, i) => `<figure><img src="steps/step-${String(i + 1).padStart(2, '0')}.png" alt="Step ${step.num}"><figcaption>Step ${step.num}: ${esc(step.text)}</figcaption></figure>`).join('')
      : '<p>No step cards were generated.</p>';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeName}</title>
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin: 0; background: #0f171a; color: #e7ecef; }
    main { max-width: 960px; margin: 0 auto; padding: 32px 20px 48px; }
    h1, h2 { margin: 0 0 16px; }
    section { margin-top: 32px; }
    pre { white-space: pre-wrap; background: #162227; padding: 16px; border: 1px solid #29424a; border-radius: 8px; overflow: auto; }
    figure { margin: 0 0 20px; }
    img { max-width: 100%; height: auto; display: block; background: #fff; border-radius: 8px; }
    figcaption { margin-top: 8px; color: #9fb2bb; font-size: 14px; }
    a { color: #8ad3ff; }
  </style>
</head>
<body>
  <main>
    <h1>${safeName}</h1>
    <p><a href="guide.md">Open raw guide.md</a></p>
    <section>
      <h2>Guide</h2>
      <pre>${safeGuide}</pre>
    </section>
    <section>
      <h2>Wiring Diagrams</h2>
      ${diagramHtml}
    </section>
    <section>
      <h2>Step Cards</h2>
      ${stepHtml}
    </section>
  </main>
</body>
</html>`;
  }

  const STEP_EXPORT_COLORS = {
    wire:     { accent: '#29B6F6', dark: '#0277BD', label: 'WIRE' },
    code:     { accent: '#4CAF50', dark: '#388E3C', label: 'CODE' },
    power:    { accent: '#FFD54F', dark: '#F9A825', label: 'POWER' },
    test:     { accent: '#00BCD4', dark: '#007C91', label: 'TEST' },
    assemble: { accent: '#FF7043', dark: '#BF360C', label: 'BUILD' },
    default:  { accent: '#90A4AE', dark: '#546E7A', label: 'STEP' },
  };

  function renderStepImage(step, current, total) {
    const W = 800, H = 280;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const col = STEP_EXPORT_COLORS[step.action] || STEP_EXPORT_COLORS.default;
    // Background
    ctx.fillStyle = '#FAFAFA'; ctx.fillRect(0, 0, W, H);
    // Top strip
    ctx.fillStyle = col.accent; ctx.fillRect(0, 0, W, 10);
    // Left border
    ctx.fillStyle = col.accent; ctx.fillRect(0, 0, 3, H);
    // Step badge
    ctx.fillStyle = col.accent; ctx.fillRect(0, 0, 58, 58);
    ctx.fillStyle = col.dark; ctx.fillRect(4, 54, 58, 4);
    ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(step.num, 29, 30);
    // Counter
    ctx.fillStyle = '#888888'; ctx.font = '10px monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(current + ' / ' + total, W - 14, 16);
    // Action badge
    ctx.font = 'bold 10px monospace';
    const bw = ctx.measureText(col.label).width + 24;
    ctx.fillStyle = col.accent; ctx.fillRect(W / 2 - bw / 2, 72, bw, 22);
    ctx.fillStyle = col.dark; ctx.fillRect(W / 2 - bw / 2 + 2, 92, bw, 3);
    ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(col.label, W / 2, 83);
    // Step text
    ctx.fillStyle = '#1a1a1a'; ctx.font = '14px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    wrapTextLines(ctx, stripMarkdown(step.text), W - 100).forEach((ln, i) => ctx.fillText(ln, W / 2, 110 + i * 22));
    return new Promise(res => canvas.toBlob(b => res(b), 'image/png'));
  }

  async function downloadProjectFolder(guide, prompt) {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const support = summarizeSupport(guide);
    const name = getProjectName({ guide, prompt });
    const slug = name.slice(0, 40).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'project';
    zip.file('guide.md', guide);
    // Extract wiregen diagrams from markdown
    const wiregenRegex = /```wiregen\r?\n([\s\S]*?)```/g;
    let wm; const diagrams = [];
    while ((wm = wiregenRegex.exec(guide)) !== null) {
      try { diagrams.push(JSON.parse(wm[1].trim())); } catch {}
    }
    const imgFolder = zip.folder('images');
    for (let i = 0; i < diagrams.length; i++) {
      const svgStr = await captureWiregenSvg(diagrams[i]);
      if (svgStr) {
        const sfx = diagrams.length > 1 ? '-' + (i + 1) : '';
        imgFolder.file('wiring-diagram' + sfx + '.svg', svgStr);
      }
    }
    // Generate step images
    const steps = parseStepsFromGuide(guide);
    if (steps.length) {
      const stepsFolder = zip.folder('steps');
      for (let i = 0; i < steps.length; i++) {
        const blob = await renderStepImage(steps[i], i + 1, steps.length);
        if (blob) stepsFolder.file('step-' + String(i + 1).padStart(2, '0') + '.png', blob);
      }
    }
    zip.file('support.json', JSON.stringify({
      supportedDiagram: support.supportedDiagram,
      safeTextOnly: support.safeTextOnly,
      canSimulate: support.canSimulate,
      issues: support.issues,
    }, null, 2));
    zip.file('index.html', buildProjectHtml(name, guide, diagrams.length, steps));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, slug + '.zip', 'application/zip');
  }

  function showDeleteConfirm(prompt, guide, onDelete, noDownload) {
    _del = { cb: onDelete, guide, prompt };
    gid('delModalPrompt').textContent = prompt;
    gid('delModalDownload').style.display = noDownload ? 'none' : '';
    gid('delModalBg').classList.add('open');
  }
  function closeDelModal() { gid('delModalBg').classList.remove('open'); _del = { cb: null, guide: null, prompt: null }; }

  function animateDelete(el, onDone) {
    el.style.height = el.offsetHeight + 'px'; el.style.overflow = 'hidden'; el.style.pointerEvents = 'none';
    el.style.transition = 'transform .22s ease-in,opacity .22s ease-in';
    el.style.transform = 'translateX(60px)'; el.style.opacity = '0';
    setTimeout(() => {
      el.style.transition = 'height .18s ease,padding .18s ease,margin .18s ease,border-width .18s ease';
      el.style.height = '0'; el.style.paddingTop = '0'; el.style.paddingBottom = '0';
      el.style.marginTop = '0'; el.style.marginBottom = '0'; el.style.borderWidth = '0';
      setTimeout(onDone, 180);
    }, 220);
  }

  function commitHistory(h) { saveHist(h); renderHist(); renderHeroRecent(); }

  function deleteFromHist(ts, el) {
    function doDelete() {
      const h = getHist().filter(i => i.ts !== ts); commitHistory(h);
      if (lastTs === ts) { lastTs = null; newSession(); }
    }
    if (el) { animateDelete(el, doDelete); } else { doDelete(); }
  }

  /* ── Multi-select ── */
  function toggleSelect(ts) {
    if (selectedTs.has(ts)) selectedTs.delete(ts); else selectedTs.add(ts);
    updateSelState();
  }
  function clearSelection() { selectedTs.clear(); updateSelState(); }
  function updateSelState() {
    document.querySelectorAll('.hist-item[data-ts],.hero-recent-item[data-ts]').forEach(el => {
      el.classList.toggle('selected', selectedTs.has(Number(el.dataset.ts)));
    });
    const n = selectedTs.size;
    const label = n === 1 ? '1 SELECTED' : `${n} SELECTED`;
    gid('heroSelCount').textContent = label; gid('histSelCount').textContent = label;
    gid('heroSelBar').classList.toggle('visible', n > 0);
    gid('histSelBar').classList.toggle('visible', n > 0);
  }
  function bulkDelete() {
    const tsList = [...selectedTs]; const n = tsList.length;
    showDeleteConfirm(n === 1 ? '1 project' : `${n} projects`, null, () => {
      const affected = new Set(tsList);
      tsList.forEach(ts => {
        const el = document.querySelector(`.hist-item[data-ts="${ts}"],.hero-recent-item[data-ts="${ts}"]`);
        if (el) animateDelete(el, () => {});
      });
      setTimeout(() => {
        const h = getHist().filter(i => !affected.has(i.ts));
        const needReset = affected.has(lastTs); if (needReset) lastTs = null;
        selectedTs.clear(); commitHistory(h);
        if (needReset) newSession();
      }, 420);
    }, true);
  }
  function renderHist() {
    const h = getHist();
    if (!h.length) { histList.innerHTML = '<div class="hist-empty">No builds yet</div>'; return; }
    histList.innerHTML = '';
    h.forEach(item => {
      const el = document.createElement('div'); el.classList.add('hist-item');
      el.tabIndex = 0; el.setAttribute('role', 'button'); el.dataset.ts = item.ts;
      if (selectedTs.has(item.ts)) el.classList.add('selected');
      const d = new Date(item.ts), ts = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = `<button class="item-cb" title="Select" aria-label="Select" tabindex="-1">${ICON_CHECK}</button><div class="hist-item-body"><div class="hist-item-prompt" title="${esc(item.prompt)}">${esc(getProjectName(item))}</div><div class="hist-item-meta">${esc(item.skill)} &middot; ${esc(ts)}</div></div><button class="item-dl" title="Download" aria-label="Download project" tabindex="-1">${ICON_DOWNLOAD}</button><button class="item-del" title="Delete" aria-label="Delete project" tabindex="-1">${ICON_TRASH}</button>`;
      const go = () => {
        if (selectedTs.size > 0) { toggleSelect(item.ts); return; }
        histPanel.classList.remove('open');
        if (!restoreProject(item)) { dismissHero(); chatInput.focus(); }
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      el.querySelector('.item-cb').addEventListener('click', e => { e.stopPropagation(); toggleSelect(item.ts); });
      el.querySelector('.item-dl').addEventListener('click', e => { e.stopPropagation(); if (item.guide) downloadProjectFolder(item.guide, item.prompt); });
      el.querySelector('.item-del').addEventListener('click', e => {
        e.stopPropagation();
        showDeleteConfirm(getProjectName(item), item.guide, () => deleteFromHist(item.ts, el));
      });
      histList.appendChild(el);
    });
  }

  /* ── Hero recent projects ── */
  function renderHeroRecent() {
    const heroRecent = gid('heroRecent');
    const h = getHist().slice(0, 5);
    heroRecent.innerHTML = '';
    if (!h.length) return;
    const title = document.createElement('div');
    title.classList.add('hero-recent-title');
    title.textContent = 'recent projects';
    heroRecent.appendChild(title);
    h.forEach(item => {
      const el = document.createElement('div'); el.classList.add('hero-recent-item');
      el.tabIndex = 0; el.setAttribute('role', 'button'); el.dataset.ts = item.ts;
      if (selectedTs.has(item.ts)) el.classList.add('selected');
      const ago = timeAgo(item.ts);
      el.innerHTML = `<button class="item-cb" title="Select" aria-label="Select" tabindex="-1">${ICON_CHECK}</button><span class="hero-recent-prompt" title="${esc(item.prompt)}">${esc(getProjectName(item))}</span><span class="hero-recent-meta">${esc(ago)}</span><button class="item-dl" title="Download" aria-label="Download project" tabindex="-1">${ICON_DOWNLOAD}</button><button class="item-del" title="Delete" aria-label="Delete project" tabindex="-1">${ICON_TRASH}</button>`;
      const go = () => {
        if (selectedTs.size > 0) { toggleSelect(item.ts); return; }
        if (restoreProject(item)) { dismissHero(); } else { heroInput.value = item.prompt; send(item.prompt, null); }
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      el.querySelector('.item-cb').addEventListener('click', e => { e.stopPropagation(); toggleSelect(item.ts); });
      el.querySelector('.item-dl').addEventListener('click', e => { e.stopPropagation(); if (item.guide) downloadProjectFolder(item.guide, item.prompt); });
      el.querySelector('.item-del').addEventListener('click', e => {
        e.stopPropagation();
        showDeleteConfirm(getProjectName(item), item.guide, () => deleteFromHist(item.ts, el));
      });
      heroRecent.appendChild(el);
    });
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
    const hr = Math.floor(m / 60); if (hr < 24) return hr + 'h ago';
    const d = Math.floor(hr / 24); if (d < 7) return d + 'd ago';
    return new Date(ts).toLocaleDateString();
  }

  /* ── Hero ── */
  function dismissHero() {
    if (!heroActive) return;
    heroActive = false;
    hero.classList.add('dismissed');
    setTimeout(() => hero.classList.add('hidden'), 400);
    chatInput.focus();
  }

  /* ── Skill system ── */
  function applySkill(n) {
    localStorage.setItem('mrt-skill', n);
    document.querySelectorAll('.hero-skill').forEach(b => b.classList.toggle('active', b.dataset.skill === String(n)));
    skillGrid.querySelectorAll('.chip').forEach(b => b.classList.toggle('active', b.dataset.skill === String(n)));
    const skill = SKILLS[n] || 'MONKEY';
    statusSkill.textContent = normalizeSkillLabel(skill);
    updateSkillHelper(skill);
  }
  function getSkill() { return SKILLS[Number(localStorage.getItem('mrt-skill')) || 1] || 'MONKEY'; }
  function getAge() { return Number(localStorage.getItem('mrt-age')) || 25; }

  /* ── Messages ── */
  function addMsg(text, role) {
    const w = document.createElement('div'); w.classList.add('msg', role);
    const l = document.createElement('div'); l.classList.add('msg-who'); l.textContent = role === 'user' ? 'YOU' : 'MERTLE.BOT';
    const t = document.createElement('div'); t.classList.add('msg-body'); t.textContent = text;
    w.appendChild(l); w.appendChild(t); chatLog.appendChild(w); scrollChat();
    return w;
  }
  function addThinkingMsg() {
    const w = document.createElement('div'); w.classList.add('msg', 'bot');
    const l = document.createElement('div'); l.classList.add('msg-who'); l.textContent = 'MERTLE.BOT';
    const t = document.createElement('div'); t.classList.add('msg-body');
    t.innerHTML = '<div class="thinking-dots"><span></span><span></span><span></span></div>';
    w.appendChild(l); w.appendChild(t); chatLog.appendChild(w); scrollChat();
    return w;
  }

  function renderLoadingFeed() {
    const feed = gid('loadingFeed');
    if (!feed) return;
    feed.innerHTML = `
      <div class="loading-feed-card">
        <div class="loading-feed-title">BUILDING YOUR PROJECT</div>
        <div class="loading-feed-list">
          ${BUILD_STATUS_STEPS.map((step, idx) => {
            const state = idx < loadingStepIndex ? 'done' : idx === loadingStepIndex ? 'active' : 'pending';
            return `
              <div class="loading-feed-step ${state}">
                <span class="loading-feed-icon">${idx < loadingStepIndex ? '✓' : idx === loadingStepIndex ? '>' : '·'}</span>
                <span class="loading-feed-text">${esc(step)}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="loading-feed-progress">
          <div class="loading-feed-progress-bar" style="width:${loadingProgress.toFixed(1)}%"></div>
        </div>
      </div>
    `;
  }

  function clearLoadingFeedTimers() {
    loadingStepTimers.forEach(id => clearTimeout(id));
    loadingStepTimers = [];
    if (loadingProgressFrame) cancelAnimationFrame(loadingProgressFrame);
    loadingProgressFrame = null;
    if (loadingHideTimer) clearTimeout(loadingHideTimer);
    loadingHideTimer = null;
  }

  function tickLoadingProgress() {
    if (!generating) return;
    const elapsed = performance.now() - loadingStartTs;
    loadingProgress = Math.min(90, 90 * (1 - Math.exp(-elapsed / 5000)));
    renderLoadingFeed();
    loadingProgressFrame = requestAnimationFrame(tickLoadingProgress);
  }

  function startLoadingFeed() {
    const feed = gid('loadingFeed');
    if (!feed) return;
    clearLoadingFeedTimers();
    loadingStepIndex = 0;
    loadingProgress = 4;
    loadingStartTs = performance.now();
    feed.hidden = false;
    renderLoadingFeed();
    BUILD_STATUS_STEPS.slice(1).forEach((_, offset) => {
      const timer = setTimeout(() => {
        if (!generating) return;
        loadingStepIndex = Math.min(offset + 1, BUILD_STATUS_STEPS.length - 1);
        renderLoadingFeed();
      }, 1200 + offset * 1100);
      loadingStepTimers.push(timer);
    });
    loadingProgressFrame = requestAnimationFrame(tickLoadingProgress);
  }

  function finishLoadingFeed() {
    const feed = gid('loadingFeed');
    if (!feed) return;
    clearLoadingFeedTimers();
    loadingStepIndex = BUILD_STATUS_STEPS.length;
    loadingProgress = 100;
    renderLoadingFeed();
    loadingHideTimer = setTimeout(() => {
      feed.hidden = true;
    }, 380);
  }

  function focusProjectEdit() {
    if (!chatPane || !chatInput) return;
    chatPane.classList.remove('collapsed');
    const prompt = "I'd like to change...";
    chatInput.value = prompt;
    charCount.textContent = `${prompt.length}/300`;
    chatInput.focus();
    chatInput.setSelectionRange(prompt.length, prompt.length);
  }

  function jumpToBuildSection(key) {
    const target = buildOutput?.querySelector(`[data-build-section="${key}"]`);
    if (!target || !outputScroll) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setupBuildNavigation() {
    buildNavCleanup();
    buildNavCleanup = () => {};
    if (!buildOutput || !outputScroll) return;
    const nav = buildOutput.querySelector('.build-nav');
    if (!nav) return;
    const tabs = [...nav.querySelectorAll('.build-nav-tab')];
    const sections = tabs.map(tab => ({
      key: tab.dataset.navTarget,
      tab,
      section: buildOutput.querySelector(`[data-build-section="${tab.dataset.navTarget}"]`)
    }));
    const setActive = (key) => {
      tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.navTarget === key));
    };
    sections.forEach(({ tab, section }) => {
      tab.classList.toggle('disabled', !section);
      const handler = () => {
        if (!section) return;
        jumpToBuildSection(tab.dataset.navTarget);
      };
      tab.addEventListener('click', handler);
      tab._navHandler = handler;
    });
    const onScroll = () => {
      const rootTop = outputScroll.getBoundingClientRect().top;
      let active = 'overview';
      let best = -Infinity;
      sections.forEach(({ key, section }) => {
        if (!section) return;
        const offset = section.getBoundingClientRect().top - rootTop;
        if (offset <= 120 && offset > best) {
          best = offset;
          active = key;
        }
      });
      setActive(active);
    };
    outputScroll.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    buildNavCleanup = () => {
      outputScroll.removeEventListener('scroll', onScroll);
      sections.forEach(({ tab }) => {
        if (tab._navHandler) tab.removeEventListener('click', tab._navHandler);
        delete tab._navHandler;
      });
    };
  }

  /* ── Markdown renderer ── */
  function inlineFmt(s) { return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>'); }
  function guessFile(code, sec) {
    if (code.includes('#include') || code.includes('void setup()')) return 'sketch.ino';
    if (code.includes('import ') || code.includes('def ')) return 'main.py';
    if (code.includes('const ') || code.includes('function ')) return 'index.js';
    if (sec && /wiring/i.test(sec)) return 'wiring-diagram.txt';
    return 'code.txt';
  }
  function toggleCode(id) { const w = document.getElementById('wrap-' + id); if (w) w.classList.toggle('open'); }
  function copyCode(id, btn) {
    const p = document.getElementById(id);
    if (!p) return;
    navigator.clipboard.writeText(p.textContent).then(() => {
      btn.textContent = 'COPIED'; btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'COPY'; btn.classList.remove('copied'); }, 1500);
    }).catch(() => { btn.textContent = 'FAILED'; setTimeout(() => { btn.textContent = 'COPY'; }, 1500); });
  }
  function downloadCode(id) {
    const p = document.getElementById(id);
    if (!p) return;
    const w = p.closest('.code-wrap'), n = w ? w.querySelector('.file-name') : null;
    const f = n ? n.textContent.trim() : 'code.txt';
    downloadBlob(p.textContent, f);
  }

  function highlightArduino(raw) {
    const KW = new Set(['void','int','long','char','float','double','boolean','bool','byte','short',
      'unsigned','signed','const','static','volatile','extern','struct','union','class','typedef',
      'new','delete','this','return','if','else','for','while','do','switch','case','break',
      'continue','default','goto','sizeof','enum','namespace','using','template','public','private',
      'protected','virtual','override','nullptr','true','false','null','NULL','String',
      'HIGH','LOW','INPUT','OUTPUT','INPUT_PULLUP','INPUT_PULLDOWN','LED_BUILTIN',
      'LSBFIRST','MSBFIRST','CHANGE','FALLING','RISING','PRESSED','RELEASED']);
    const FN = new Set(['setup','loop','pinMode','digitalWrite','digitalRead','analogWrite','analogRead',
      'analogReference','delay','delayMicroseconds','micros','millis','map','constrain','min','max',
      'abs','pow','sqrt','sin','cos','tan','floor','ceil','round','log','exp','random','randomSeed',
      'tone','noTone','shiftOut','shiftIn','pulseIn','pulseInLong','attachInterrupt','detachInterrupt',
      'interrupts','noInterrupts','Serial','Serial1','Serial2','Serial3','Wire','SPI','EEPROM',
      'Servo','LiquidCrystal','SoftwareSerial','Keyboard','Mouse',
      'begin','end','print','println','write','read','available','availableForWrite','flush','peek',
      'parseInt','parseFloat','find','findUntil','readBytes','readBytesUntil','readString',
      'readStringUntil','setTimeout','transfer','requestFrom','beginTransmission','endTransmission',
      'onReceive','onRequest','attach','detach','update','get','put']);
    const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#[a-zA-Z]\w*[^\n]*|0x[0-9a-fA-F]+[uUlL]*|\b\d+\.?\d*(?:[eE][+-]?\d+)?[fFuUlL]*\b|[a-zA-Z_]\w*)/g;
    const out = []; let last = 0, m;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) out.push(esc(raw.slice(last, m.index)));
      const t = m[0];
      let cls = null;
      if (t.startsWith('/*') || t.startsWith('//')) cls = 'ard-cmt';
      else if (t.startsWith('"') || t.startsWith("'")) cls = 'ard-str';
      else if (t.startsWith('#')) cls = 'ard-pre';
      else if (/^0x/i.test(t) || /^\d/.test(t)) cls = 'ard-num';
      else if (KW.has(t)) cls = 'ard-kw';
      else if (FN.has(t)) cls = 'ard-fn';
      out.push(cls ? '<span class="' + cls + '">' + esc(t) + '</span>' : esc(t));
      last = m.index + t.length;
    }
    if (last < raw.length) out.push(esc(raw.slice(last)));
    return out.join('');
  }

  function renderMd(raw) {
    let html = '';
    const lines = raw.split('\n');
    let inCode = false, codeLang = '', code = '', inUl = false, inOl = false, sec = '';
    let partsInSection = [];
    let stepBuffer = [], lastDiagramJson = '', title = '';
    let currentSectionKey = '', sectionOpen = false, sectionHasDiagram = false;
    lastPartsForAmazon = [];
    function closeSection() {
      if (!sectionOpen) return;
      if (currentSectionKey === 'wiring' && !sectionHasDiagram) html += renderDiagramFallback();
      html += '</section>';
      sectionOpen = false;
      sectionHasDiagram = false;
    }
    function openSection(key, label) {
      closeSection();
      currentSectionKey = key;
      sectionOpen = true;
      sectionHasDiagram = false;
      html += `<section class="build-section" id="build-section-${key}" data-build-section="${key}">`;
      if (label) html += '<div class="section-header">' + esc(label) + '</div>';
    }
    function cl() {
      if (inUl) {
        if (/^PARTS$/i.test(sec) && partsInSection.length) {
          lastPartsForAmazon = [...partsInSection];
          html += '</ul><button class="amazon-all-btn" onclick="shopAllOnAmazon()">&gt;&gt; SHOP ALL PARTS ON AMAZON</button>';
        } else { html += '</ul>'; }
        inUl = false;
      }
        if (inOl) {
          if (stepBuffer.length) {
            const stepsJson = JSON.stringify(stepBuffer)
              .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
            const diagJson = lastDiagramJson
              .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
            const projectId = hashString((title || 'project') + '|' + raw);
            html += '<div class="instruction-book-mount" data-project-id="' + projectId + '" data-steps="' + stepsJson + '" data-diagram="' + diagJson + '"></div>';
            stepBuffer = [];
          } else {
            html += '</div>';
          }
          inOl = false;
      }
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('```')) {
        if (inCode) {
          if (codeLang === 'wiregen') {
            const jsonStr = code.trim();
            lastDiagramJson = jsonStr;
            sectionHasDiagram = true;
            const escaped = jsonStr.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
            html += '<div class="wiregen-mount" data-diagram="' + escaped + '"></div>';
          } else {
            const e = highlightArduino(code.trimEnd()), id = 'c-' + Math.random().toString(36).slice(2, 8), fn = guessFile(code, sec);
            html += '<div class="code-wrap" id="wrap-' + id + '"><div class="code-file-bar" onclick="toggleCode(\'' + id + '\')"><span class="file-arrow">&#9654;</span><span class="file-name">' + esc(fn) + '</span><div class="code-file-actions"><button class="code-file-btn" onclick="event.stopPropagation();copyCode(\'' + id + '\',this)">COPY</button><button class="code-file-btn" onclick="event.stopPropagation();downloadCode(\'' + id + '\')">DOWNLOAD</button></div></div><div class="wiring-expand"><pre class="wiring-block" id="' + id + '">' + e + '</pre></div></div>';
          }
          code = ''; codeLang = ''; inCode = false;
        } else { cl(); inCode = true; codeLang = line.trimStart().slice(3).trim().toLowerCase(); }
        continue;
      }
      if (inCode) { code += line + '\n'; continue; }
      if (line.startsWith('# ')) {
        cl();
        title = line.slice(2).trim();
        const skillMeta = normalizeSkillLabel(getRenderedSkill());
        html += '<div class="build-edit-bar"><button type="button" class="edit-project-btn" onclick="triggerProjectEdit()"><span class="edit-project-icon" aria-hidden="true"></span>EDIT THIS PROJECT</button><div class="build-edit-copy">Jump back to the conversation and ask for a revision.</div></div>';
        html += '<div class="project-name" contenteditable="true" spellcheck="false" onblur="persistTitle(this)">' + inlineFmt(esc(title)) + '</div><div class="project-name-hint">click to rename</div>';
        html += '<div class="build-meta"><span class="build-meta-label">Build mode</span><span class="build-meta-pill">' + esc(skillMeta) + '</span></div>';
        html += renderBuildNav();
        openSection('overview');
        html += renderProjectPreview(title, raw);
        continue;
      }
      if (line.startsWith('## ')) {
        cl();
        sec = line.slice(3).trim();
        partsInSection = [];
        openSection(slugifySection(sec), sec);
        continue;
      }
      if (/^[-*]\s/.test(line)) {
        if (inOl) { continue; }
        if (!inUl) { html += '<ul class="parts-list">'; inUl = true; }
        const partText = line.replace(/^[-*]\s/, '');
        if (/^PARTS$/i.test(sec)) {
          partsInSection.push(partText);
          const q = encodeURIComponent(partText);
          html += '<li><span class="part-name">' + inlineFmt(esc(partText)) + '</span><a href="https://www.amazon.com/s?k=' + q + '" target="_blank" rel="noopener noreferrer" class="part-buy-link">Buy</a></li>';
        } else { html += '<li>' + inlineFmt(esc(partText)) + '</li>'; }
        continue;
      }
      if (/^\d+\.\s/.test(line)) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (!inOl) { inOl = true; }
        const stepNum = line.match(/^(\d+)\./)[1];
        const stepText = line.replace(/^\d+\.\s/, '');
        const action = classifyAction(stepText);
        stepBuffer.push({ num: stepNum, text: stepText, action });
        continue;
      }
      if (!line.trim()) {
        let next = ''; for (let j = i + 1; j < lines.length; j++) { if (lines[j].trim()) { next = lines[j]; break; } }
        if (inOl && /^\d+\.\s/.test(next)) continue;
        if (inOl && stepBuffer.length > 0) continue;
        if (inUl && /^[-*]\s/.test(next)) continue;
        cl(); continue;
      }
      if (inOl && stepBuffer.length > 0) continue;
      cl(); html += '<p>' + inlineFmt(esc(line)) + '</p>';
    }
    if (inCode) {
      if (codeLang === 'wiregen') {
        // Streaming: wiregen block not yet closed — show loading placeholder
        sectionHasDiagram = true;
        html += '<div class="wiregen-loading">Building wiring diagram...</div>';
      } else {
        const e = highlightArduino(code.trimEnd()), id = 'c-' + Math.random().toString(36).slice(2, 8), fn = guessFile(code, sec);
        html += '<div class="code-wrap" id="wrap-' + id + '"><div class="code-file-bar" onclick="toggleCode(\'' + id + '\')"><span class="file-arrow">&#9654;</span><span class="file-name">' + esc(fn) + '</span><div class="code-file-actions"><button class="code-file-btn" onclick="event.stopPropagation();copyCode(\'' + id + '\',this)">COPY</button><button class="code-file-btn" onclick="event.stopPropagation();downloadCode(\'' + id + '\')">DOWNLOAD</button></div></div><div class="wiring-expand"><pre class="wiring-block" id="' + id + '">' + e + '</pre></div></div>';
      }
    }
    cl();
    closeSection();
    return html;
  }

  function shopAllOnAmazon() {
    if (!lastPartsForAmazon.length) return;
    lastPartsForAmazon.forEach(p => { window.open('https://www.amazon.com/s?k=' + encodeURIComponent(p), '_blank', 'noopener,noreferrer'); });
  }

  function destroyWiregenInstances() {
    _wiregenInstances.forEach(inst => { try { unmount(inst); } catch {} });
    _wiregenInstances = [];
  }

  function mountWiregenDiagrams() {
    if (!buildOutput) return;
    const mounts = buildOutput.querySelectorAll('.wiregen-mount');
    mounts.forEach(el => {
      if (el.dataset.mounted) return;
      el.dataset.mounted = '1';
      try {
        const diagram = JSON.parse(el.dataset.diagram);
        const validation = validateDiagram(diagram);
        if (!validation.ok) throw new Error(validation.issues[0] || 'Unsupported diagram');
        const inst = mount(WiringCanvas, { target: el, props: { diagram } });
        _wiregenInstances.push(inst);
      } catch (err) {
        el.innerHTML = renderDiagramFallback(err.message || 'Diagram coming soon for this module');
      }
    });
  }

  function destroyInstructionBookInstances() {
    _instructionBookInstances.forEach(inst => { try { unmount(inst); } catch {} });
    _instructionBookInstances = [];
  }

  function mountInstructionBooks() {
    if (!buildOutput) return;
    const mounts = buildOutput.querySelectorAll('.instruction-book-mount');
    mounts.forEach(el => {
      if (el.dataset.mounted) return;
      el.dataset.mounted = '1';
      try {
        const steps = JSON.parse(
          el.dataset.steps
            .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
        );
        let diagram = null;
        const diagRaw = el.dataset.diagram;
        if (diagRaw) {
          try {
            diagram = JSON.parse(
              diagRaw.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
            );
          } catch { /* diagram is optional */ }
        }
        const projectId = el.dataset.projectId || hashString(JSON.stringify(steps));
        const inst = mount(InstructionBook, { target: el, props: { steps, diagram, projectId } });
        _instructionBookInstances.push(inst);
      } catch (err) {
        el.innerHTML = '<p style="color:var(--hi);font-size:12px;">Instruction book error: ' + esc(err.message) + '</p>';
      }
    });
  }

  /* ── Generate state ── */
  function setGenerating(on) {
    generating = on;
    sendBtn.textContent = on ? 'STOP' : 'SEND';
    sendBtn.classList.toggle('stopping', on);
    chatInput.disabled = on;
    chatPane?.classList.toggle('generating', on);
    workspace?.classList.toggle('is-generating', on);
    if (on) {
      statusDot.classList.add('active');
      let d = 0; statusText.textContent = 'BUILDING';
      statusInterval = setInterval(() => { d = (d + 1) % 4; statusText.textContent = 'BUILDING' + '.'.repeat(d); }, 350);
      startLoadingFeed();
    } else {
      statusDot.classList.remove('active');
      clearInterval(statusInterval); statusText.textContent = 'READY';
      finishLoadingFeed();
      chatInput.focus();
    }
  }

  /* ── Clarify flow ── */
  function formatClarifications(answers) {
    const labels = { board: 'Board', components: 'Available parts', complexity: 'Project complexity', comments: 'Code comments', power: 'Power source', purpose: 'Project purpose' };
    const lines = Object.entries(answers).filter(([, v]) => v).map(([k, v]) => `- ${labels[k] || k}: ${v}`);
    return lines.length ? 'Additional context from user:\n' + lines.join('\n') : null;
  }

  function closeClarifyOverlay() {
    gid('clarifyBg').classList.remove('open');
    clarifyStage = 'question';
  }

  function finishClarify() {
    if (clarifyStage === 'question') saveClarifyAnswer();
    closeClarifyOverlay();
    try { localStorage.setItem('mrt-last-clarify', JSON.stringify(clarifyAnswers)); } catch {}
    const clarifications = formatClarifications(clarifyAnswers);
    addMsg('Got it! Building your project now...', 'bot');
    _doGenerate(clarifyOriginalPrompt, clarifications);
  }

  function skipClarify() {
    closeClarifyOverlay();
    addMsg('On it — building right away.', 'bot');
    _doGenerate(clarifyOriginalPrompt, null);
  }

  function saveClarifyAnswer() {
    const q = clarifyQuestions[clarifyIdx];
    if (!q) return;
    const inp = gid('clarifyInner').querySelector('.clarify-text-input');
    if (inp) clarifyAnswers[q.id] = inp.value.trim();
  }

  function renderClarifyFrame({ title, subtitle, progressPct, body, footer }) {
    gid('clarifyInner').innerHTML = `
      <div class="clarify-progress-meta">
        <div class="clarify-progress-label">${esc(title)}</div>
        <div class="clarify-progress-subtitle">${esc(subtitle)}</div>
      </div>
      <div class="clarify-progress-bar"><span style="width:${progressPct}%"></span></div>
      ${body}
      <div class="clarify-nav">${footer}</div>
    `;
  }

  function advanceClarify() {
    const q = clarifyQuestions[clarifyIdx];
    if (!q) { finishClarify(); return; }
    saveClarifyAnswer();
    if (clarifyIdx < clarifyQuestions.length - 1) {
      renderClarifyQuestion(clarifyIdx + 1);
    } else {
      renderClarifySummary();
    }
  }

  function renderClarifyQuestion(idx) {
    clarifyStage = 'question';
    clarifyIdx = idx;
    const q = clarifyQuestions[idx];
    if (!q) return;
    const total = clarifyQuestions.length;
    const prev = clarifyAnswers[q.id] || '';
    let prevAnswers = {};
    try { prevAnswers = JSON.parse(localStorage.getItem('mrt-last-clarify') || '{}'); } catch {}
    const preselect = prev || prevAnswers[q.id] || '';

    const dots = Array.from({ length: total }, (_, i) =>
      `<span class="clarify-dot${i < idx ? ' done' : i === idx ? ' cur' : ''}"></span>`
    ).join('');

    // All questions get a text input. Choice/toggle also show chips that populate it.
    const chipHtml = (q.type === 'choice' || q.type === 'toggle')
      ? `<div class="clarify-chips">${q.options.map(opt =>
          `<button type="button" class="clarify-chip${preselect === opt ? ' active' : ''}" data-val="${esc(opt)}">${esc(opt)}</button>`
        ).join('')}</div>`
      : '';
    const inputHtml = `${chipHtml}<input class="clarify-text-input" type="text" placeholder="${esc(q.hint || 'or type your own...')}" value="${esc(preselect)}" maxlength="200" autocomplete="off" spellcheck="false"/>`;

    const isLast = idx === total - 1;
    renderClarifyFrame({
      title: `Question ${idx + 1} of ${total}`,
      subtitle: 'A couple quick choices help tailor the build guide.',
      progressPct: ((idx + 1) / (total + 1)) * 100,
      body: `
        <div class="clarify-progress">${dots}</div>
        <div class="clarify-question">${esc(q.question)}</div>
        ${inputHtml}
      `,
      footer: `
        ${idx > 0 ? `<button type="button" class="clarify-back" id="clarifyBack">&lt; GO BACK</button>` : `<span></span>`}
        <button type="button" class="clarify-next" id="clarifyNext">${isLast ? 'REVIEW BUILD &gt;' : 'NEXT &gt;'}</button>
      `
    });

    const textInput = gid('clarifyInner').querySelector('.clarify-text-input');

    if (q.type === 'choice' || q.type === 'toggle') {
      gid('clarifyInner').querySelectorAll('.clarify-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          gid('clarifyInner').querySelectorAll('.clarify-chip').forEach(b => b.classList.toggle('active', b === btn));
          if (textInput) { textInput.value = btn.dataset.val; textInput.focus(); }
        });
      });
      // Typing in the input deselects chips
      if (textInput) {
        textInput.addEventListener('input', () => {
          gid('clarifyInner').querySelectorAll('.clarify-chip').forEach(b => b.classList.remove('active'));
        });
      }
    }

    const nextBtn = gid('clarifyNext');
    if (nextBtn) nextBtn.addEventListener('click', advanceClarify);
    const backBtn = gid('clarifyBack');
    if (backBtn) backBtn.addEventListener('click', () => { renderClarifyQuestion(idx - 1); });

    if (textInput) {
      textInput.focus();
      textInput.addEventListener('keydown', e => { if (e.key === 'Enter') advanceClarify(); });
    } else if (nextBtn) {
      nextBtn.focus();
    }
  }

  function renderClarifySummary() {
    clarifyStage = 'summary';
    const total = clarifyQuestions.length;
    const board = clarifyAnswers.board || 'No preference';
    const power = clarifyAnswers.power || 'No preference';
    renderClarifyFrame({
      title: 'Review before build',
      subtitle: 'One last check before Mertle generates the full guide.',
      progressPct: 100,
      body: `
        <div class="clarify-summary">
          <div class="clarify-summary-row">
            <span class="clarify-summary-label">Prompt</span>
            <span class="clarify-summary-value">${esc(clarifyOriginalPrompt)}</span>
          </div>
          <div class="clarify-summary-row">
            <span class="clarify-summary-label">Board</span>
            <span class="clarify-summary-value">${esc(board)}</span>
          </div>
          <div class="clarify-summary-row">
            <span class="clarify-summary-label">Power</span>
            <span class="clarify-summary-value">${esc(power)}</span>
          </div>
          <div class="clarify-summary-row">
            <span class="clarify-summary-label">Skill level</span>
            <span class="clarify-summary-value">${esc(normalizeSkillLabel(getSkill()))}</span>
          </div>
          <div class="clarify-summary-note">Answered ${total} setup question${total === 1 ? '' : 's'}.</div>
        </div>
      `,
      footer: `
        <button type="button" class="clarify-back" id="clarifySummaryBack">&lt; GO BACK</button>
        <button type="button" class="clarify-next clarify-confirm" id="clarifyConfirm">LOOKS GOOD - BUILD IT</button>
      `
    });
    gid('clarifyConfirm')?.addEventListener('click', finishClarify);
    gid('clarifySummaryBack')?.addEventListener('click', () => renderClarifyQuestion(Math.max(clarifyQuestions.length - 1, 0)));
  }

  function showClarifyOverlay() {
    gid('clarifyBg').classList.add('open');
    renderClarifyQuestion(0);
  }

  /* ── Core generate (no UI setup — called after UI is ready) ── */
  async function _doGenerate(text, clarifications) {
    buildNavCleanup();
    buildNavCleanup = () => {};
    buildOutput.classList.add('active');
    buildOutput.innerHTML = '';
    buildOutput.classList.add('streaming-cursor');
    requestAnimationFrame(() => {
      const op = workspace.querySelector('.output');
      op.classList.add('output-entering');
      op.addEventListener('animationend', () => op.classList.remove('output-entering'), { once: true });
    });
    const thinkEl = addThinkingMsg();
    setGenerating(true);

    let apiPrompt = text;
    if (lastGuide) {
      apiPrompt = 'Here is the current build guide:\n\n' + lastGuide + '\n\nUser request: ' + text + '\n\nIf this is an edit request, provide the FULL updated build guide with the requested changes applied. Use the same format. If this is a completely new project, ignore the current guide and start fresh.';
    }

    let accumulated = '', displayed = 0, typeTimer = null, thinkShown = true;
    function stopTyping() { if (typeTimer) { clearInterval(typeTimer); typeTimer = null; } }
    function startTyping() {
      if (typeTimer) return;
      typeTimer = setInterval(() => {
        if (displayed >= accumulated.length) return;
        displayed = Math.min(displayed + 4, accumulated.length);
        buildOutput.innerHTML = renderMd(accumulated.slice(0, displayed));
        scrollOut();
      }, 8);
    }
    function parseLine(b) {
      if (!b.startsWith('data: ')) return null;
      const d = b.slice(6).trim(); if (d === '[DONE]' || !d) return null;
      try { return JSON.parse(d); } catch { return null; }
    }
    try {
      controller = new AbortController();
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: apiPrompt, skill: getSkill(), age: getAge(), clarifications }),
        signal: controller.signal
      });
      if (!res.ok) {
        const body = await res.text(); let msg;
        try { msg = JSON.parse(body)?.error; } catch {}
        if (!msg) { msg = res.status === 401 ? 'invalid x-api-key' : res.status === 429 ? 'rate limited' : body || `Server error ${res.status}`; }
        throw new Error(msg);
      }

      if (!res.body) throw new Error('Streaming not supported');

      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = '', err2 = null;

      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const bl = buf.split('\n'); buf = bl.pop();
        for (const b of bl) { const p = parseLine(b); if (!p) continue; if (p.error) { err2 = p.error; continue; } if (p.t) { accumulated += p.t; if (!typeTimer) startTyping(); } }
      }
      if (buf.trim()) { const p = parseLine(buf); if (p) { if (p.error) err2 = p.error; else if (p.t) { accumulated += p.t; } } }
      stopTyping(); displayed = accumulated.length;
      const support = summarizeSupport(accumulated);
      if (!support.ok) throw new Error(support.issues.join(' '));
      destroyWiregenInstances();
      destroyInstructionBookInstances();
      buildOutput.innerHTML = renderMd(accumulated); scrollOut();
      mountWiregenDiagrams();
      mountInstructionBooks();
      setupBuildNavigation();
      buildOutput.classList.remove('streaming-cursor');
      if (thinkShown) { thinkEl.remove(); thinkShown = false; }

      if (err2 && !accumulated) throw new Error(err2);
      if (!accumulated && !err2) throw new Error('No response — check API key');

      if (/^#\s/m.test(accumulated) && /## PARTS/i.test(accumulated) && /## STEPS/i.test(accumulated)) {
        lastPrompt = text; lastGuide = accumulated; lastSkill = getSkill();
        lastTs = addHist(text, lastSkill, accumulated); gid('btnDelete').style.display = '';
        outputContext.textContent = normalizeSkillLabel(lastSkill);
        addMsg('Build guide ready. You can ask me to edit it.', 'bot');
        if (support.canSimulate) addSimBtn();
      }
    } catch (err) {
      stopTyping(); buildOutput.classList.remove('streaming-cursor');
      if (thinkShown) { thinkEl.remove(); thinkShown = false; }
      if (err.name !== 'AbortError') console.error('[mertle] generate error:', err);
      if (err.name === 'AbortError') {
        addMsg('Stopped.', 'bot');
        if (!accumulated) { buildOutput.classList.remove('active'); emptyState.classList.remove('hidden'); outputContext.textContent = ''; workspace.classList.add('no-build'); }
      } else {
        const m = err.message || '';
        const friendly = /credit|billing|too.low|balance/i.test(m)
          ? 'Whoops! Your Anthropic credit balance is too low — add credits at console.anthropic.com and try again.'
          : /api.key|authentication|401|invalid.*key|unauthorized/i.test(m)
          ? 'Whoops! API key error — check your key in Settings and try again.'
          : /failed validation|diagram unavailable|must include a valid wiregen diagram|unsupported functional parts/i.test(m)
          ? m
          : /rate.limit|429|too many/i.test(m)
          ? 'Whoops! Too many requests — wait a moment and try again.'
          : /network|fetch|failed to fetch|load/i.test(m)
          ? 'Whoops! Network error — check your connection and try again.'
          : /timeout/i.test(m)
          ? 'Whoops! Request timed out — try again.'
          : /no response/i.test(m)
          ? 'Whoops! No response from the API — check your key and try again.'
          : 'Whoops! Something went wrong. Try again.';
        if (!accumulated) { buildOutput.innerHTML = ''; }
        const ep = document.createElement('p'); ep.style.color = 'var(--hi)'; ep.style.marginTop = accumulated ? '16px' : '0'; ep.textContent = friendly;
        buildOutput.appendChild(ep);
        const rb = document.createElement('button'); rb.className = 'retry-btn'; rb.textContent = 'Retry';
        rb.addEventListener('click', () => { send(text, null); });
        buildOutput.appendChild(rb);
      }
    } finally { setGenerating(false); controller = null; updateHistChat(); }
  }

  /* ── Send (handles clarify intercept then delegates to _doGenerate) ── */
  async function send(text, clarifications = undefined) {
    if (generating) { if (controller) controller.abort(); return; }
    if (!text) return;

    // ── CLARIFY INTERCEPT: fresh builds only, when clarifications not yet decided ──
    if (clarifications === undefined && !lastGuide && text.length >= 10) {
      dismissHero();
      heroInput.value = ''; chatInput.value = ''; charCount.textContent = '0/300';
      outputContext.textContent = '';
      addMsg(text, 'user');
      emptyState.classList.add('hidden');
      workspace.classList.remove('no-build');
      const thinkElC = addThinkingMsg();
      let questions = [];
      try {
        const ac = new AbortController();
        const tid = setTimeout(() => ac.abort(), 4000);
        const r = await fetch('/api/clarify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }), signal: ac.signal
        });
        clearTimeout(tid);
        if (r.ok) { const d = await r.json(); questions = d.questions || []; }
      } catch { /* timeout or network error — proceed without clarify */ }
      thinkElC.remove();
      if (questions.length > 0) {
        clarifyOriginalPrompt = text;
        clarifyQuestions = questions;
        clarifyAnswers = {};
        clarifyIdx = 0;
        showClarifyOverlay();
        return;
      }
      // No questions needed — generate directly
      await _doGenerate(text, null);
      return;
    }

    // ── REGULAR PATH (edit, retry, short prompt, or post-clarify) ──
    dismissHero();
    heroInput.value = ''; chatInput.value = ''; charCount.textContent = '0/300';
    outputContext.textContent = '';
    addMsg(text, 'user');
    emptyState.classList.add('hidden');
    workspace.classList.remove('no-build');

    await _doGenerate(text, typeof clarifications === 'string' ? clarifications : null);
  }

  /* ── Simulate ── */
  function addSimBtn() {
    const btn = document.createElement('button'); btn.classList.add('sim-btn'); btn.innerHTML = 'SIMULATE &gt;&gt;';
    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = 'GENERATING SIM...';
      try {
        const res = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: lastPrompt, guide: lastGuide }) });
        if (!res.ok) { const { error } = await res.json(); throw new Error(error); }
        const result = await res.json();
        if (result.unsupported) {
          addMsg(`Simulation not available — this project uses parts Wokwi doesn't support: ${result.reason}`, 'bot');
          btn.innerHTML = 'SIMULATE &gt;&gt;'; btn.disabled = false;
          return;
        }
        const { embedUrl, projectUrl } = result;
        if (!embedUrl?.startsWith('https://wokwi.com/') || !projectUrl?.startsWith('https://wokwi.com/')) throw new Error('Invalid simulation URL');
        btn.remove();
        const fc = document.createElement('div'); fc.classList.add('sim-frame-container');
        const fr = document.createElement('iframe'); fr.classList.add('sim-frame'); fr.src = embedUrl; fr.setAttribute('allowfullscreen', '');
        fc.appendChild(fr); buildOutput.appendChild(fc);
        const lk = document.createElement('div'); lk.classList.add('sim-link');
        const lt = document.createTextNode('open full editor \u2192 ');
        const la = document.createElement('a'); la.href = projectUrl; la.target = '_blank'; la.rel = 'noopener noreferrer'; la.textContent = projectUrl;
        lk.appendChild(lt); lk.appendChild(la); buildOutput.appendChild(lk); scrollOut();
      } catch (e) { btn.innerHTML = 'SIMULATE &gt;&gt;'; btn.disabled = false; addMsg('Sim error: ' + e.message, 'bot'); }
    });
    buildOutput.appendChild(btn); scrollOut();
  }

  /* ── Settings ── */
  function applyTheme(n) {
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem('mrt-theme', n);
    themeGrid.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.theme === n));
  }
  function applyAge(a) { ageSlider.value = a; ageValEl.textContent = a; localStorage.setItem('mrt-age', a); }
  function applyFontScale(pct) {
    document.documentElement.style.setProperty('--fs', pct / 100);
    fontSlider.value = pct; fontValEl.textContent = pct + '%';
    localStorage.setItem('mrt-font-scale', pct);
  }

  async function checkKey() {
    try { const r = await fetch('/api/key'); const { configured } = await r.json(); if (!configured) modalBg.classList.add('open'); } catch {}
  }
  async function saveKey() {
    const k = keyInput.value.trim(); if (!k) { keyStatus.textContent = 'enter a key'; return; }
    saveKeyBtn.disabled = true; saveKeyBtn.textContent = '...'; keyStatus.textContent = '';
    try {
      const r = await fetch('/api/key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k }) });
      if (!r.ok) { const { error } = await r.json(); throw new Error(error); }
      keyStatus.style.color = 'var(--accent)'; keyStatus.textContent = 'saved!';
      setTimeout(() => { keyStatus.textContent = ''; keyStatus.style.color = ''; }, 2000);
    } catch (e) { keyStatus.textContent = e.message || 'failed'; }
    finally { saveKeyBtn.disabled = false; saveKeyBtn.textContent = 'SAVE KEY'; }
  }

  function openSettings() { modalBg.classList.add('open'); keyInput.focus(); }
  function closeSettings() { modalBg.classList.remove('open'); if (_settingsTrigger) { _settingsTrigger.focus(); _settingsTrigger = null; } }

  /* ── Focus trap ── */
  function trapFocus(el, e) {
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const foc = [...el.querySelectorAll(sel)].filter(n => n.offsetParent !== null);
    if (!foc.length) return;
    const first = foc[0], last = foc[foc.length - 1];
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
  }

  onMount(() => {
    /* Set DOM refs */
    hero = gid('hero'); heroInput = gid('heroInput'); heroGo = gid('heroGo');
    chatInput = gid('chatInput'); sendBtn = gid('sendBtn'); charCount = gid('charCount');
    statusDot = gid('statusDot'); statusText = gid('statusText'); statusSkill = gid('statusSkill');
    outputContext = gid('outputContext');
    chatLog = gid('chatLog'); buildOutput = gid('buildOutput');
    emptyState = gid('emptyState'); outputScroll = gid('outputScroll');
    modalBg = gid('modalBg'); keyInput = gid('keyInput'); saveKeyBtn = gid('saveKeyBtn');
    keyStatus = gid('keyStatus'); modalCloseBtn = gid('modalCloseBtn');
    themeGrid = gid('themeGrid'); skillGrid = gid('skillGrid');
    ageSlider = gid('ageSlider'); ageValEl = gid('ageVal');
    fontSlider = gid('fontSlider'); fontValEl = gid('fontVal');
    histPanel = gid('histPanel'); histList = gid('histList'); histClose = gid('histClose');
    chatPane = document.querySelector('.chat');
    chatToggle = gid('chatToggle');
    workspace = document.querySelector('main.workspace');

    /* Initialise 2 clouds with random starting ideas */
    const pick = (exclude) => {
      const pool = exclude ? PROJECT_IDEAS.filter(p => p !== exclude) : PROJECT_IDEAS;
      return pool[Math.floor(Math.random() * pool.length)];
    };
    const first = pick();
    cloudProps = [
      { idea: first,       cls: 'cloud-1' },
      { idea: pick(first), cls: 'cloud-2' },
    ];

    /* Expose globals for inline onclick handlers in renderMd() output */
    window.toggleCode = toggleCode;
    window.copyCode = copyCode;
    window.downloadCode = downloadCode;
    window.persistTitle = persistTitle;
    window.shopAllOnAmazon = shopAllOnAmazon;
    window.triggerProjectEdit = focusProjectEdit;
    window.jumpToBuildSection = jumpToBuildSection;

    /* Input handlers */
    chatInput.addEventListener('input', () => { charCount.textContent = `${chatInput.value.length}/300`; });
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') send(chatInput.value.trim()); });
    sendBtn.addEventListener('click', () => { if (generating) { if (controller) controller.abort(); return; } send(chatInput.value.trim()); });

    /* Responsive placeholder — swaps text so it never clips */
    const CHAT_PLACEHOLDERS = [
      [250, 'describe a project or ask to edit...'],
      [150, 'describe or ask to edit...'],
      [90,  'type a message...'],
      [0,   '...']
    ];
    const updateChatPlaceholder = () => {
      const w = chatInput.offsetWidth;
      for (const [min, text] of CHAT_PLACEHOLDERS) {
        if (w >= min) { chatInput.placeholder = text; return; }
      }
    };
    new ResizeObserver(updateChatPlaceholder).observe(chatInput);
    updateChatPlaceholder();
    heroInput.addEventListener('input', updateHeroBuildState);
    heroInput.addEventListener('keydown', e => { if (e.key === 'Enter' && heroInput.value.trim().length >= 10) send(heroInput.value.trim()); });
    heroGo.addEventListener('click', () => send(heroInput.value.trim()));
    gid('heroExamples').querySelectorAll('.hero-example-chip').forEach(btn => btn.addEventListener('click', () => applyExamplePrompt(btn.dataset.prompt)));

    /* Topbar */
    gid('btnNew').addEventListener('click', newSession);
    gid('btnHistory').addEventListener('click', () => { renderHist(); histPanel.classList.toggle('open'); });
    histClose.addEventListener('click', () => { histPanel.classList.remove('open'); clearSelection(); });
    gid('btnExport').addEventListener('click', () => {
      if (!lastGuide) { addMsg('No build to export yet — generate a project first.', 'bot'); return; }
      const ne = buildOutput.querySelector('.project-name');
      let g = lastGuide; if (ne) g = g.replace(/^# .+$/m, '# ' + ne.textContent.trim());
      downloadProjectFolder(g, lastPrompt);
      const b = gid('btnExport'); b.classList.add('active'); setTimeout(() => b.classList.remove('active'), 1200);
    });
    gid('btnExportPdf').addEventListener('click', exportPdf);
    gid('btnDownloadMd').addEventListener('click', downloadMarkdownGuide);
    gid('btnCopyCode').addEventListener('click', async () => {
      const btn = gid('btnCopyCode');
      try {
        await copyAllCodeBlocks();
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = '📋 Copy All Code'; }, 1200);
      } catch {
        btn.textContent = 'Copy failed';
        setTimeout(() => { btn.textContent = '📋 Copy All Code'; }, 1200);
      }
    });
    gid('btnSettings').addEventListener('click', () => { _settingsTrigger = document.activeElement; openSettings(); });
    gid('btnDelete').addEventListener('click', () => { if (!lastGuide) return; showDeleteConfirm(getProjectName({ guide: lastGuide, prompt: lastPrompt }), lastGuide, () => deleteFromHist(lastTs, null)); });

    /* Delete modal */
    gid('delModalDownload').addEventListener('click', () => { if (_del.guide && _del.prompt) downloadProjectFolder(_del.guide, _del.prompt); });
    gid('delModalConfirm').addEventListener('click', () => { if (_del.cb) _del.cb(); closeDelModal(); });
    gid('delModalCancel').addEventListener('click', closeDelModal);
    gid('delModalBg').addEventListener('click', e => { if (e.target === gid('delModalBg')) closeDelModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && gid('delModalBg').classList.contains('open')) { e.stopPropagation(); closeDelModal(); } }, { capture: true });

    /* Selection bars */
    gid('heroSelDel').addEventListener('click', bulkDelete);
    gid('heroSelClear').addEventListener('click', clearSelection);
    gid('histSelDel').addEventListener('click', bulkDelete);
    gid('histSelClear').addEventListener('click', clearSelection);

    /* Ctrl+A to select all */
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const histOpen = histPanel.classList.contains('open');
        const heroVis = heroActive;
        if (histOpen || heroVis) {
          e.preventDefault();
          const h = getHist();
          const slice = histOpen ? h : h.slice(0, 5);
          slice.forEach(item => selectedTs.add(item.ts));
          updateSelState();
        }
      }
    });

    /* Chat collapse */
    chatToggle.addEventListener('click', () => { chatPane.classList.toggle('collapsed'); if (!chatPane.classList.contains('collapsed')) chatInput.focus(); });

    /* Focus traps */
    modalBg.addEventListener('keydown', e => { if (e.key === 'Tab') trapFocus(modalBg.querySelector('.modal'), e); });
    gid('delModalBg').addEventListener('keydown', e => { if (e.key === 'Tab') trapFocus(gid('delModalBg').querySelector('.del-modal'), e); });

    /* Settings modal */
    modalCloseBtn.addEventListener('click', closeSettings);
    modalBg.addEventListener('click', e => { if (e.target === modalBg) closeSettings(); });

    /* Clarify overlay */
    gid('clarifySkip').addEventListener('click', skipClarify);
    gid('clarifyBg').addEventListener('click', e => { if (e.target === gid('clarifyBg')) skipClarify(); });
    gid('clarifyBg').addEventListener('keydown', e => { if (e.key === 'Tab') trapFocus(gid('clarifyBg').querySelector('.clarify-card'), e); });

    /* Keyboard shortcuts */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (modalBg.classList.contains('open')) { closeSettings(); return; }
        if (gid('clarifyBg').classList.contains('open')) { skipClarify(); return; }
        if (histPanel.classList.contains('open')) { histPanel.classList.remove('open'); return; }
        if (generating && controller) { controller.abort(); return; }
      }
    });
    document.addEventListener('click', e => {
      if (histPanel.classList.contains('open') && !histPanel.contains(e.target) && !e.target.closest('#btnHistory')) {
        histPanel.classList.remove('open');
      }
    });

    /* Theme, skill, age, font */
    themeGrid.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => applyTheme(c.dataset.theme)));
    document.querySelectorAll('.hero-skill').forEach(b => b.addEventListener('click', () => applySkill(Number(b.dataset.skill))));
    skillGrid.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => applySkill(Number(b.dataset.skill))));
    ageSlider.addEventListener('input', () => applyAge(Number(ageSlider.value)));
    fontSlider.addEventListener('input', () => applyFontScale(Number(fontSlider.value)));
    saveKeyBtn.addEventListener('click', saveKey);
    keyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveKey(); });

    /* Init sequence */
    applyTheme(localStorage.getItem('mrt-theme') || 'solder');
    applySkill(Number(localStorage.getItem('mrt-skill')) || 1);
    applyAge(Number(localStorage.getItem('mrt-age')) || 25);
    applyFontScale(Number(localStorage.getItem('mrt-font-scale')) || 100);
    renderHist();
    renderHeroRecent();
    checkKey();
    updateHeroBuildState();
    heroInput.focus();
  });
</script>

<!-- ═══ HERO ═══ -->
<div class="hero" id="hero">
  <!-- Floating clouds -->
  <div class="hero-clouds">
    {#each cloudProps as c, i}
      <div class="cloud {c.cls}"
           role="button"
           tabindex="0"
           on:animationiteration={() => rotateCloudIdea(i)}
           on:click={() => { heroInput.value = c.idea; send(c.idea); }}
           on:keydown={e => { if (e.key === 'Enter' || e.key === ' ') { heroInput.value = c.idea; send(c.idea); } }}
      >
        <div class="cloud-rect cloud-rect-a"></div>
        <div class="cloud-rect cloud-rect-b"></div>
        <div class="cloud-label">
          {c.idea}
          <span class="cloud-label-hint">CLICK TO BUILD</span>
        </div>
      </div>
    {/each}
  </div>
  <div class="hero-card">
    <div class="hero-title">mertle.bot</div>
    <div class="hero-tag">describe it. build it.</div>
    <div class="hero-desc">Describe any electronics project and get a complete wiring diagram, parts list, and ready-to-flash code — instantly.</div>
    <div class="hero-input-row">
      <input class="hero-input" id="heroInput" type="text" placeholder="e.g. motion-sensing alarm..." autocomplete="new-password" spellcheck="false" maxlength="300" aria-label="Describe your electronics project"/>
      <button type="button" class="hero-go" id="heroGo" disabled>BUILD</button>
    </div>
    <div class="hero-prompt-hint" id="heroPromptHint">Describe your project in at least 10 characters.</div>
    <div class="hero-examples" id="heroExamples">
      {#each HERO_EXAMPLES as example}
        <button type="button" class="hero-example-chip" data-prompt={example}>{example}</button>
      {/each}
    </div>
    <div class="hero-hint">SELECT SKILL LEVEL</div>
    <div class="hero-skills" id="heroSkills">
      <button type="button" class="hero-skill active" data-skill="1">MONKEY</button>
      <button type="button" class="hero-skill" data-skill="2">NOVICE</button>
      <button type="button" class="hero-skill" data-skill="3">BUILDER</button>
      <button type="button" class="hero-skill" data-skill="4">HACKER</button>
      <button type="button" class="hero-skill" data-skill="5">EXPERT</button>
    </div>
    <div class="hero-skill-help" id="heroSkillHelp">Maximum hand-holding, no experience needed.</div>
    <div class="hero-recent" id="heroRecent"></div>
    <div class="sel-bar" id="heroSelBar">
      <span class="sel-count" id="heroSelCount"></span>
      <button type="button" class="sel-clear-btn" id="heroSelClear">CLEAR</button>
      <button type="button" class="sel-del-btn" id="heroSelDel">DELETE</button>
    </div>
  </div>
</div>

<!-- ═══ APP SHELL ═══ -->
<div class="app">
  <div class="stage">
    <!-- top bar -->
    <div class="topbar" role="banner">
      <span class="topbar-logo">mertle.bot</span>
      <div class="topbar-sep"></div>
      <button type="button" class="topbar-btn" id="btnNew" title="New">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button type="button" class="topbar-btn" id="btnHistory" title="History">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 16,14"/></svg>
      </button>
      <button type="button" class="topbar-btn" id="btnExport" title="Download guide">
        <svg viewBox="0 0 24 24"><path d="M21,15v4a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button type="button" class="topbar-btn" id="btnDelete" title="Delete project" style="display:none">
        <svg viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2 0 0,1-2,2H8a2,2 0 0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4a1,1 0 0,1,1-1h4a1,1 0 0,1,1,1v2"/></svg>
      </button>
      <span class="status-spacer"></span>
      <span class="status-dot" id="statusDot"></span>
      <span class="status-label" id="statusText" aria-live="polite">READY</span>
      <span class="status-skill" id="statusSkill"></span>
      <div class="topbar-sep"></div>
      <button type="button" class="topbar-btn" id="btnSettings" title="Settings">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4,15a1.65,1.65 0 0,0,.33,1.82l.06,.06a2,2 0 1,1-2.83,2.83l-.06-.06a1.65,1.65 0 0,0-1.82-.33 1.65,1.65 0 0,0-1,1.51V21a2,2 0 0,1-4,0v-.09A1.65,1.65 0 0,0 9,19.4a1.65,1.65 0 0,0-1.82,.33l-.06,.06a2,2 0 1,1-2.83-2.83l.06-.06A1.65,1.65 0 0,0 4.68,15a1.65,1.65 0 0,0-1.51-1H3a2,2 0 0,1 0-4h.09A1.65,1.65 0 0,0 4.6,9a1.65,1.65 0 0,0-.33-1.82l-.06-.06a2,2 0 1,1 2.83-2.83l.06,.06A1.65,1.65 0 0,0 9,4.68a1.65,1.65 0 0,0 1-1.51V3a2,2 0 0,1 4,0v.09a1.65,1.65 0 0,0 1,1.51 1.65,1.65 0 0,0 1.82-.33l.06-.06a2,2 0 1,1 2.83,2.83l-.06,.06A1.65,1.65 0 0,0 19.4,9a1.65,1.65 0 0,0 1.51,1H21a2,2 0 0,1 0,4h-.09A1.65,1.65 0 0,0 19.4,15z"/></svg>
      </button>
    </div>

    <!-- workspace -->
    <main class="workspace no-build">
      <!-- chat -->
      <section class="chat">
        <div class="chat-head"><span class="pane-label">conversation</span><button type="button" class="chat-toggle" id="chatToggle" aria-label="Toggle chat">&#9664;</button></div>
        <div class="chat-log" id="chatLog">
          <div class="msg bot"><div class="msg-who">MERTLE.BOT</div><div class="msg-body">Ready. Describe any hardware project to get started.</div></div>
        </div>
        <footer class="composer">
          <div class="composer-inner">
            <input class="composer-field" id="chatInput" type="text" placeholder="describe a project or ask to edit..." autocomplete="new-password" spellcheck="false" maxlength="300" aria-label="Chat message"/>
            <button type="button" class="composer-send" id="sendBtn">SEND</button>
          </div>
          <div class="composer-meta">
            <span class="composer-count" id="charCount">0/300</span>
          </div>
        </footer>
      </section>

      <!-- output -->
      <section class="output">
        <div class="output-head">
          <span class="pane-label">build output</span>
          <div class="output-head-actions">
            <button type="button" class="output-head-btn" id="btnExportPdf">📄 Export PDF</button>
            <button type="button" class="output-head-btn" id="btnDownloadMd">⬇️ Download Markdown</button>
            <button type="button" class="output-head-btn" id="btnCopyCode">📋 Copy All Code</button>
          </div>
          <span class="output-context" id="outputContext"></span>
        </div>
        <div class="output-scroll" id="outputScroll">
          <div class="loading-feed" id="loadingFeed" hidden></div>
          <div class="empty" id="emptyState">
            <div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg></div>
            <div class="empty-title">NO BUILD YET</div>
            <div class="empty-hint">Type a project description in the chat to generate your first build guide.</div>
          </div>
          <div class="build" id="buildOutput"></div>
        </div>
      </section>
    </main>
  </div>
</div>

<!-- ═══ HISTORY ═══ -->
<div class="hist" id="histPanel">
  <div class="hist-head">
    <span class="hist-title">Build History</span>
    <button type="button" class="hist-close" id="histClose" aria-label="Close">&times;</button>
  </div>
  <div class="hist-list" id="histList">
    <div class="hist-empty">No builds yet</div>
  </div>
  <div class="sel-bar" id="histSelBar">
    <span class="sel-count" id="histSelCount"></span>
    <button type="button" class="sel-clear-btn" id="histSelClear">CLEAR</button>
    <button type="button" class="sel-del-btn" id="histSelDel">DELETE</button>
  </div>
</div>

<!-- ═══ DELETE CONFIRM ═══ -->
<div class="del-modal-bg" id="delModalBg">
  <div class="del-modal" role="dialog" aria-modal="true" aria-labelledby="delModalTitle">
    <div class="del-modal-title" id="delModalTitle">Delete Project?</div>
    <div class="del-modal-prompt" id="delModalPrompt"></div>
    <div class="del-modal-btns">
      <button type="button" class="del-modal-btn cancel" id="delModalCancel">CANCEL</button>
      <button type="button" class="del-modal-btn dl" id="delModalDownload">DOWNLOAD</button>
      <button type="button" class="del-modal-btn danger" id="delModalConfirm">DELETE</button>
    </div>
  </div>
</div>

<!-- ═══ SETTINGS MODAL ═══ -->
<div class="modal-bg" id="modalBg">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="settingsModalTitle">
    <div class="modal-title" id="settingsModalTitle">SETTINGS</div>
    <div class="modal-section">
      <div class="modal-label">API Key</div>
      <div class="modal-input-row"><input class="modal-input" id="keyInput" type="password" placeholder="sk-ant-..." autocomplete="off"/></div>
      <button type="button" class="modal-btn" id="saveKeyBtn">SAVE KEY</button>
      <div class="modal-error" id="keyStatus"></div>
      <div class="modal-hint">get your key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com</a></div>
    </div>
    <div class="modal-divider"></div>
    <div class="modal-section">
      <div class="modal-label">Skill Level</div>
      <div class="chip-grid" id="skillGrid">
        <button type="button" class="chip" data-skill="1">Monkey</button>
        <button type="button" class="chip" data-skill="2">Novice</button>
        <button type="button" class="chip" data-skill="3">Builder</button>
        <button type="button" class="chip" data-skill="4">Hacker</button>
        <button type="button" class="chip" data-skill="5">Expert</button>
      </div>
      <div class="modal-hint" id="skillHelpModal">Maximum hand-holding, no experience needed.</div>
    </div>
    <div class="modal-divider"></div>
    <div class="modal-section">
      <div class="modal-label">Theme</div>
      <div class="chip-grid" id="themeGrid">
        <button type="button" class="chip" data-theme="deep-sea">Deep Sea</button>
        <button type="button" class="chip" data-theme="phosphor">Phosphor</button>
        <button type="button" class="chip" data-theme="amber">Amber</button>
        <button type="button" class="chip" data-theme="arctic">Arctic</button>
        <button type="button" class="chip" data-theme="sakura">Sakura</button>
        <button type="button" class="chip active" data-theme="solder">Solder</button>
      </div>
    </div>
    <div class="modal-divider"></div>
    <div class="modal-section">
      <div class="modal-label">Age</div>
      <div class="modal-slider-row"><input class="modal-slider" id="ageSlider" type="range" min="6" max="60" step="1" value="25"/><span class="modal-val" id="ageVal">25</span></div>
    </div>
    <div class="modal-divider"></div>
    <div class="modal-section">
      <div class="modal-label">Font Size</div>
      <div class="modal-slider-row"><input class="modal-slider" id="fontSlider" type="range" min="80" max="200" step="10" value="100"/><span class="modal-val" id="fontVal">100%</span></div>
    </div>
    <button type="button" class="modal-close-btn" id="modalCloseBtn">CLOSE</button>
  </div>
</div>

<!-- ═══ CLARIFY OVERLAY ═══ -->
<div class="clarify-bg" id="clarifyBg">
  <div class="clarify-card" role="dialog" aria-modal="true" aria-label="A few quick questions">
    <div class="clarify-header">
      <div class="clarify-title">ONE SEC</div>
      <button type="button" class="clarify-skip" id="clarifySkip">SKIP &gt;&gt; BUILD NOW</button>
    </div>
    <div class="clarify-inner" id="clarifyInner"></div>
  </div>
</div>
