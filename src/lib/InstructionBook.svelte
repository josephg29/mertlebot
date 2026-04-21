<script>
  import { onMount } from 'svelte';
  import WiringCanvas from '$lib/wiregen/WiringCanvas.svelte';

  export let steps;   // Array<{ num: string, text: string, action: string }>
  export let diagram; // WiringDiagram JSON | null
  export let projectId = 'mertle-project';

  const ACTION_COLORS = {
    wire:     { accent: '#29B6F6', dark: '#0277BD', bg: 'rgba(41,182,246,0.10)' },
    code:     { accent: '#4CAF50', dark: '#388E3C', bg: 'rgba(76,175,80,0.10)' },
    power:    { accent: '#FFD54F', dark: '#F9A825', bg: 'rgba(255,213,79,0.10)' },
    test:     { accent: '#00BCD4', dark: '#007C91', bg: 'rgba(0,188,212,0.10)' },
    assemble: { accent: '#FF7043', dark: '#BF360C', bg: 'rgba(255,112,67,0.10)' },
    default:  { accent: '#90A4AE', dark: '#546E7A', bg: 'rgba(144,164,174,0.10)' },
  };

  const STEP_LABELS = { wire: 'WIRE', code: 'CODE', power: 'POWER', test: 'TEST', assemble: 'BUILD', default: 'STEP' };

  const BIG_ICONS = {
    wire:     '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M4 12h6"/><path d="M14 12h6"/><circle cx="12" cy="12" r="2"/><path d="M12 4v6"/><path d="M12 14v6"/></svg>',
    code:     '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polyline points="8,6 2,12 8,18"/><polyline points="16,6 22,12 16,18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>',
    power:    '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polygon points="13,2 4,14 12,14 11,22 20,10 12,10"/></svg>',
    test:     '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="10"/><polyline points="8,12 11,15 16,9"/></svg>',
    assemble: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    default:  '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m-9-11h2m18 0h2"/><path d="M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42"/><path d="M19.78 4.22l-1.42 1.42M5.64 18.36l-1.42 1.42"/></svg>'
  };

  const WHY_TEXT = {
    wire:     'Correct wiring prevents short circuits and ensures components get the right voltage.',
    code:     'The sketch tells the Arduino what to do. Uploading replaces any previous program.',
    power:    'Always connect power last to avoid accidental shorts during assembly.',
    test:     'Testing at each stage catches problems early and confirms the circuit works.',
    assemble: 'Secure mounting prevents accidental disconnections and protects components.',
    default:  'Follow each step carefully and in order for best results.'
  };

  const WIRE_HEX = {
    red: '#ef4444', black: '#374151', yellow: '#eab308', orange: '#f97316',
    blue: '#3b82f6', green: '#22c55e', purple: '#a855f7', white: '#d1d5db', gray: '#9ca3af'
  };

  // Spatial steps where the wiring diagram adds context
  const DIAGRAM_ACTIONS = new Set(['wire', 'power', 'assemble']);

  let currentPage = 0;
  let showWhy = false;
  let celebrating = false;
  let completed = [];
  let loadedProjectId = '';

  $: step = steps[currentPage];
  $: isFirst = currentPage === 0;
  $: isLast = currentPage === steps.length - 1;
  $: action = step.action || 'default';
  $: colors = ACTION_COLORS[action] || ACTION_COLORS.default;
  $: showDiagram = !!diagram && DIAGRAM_ACTIONS.has(action);
  $: highlightedWires = (diagram && action === 'wire')
    ? extractWiresForStep(step.text, diagram) : [];
  $: focusWireColors = highlightedWires.map(w => w.color);
  $: completeCount = completed.filter(Boolean).length;
  $: if (steps?.length && projectId && projectId !== loadedProjectId) loadCompletionState();
  $: if (loadedProjectId === projectId && completed.length === steps.length) persistCompletionState();

  function storageKey(id) {
    return `mertle-step-progress:${id}`;
  }

  function loadCompletionState() {
    loadedProjectId = projectId;
    try {
      const raw = localStorage.getItem(storageKey(projectId));
      const saved = raw ? JSON.parse(raw) : [];
      completed = steps.map((_, idx) => Boolean(saved[idx]));
    } catch {
      completed = steps.map(() => false);
    }
  }

  function persistCompletionState() {
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(completed));
    } catch {
      // Ignore storage failures for non-critical progress tracking.
    }
  }

  function toggleComplete(index = currentPage) {
    completed = completed.map((done, idx) => idx === index ? !done : done);
  }

  function extractWiresForStep(text, diag) {
    if (!diag?.wires) return [];
    const t = text.toLowerCase();
    return diag.wires.filter(w => {
      const color = (w.color || '').toLowerCase();
      const label = (w.label || '').toLowerCase();
      return t.includes(color) || (label && t.includes(label));
    });
  }

  function goNext() {
    showWhy = false;
    if (currentPage < steps.length - 1) {
      currentPage++;
    } else {
      celebrating = true;
      setTimeout(() => { celebrating = false; }, 2200);
    }
  }

  function goPrev() {
    showWhy = false;
    if (currentPage > 0) currentPage--;
  }

  onMount(() => {
    function handleKey(e) {
      if (document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });
</script>

<div class="ib-root" class:ib-celebrating={celebrating} style="--step-accent:{colors.accent};--step-dark:{colors.dark};--step-bg:{colors.bg};">
  <div class="ib-summary">
    <div class="ib-summary-label">STEP PROGRESS</div>
    <div class="ib-summary-value">{completeCount} / {steps.length} steps complete</div>
  </div>
  <div
    class="ib-page"
    data-action={action}
  >
    <!-- Thick colored top strip -->
    <div class="ib-color-strip"></div>

    <!-- Step badge (top-left corner) -->
    <div class="ib-step-num">{step.num}</div>
    <!-- Progress counter (top-right) -->
    <div class="ib-counter">{currentPage + 1} / {steps.length}</div>

    <!-- Icon with colored background box -->
    <div class="ib-icon-area">
      {@html BIG_ICONS[action] || BIG_ICONS.default}
    </div>

    <!-- Action type badge -->
    <div class="ib-action-badge">{STEP_LABELS[action] || 'STEP'}</div>

    <!-- Step instruction text -->
    <div class="ib-step-text">{step.text}</div>

    <!-- Embedded wiring diagram (for wire/power/assemble steps) -->
    {#if showDiagram}
      <div class="ib-diagram-wrap">
        <div class="ib-diagram-label">▸ WIRING DIAGRAM</div>
        <WiringCanvas {diagram} compact={true} focusWires={focusWireColors} />
      </div>
    {/if}

    <!-- Wire connection callout (LEGO arrow style) -->
    {#if highlightedWires.length}
      <div class="ib-callout">
        <div class="ib-callout-header">CONNECT:</div>
        {#each highlightedWires as w}
          <div class="ib-callout-row">
            <span class="ib-wire-swatch" style="background:{WIRE_HEX[w.color] ?? w.color};"></span>
            <span class="ib-callout-wire">{w.color.toUpperCase()} WIRE</span>
            {#if w.label}
              <span class="ib-callout-arrow">→</span>
              <span class="ib-callout-dest">{w.label}</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- WHY? expandable explanation -->
    <div class="ib-why-row">
      <button class="ib-why-btn" on:click={() => showWhy = !showWhy}>
        {showWhy ? '▼ WHY?' : '▶ WHY?'}
      </button>
      {#if showWhy}
        <div class="ib-why-body">{WHY_TEXT[action] || WHY_TEXT.default}</div>
      {/if}
    </div>

    <button class="ib-complete-btn" class:ib-complete-btn-done={completed[currentPage]} on:click={() => toggleComplete(currentPage)}>
      {completed[currentPage] ? '✓ COMPLETE' : 'MARK COMPLETE'}
    </button>
  </div>

  <!-- Navigation bar -->
  <div class="ib-nav" style="--step-accent:{colors.accent};--step-dark:{colors.dark};">
    <button class="ib-nav-btn" on:click={goPrev} disabled={isFirst}>&lt; PREV</button>
    <div class="ib-dots">
      {#each steps as _, i}
        <button
          class="ib-dot"
          class:ib-dot-active={i === currentPage}
          class:ib-dot-complete={completed[i]}
          on:click={() => { showWhy = false; currentPage = i; }}
          aria-label="Go to step {i + 1}"
        ></button>
      {/each}
    </div>
    <button class="ib-nav-btn ib-nav-next" on:click={goNext}>
      {isLast ? 'DONE ✓' : 'NEXT >'}
    </button>
  </div>

  {#if celebrating}
    <div class="ib-celebrate" aria-live="polite">
      <div class="ib-celebrate-text">ALL DONE!</div>
    </div>
  {/if}
</div>

<style>
  .ib-root {
    position: relative;
    width: 100%;
  }

  .ib-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    padding: 10px 12px;
    background: var(--surface2);
    border: 3px solid var(--step-accent);
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.35);
  }

  .ib-summary-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    letter-spacing: 1px;
    color: var(--step-accent);
  }

  .ib-summary-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--text);
  }

  /* Stacked page layers — give the booklet a physical depth feel */
  .ib-root::before,
  .ib-root::after {
    content: '';
    position: absolute;
    top: 8px;
    left: 5px;
    right: -5px;
    bottom: -36px; /* extend past the nav bar */
    border: 3px solid var(--step-accent);
    border-top: none;
    pointer-events: none;
    z-index: -1;
  }
  .ib-root::before {
    background: #F0E8D8;
  }
  .ib-root::after {
    top: 16px;
    left: 10px;
    right: -10px;
    bottom: -44px;
    background: #E8DFC8;
    z-index: -2;
  }

  /* ── Card ── */
  .ib-page {
    background: #FFF8F0;
    border: 3px solid var(--step-accent);
    border-top: none;
    box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5);
    padding: 40px 24px 28px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    min-height: 320px;
  }

  /* Thick colored stripe at top (replaces border-top) */
  .ib-color-strip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 10px;
    background: var(--step-accent);
  }

  /* ── Step number badge ── */
  .ib-step-num {
    position: absolute;
    top: -4px;
    left: -4px;
    width: 58px;
    height: 58px;
    background: var(--step-accent);
    color: #1a1a1a;
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 4px 4px 0 var(--step-dark);
    z-index: 1;
  }

  .ib-counter {
    position: absolute;
    top: 16px;
    right: 14px;
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: #888;
    letter-spacing: 1px;
  }

  /* ── Icon area with colored box ── */
  .ib-icon-area {
    width: 96px;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--step-accent);
    background: var(--step-bg);
    border: 2px solid var(--step-accent);
    margin-top: 8px;
    flex-shrink: 0;
  }

  /* ── Action type badge ── */
  .ib-action-badge {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    letter-spacing: 3px;
    color: #1a1a1a;
    background: var(--step-accent);
    padding: 4px 14px;
    box-shadow: 2px 2px 0 var(--step-dark);
  }

  /* ── Step instruction text ── */
  .ib-step-text {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 14px;
    color: #1a1a1a;
    text-align: center;
    max-width: 460px;
    line-height: 1.75;
  }

  /* ── Embedded wiring diagram ── */
  .ib-diagram-wrap {
    width: 100%;
    max-width: 520px;
    margin-top: 4px;
  }

  .ib-diagram-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    color: var(--step-accent);
    letter-spacing: 2px;
    margin-bottom: 4px;
    text-align: left;
  }

  /* Override WiringCanvas borders/shadow to match step color */
  .ib-diagram-wrap :global(.wiregen-canvas) {
    border-color: var(--step-accent) !important;
    box-shadow: 3px 3px 0 var(--step-dark) !important;
  }

  /* ── Wire connection callout ── */
  .ib-callout {
    width: 100%;
    max-width: 460px;
    background: var(--step-bg);
    border: 2px solid var(--step-accent);
    border-left: 5px solid var(--step-accent);
    padding: 10px 14px;
    margin-top: 2px;
  }

  .ib-callout-header {
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    color: var(--step-accent);
    letter-spacing: 2px;
    margin-bottom: 8px;
  }

  .ib-callout-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .ib-callout-row:last-child { margin-bottom: 0; }

  .ib-wire-swatch {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
  }

  .ib-callout-wire {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: #1a1a1a;
    letter-spacing: 0.5px;
    min-width: 80px;
  }

  .ib-callout-arrow {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    color: var(--step-accent);
    font-weight: bold;
  }

  .ib-callout-dest {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #333;
  }

  /* ── WHY? section ── */
  .ib-why-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    width: 100%;
    max-width: 460px;
  }

  .ib-why-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: var(--step-accent);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    letter-spacing: 1px;
  }

  .ib-why-btn:hover { opacity: 0.8; }

  .ib-why-body {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #444;
    max-width: 420px;
    text-align: center;
    padding: 10px 14px;
    background: var(--step-bg);
    border: 1px solid var(--step-accent);
    line-height: 1.6;
  }

  .ib-complete-btn {
    margin-top: auto;
    padding: 10px 14px;
    background: #fff8f0;
    border: 2px solid var(--step-accent);
    color: #1a1a1a;
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--step-dark);
  }

  .ib-complete-btn-done {
    background: var(--step-accent);
  }

  /* ── Navigation bar ── */
  .ib-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: var(--surface2);
    border: 3px solid var(--step-accent);
    border-top: none;
  }

  .ib-nav-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    padding: 8px 14px;
    background: var(--surface);
    color: var(--text);
    border: 3px solid var(--border-col);
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.4);
    cursor: pointer;
    letter-spacing: 1px;
    transition: transform 0.08s, box-shadow 0.08s;
  }

  .ib-nav-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 3px 4px 0 rgba(0, 0, 0, 0.4);
  }

  .ib-nav-btn:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
  }

  .ib-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .ib-nav-next {
    background: var(--step-accent);
    color: #1a1a1a;
    border-color: var(--step-dark);
    box-shadow: 3px 3px 0 var(--step-dark);
  }

  .ib-dots {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: 200px;
  }

  .ib-dot {
    width: 10px;
    height: 10px;
    background: var(--border-col);
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.12s;
  }

  .ib-dot-active {
    background: var(--step-accent);
    box-shadow: 0 0 0 2px var(--step-dark);
  }

  .ib-dot-complete {
    background: var(--step-dark);
  }

  /* ── Celebration overlay ── */
  .ib-celebrate {
    position: absolute;
    inset: 0;
    background: rgba(76, 175, 80, 0.93);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: voxel-hop-in 0.3s var(--spring, cubic-bezier(0.34, 1.56, 0.64, 1));
    z-index: 10;
  }

  .ib-celebrate-text {
    font-family: 'Press Start 2P', monospace;
    font-size: 20px;
    color: var(--primary, #FFD54F);
    text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;
  }
</style>
