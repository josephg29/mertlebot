<script>
  import { onMount } from 'svelte';
  import { deOverlapWires } from './wireDeOverlap.js';
  import Wire from './Wire.svelte';
  import ArduinoUno from './boards/ArduinoUno.svelte';
  import ArduinoMega from './boards/ArduinoMega.svelte';
  import ArduinoNano from './boards/ArduinoNano.svelte';
  import Esp32DevkitV1 from './boards/Esp32DevkitV1.svelte';
  import Led from './parts/Led.svelte';
  import Resistor from './parts/Resistor.svelte';
  import Button from './parts/Button.svelte';
  import Dht22 from './parts/Dht22.svelte';
  import HcSr04 from './parts/HcSr04.svelte';
  import ServoMotor from './parts/ServoMotor.svelte';
  import Buzzer from './parts/Buzzer.svelte';
  import Potentiometer from './parts/Potentiometer.svelte';
  import OledDisplay from './parts/OledDisplay.svelte';
  import LcdI2c from './parts/LcdI2c.svelte';

  export let diagram;

  const VIEW_W = 960;
  const VIEW_H = 640;

  let scale = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let dragMoved = false;

  let selectedComp = null;
  let prevScale = 1;
  let prevPanX = 0;
  let prevPanY = 0;

  let canvasEl;

  /** Approximate bounding sizes per component type (w, h) */
  const COMP_BOUNDS = {
    led:            { w: 24, h: 62 },
    resistor:       { w: 60, h: 20 },
    button:         { w: 40, h: 40 },
    dht22:          { w: 34, h: 48 },
    'hc-sr04':      { w: 80, h: 42 },
    servo:          { w: 80, h: 56 },
    buzzer:         { w: 32, h: 44 },
    potentiometer:  { w: 40, h: 50 },
    oled:           { w: 60, h: 44 },
    'lcd-i2c':      { w: 130, h: 54 },
  };

  const BOARD_BOUNDS = {
    'arduino-uno':    { w: 240, h: 185 },
    'arduino-mega':   { w: 360, h: 190 },
    'arduino-nano':   { w: 80,  h: 260 },
    'esp32-devkit-v1':{ w: 100, h: 300 },
  };

  const COMP_LABELS = {
    led: 'LED',
    resistor: 'Resistor',
    button: 'Push Button',
    dht22: 'DHT22 Sensor',
    'hc-sr04': 'HC-SR04 Ultrasonic',
    servo: 'Servo Motor',
    buzzer: 'Buzzer',
    potentiometer: 'Potentiometer',
    oled: 'OLED Display',
    'lcd-i2c': 'LCD I2C Display',
  };

  const BOARD_LABELS = {
    'arduino-uno':     'Arduino Uno R3',
    'arduino-mega':    'Arduino Mega 2560',
    'arduino-nano':    'Arduino Nano',
    'esp32-devkit-v1': 'ESP32 DevKit V1',
  };

  let selectedBoard = false;

  $: adjustedWires = deOverlapWires(diagram.wires);

  /** Find wires connected to a component or board by proximity */
  function getConnectedWireIndices(comp, isBoard) {
    if (!comp) return new Set();
    let bounds, x, y;
    if (isBoard) {
      bounds = BOARD_BOUNDS[comp.type] || { w: 240, h: 185 };
      x = comp.x;
      y = comp.y;
    } else {
      bounds = COMP_BOUNDS[comp.type] || { w: 50, h: 50 };
      x = comp.x;
      y = comp.y;
    }
    const margin = isBoard ? 20 : 12;
    const left = x - margin;
    const right = x + bounds.w + margin;
    const top = y - margin;
    const bottom = y + bounds.h + margin;

    const indices = new Set();
    adjustedWires.forEach((wire, i) => {
      for (const [px, py] of wire.path) {
        if (px >= left && px <= right && py >= top && py <= bottom) {
          indices.add(i);
          break;
        }
      }
    });
    return indices;
  }

  $: connectedWireIndices = selectedBoard
    ? getConnectedWireIndices(diagram.board, true)
    : getConnectedWireIndices(selectedComp, false);

  /** Get wire details for the selected component or board */
  $: connectedWireDetails = (selectedComp || selectedBoard)
    ? adjustedWires
        .filter((_, i) => connectedWireIndices.has(i))
        .map(w => ({ color: w.color, label: w.label || '' }))
    : [];

  /** Find matching part from componentList for Amazon link */
  function getPartLink(comp) {
    if (!comp || !diagram.componentList) return null;
    const typeLower = comp.type.toLowerCase();
    const label = (comp.props?.label || '').toLowerCase();
    const match = diagram.componentList.find(p => {
      const pl = p.label.toLowerCase();
      return pl.includes(typeLower)
        || (typeLower === 'led' && pl.includes('led'))
        || (typeLower === 'hc-sr04' && (pl.includes('hc-sr04') || pl.includes('ultrasonic')))
        || (typeLower === 'dht22' && (pl.includes('dht') || pl.includes('temperature')))
        || (typeLower === 'servo' && pl.includes('servo'))
        || (typeLower === 'oled' && pl.includes('oled'))
        || (typeLower === 'lcd-i2c' && pl.includes('lcd'))
        || (typeLower === 'buzzer' && pl.includes('buzzer'))
        || (typeLower === 'potentiometer' && (pl.includes('pot') || pl.includes('potentiometer')))
        || (typeLower === 'button' && (pl.includes('button') || pl.includes('switch')))
        || (typeLower === 'resistor' && pl.includes('resistor'));
    });
    if (!match) return null;
    return {
      text: match.label,
      url: 'https://www.amazon.com/s?k=' + encodeURIComponent(match.label),
    };
  }

  function getBoardLink() {
    if (!selectedBoard || !diagram.componentList) return null;
    const boardType = diagram.board.type;
    const boardName = BOARD_LABELS[boardType] || boardType;
    const match = diagram.componentList.find(p => {
      const pl = p.label.toLowerCase();
      return pl.includes('arduino') || pl.includes('esp32') || pl.includes('mega') || pl.includes('nano') || pl.includes('uno');
    });
    const searchText = match ? match.label : boardName;
    return {
      text: searchText,
      url: 'https://www.amazon.com/s?k=' + encodeURIComponent(searchText),
    };
  }

  $: partLink = selectedBoard ? getBoardLink() : getPartLink(selectedComp);

  function onWheel(e) {
    e.preventDefault();
    scale = Math.min(3, Math.max(0.3, scale - e.deltaY * 0.004));
  }
  function onMouseDown(e) {
    dragging = true;
    dragMoved = false;
    lastX = e.clientX;
    lastY = e.clientY;
  }
  function onMouseMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
    panX += dx;
    panY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
  }
  function onMouseUp() { dragging = false; }

  function resetView() {
    selectedComp = null;
    selectedBoard = false;
    scale = 1; panX = 0; panY = 0;
  }
  function zoomIn() { scale = Math.min(3, scale + 0.2); }
  function zoomOut() { scale = Math.max(0.3, scale - 0.2); }

  function selectComponent(comp, e) {
    e.stopPropagation();
    if (dragMoved) return;
    if (selectedComp?.id === comp.id) {
      deselectComponent();
      return;
    }

    prevScale = scale;
    prevPanX = panX;
    prevPanY = panY;

    selectedBoard = false;
    selectedComp = comp;

    const bounds = COMP_BOUNDS[comp.type] || { w: 50, h: 50 };
    const cx = comp.x + bounds.w / 2;
    const cy = comp.y + bounds.h / 2;

    const targetScale = 2.2;
    scale = targetScale;
    panX = (VIEW_W / 2) - cx * targetScale;
    panY = (VIEW_H / 2) - cy * targetScale;
  }

  function selectBoardClick(e) {
    e.stopPropagation();
    if (dragMoved) return;
    if (selectedBoard) {
      deselectComponent();
      return;
    }

    prevScale = scale;
    prevPanX = panX;
    prevPanY = panY;

    selectedComp = null;
    selectedBoard = true;

    const bounds = BOARD_BOUNDS[diagram.board.type] || { w: 240, h: 185 };
    const cx = diagram.board.x + bounds.w / 2;
    const cy = diagram.board.y + bounds.h / 2;

    const targetScale = 1.6;
    scale = targetScale;
    panX = (VIEW_W / 2) - cx * targetScale;
    panY = (VIEW_H / 2) - cy * targetScale;
  }

  function deselectComponent() {
    selectedComp = null;
    selectedBoard = false;
    scale = prevScale;
    panX = prevPanX;
    panY = prevPanY;
  }

  function onCanvasClick(e) {
    if (dragMoved) return;
    if ((selectedComp || selectedBoard) && e.target.closest('.wiregen-diagram')) {
      deselectComponent();
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="wiregen-canvas" bind:this={canvasEl} on:click={onCanvasClick}>
  <svg class="wiregen-grid" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wg-grid" width="24" height="24" patternUnits="userSpaceOnUse"
        patternTransform="translate({panX % 24},{panY % 24}) scale({scale})">
        <circle cx="12" cy="12" r="0.8" fill="var(--surface2, #2E3C44)"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wg-grid)"/>
  </svg>

  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <svg
    class="wiregen-diagram"
    viewBox="0 0 {VIEW_W} {VIEW_H}"
    preserveAspectRatio="xMidYMid meet"
    on:wheel|preventDefault={onWheel}
    on:mousedown={onMouseDown}
    on:mousemove={onMouseMove}
    on:mouseup={onMouseUp}
    on:mouseleave={onMouseUp}
  >
    <g class="wiregen-transform-group" transform="translate({panX},{panY}) scale({scale})">
      {#each adjustedWires as wire, i (i)}
        <Wire
          {wire}
          dimmed={(selectedComp !== null || selectedBoard) && !connectedWireIndices.has(i)}
          highlighted={(selectedComp !== null || selectedBoard) && connectedWireIndices.has(i)}
        />
      {/each}

      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <g class="wiregen-part" class:wiregen-part-selected={selectedBoard} on:click={selectBoardClick}>
        {#if diagram.board.type === 'arduino-uno'}
          <ArduinoUno x={diagram.board.x} y={diagram.board.y}/>
        {:else if diagram.board.type === 'arduino-mega'}
          <ArduinoMega x={diagram.board.x} y={diagram.board.y}/>
        {:else if diagram.board.type === 'arduino-nano'}
          <ArduinoNano x={diagram.board.x} y={diagram.board.y}/>
        {:else if diagram.board.type === 'esp32-devkit-v1'}
          <Esp32DevkitV1 x={diagram.board.x} y={diagram.board.y}/>
        {/if}

        {#if selectedBoard}
          {@const bounds = BOARD_BOUNDS[diagram.board.type] || { w: 240, h: 185 }}
          <rect
            x={diagram.board.x - 6}
            y={diagram.board.y - 6}
            width={bounds.w + 12}
            height={bounds.h + 12}
            rx="4"
            fill="none"
            stroke="var(--cta, #4CAF50)"
            stroke-width="2"
            stroke-dasharray="4 3"
            opacity="0.8"
          >
            <animate attributeName="stroke-dashoffset" values="0;14" dur="1s" repeatCount="indefinite"/>
          </rect>
        {/if}
      </g>

      {#each diagram.components as comp (comp.id)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <g
          class="wiregen-part"
          class:wiregen-part-selected={selectedComp?.id === comp.id}
          on:click={(e) => selectComponent(comp, e)}
        >
          {#if comp.type === 'led'}
            <Led x={comp.x} y={comp.y} color={comp.props?.color} label={comp.props?.label}/>
          {:else if comp.type === 'resistor'}
            <Resistor x={comp.x} y={comp.y} value={comp.props?.value} label={comp.props?.label}/>
          {:else if comp.type === 'button'}
            <Button x={comp.x} y={comp.y} label={comp.props?.label}/>
          {:else if comp.type === 'dht22'}
            <Dht22 x={comp.x} y={comp.y} label={comp.props?.label}/>
          {:else if comp.type === 'hc-sr04'}
            <HcSr04 x={comp.x} y={comp.y} label={comp.props?.label}/>
          {:else if comp.type === 'servo'}
            <ServoMotor x={comp.x} y={comp.y} label={comp.props?.label}/>
          {:else if comp.type === 'buzzer'}
            <Buzzer x={comp.x} y={comp.y} label={comp.props?.label}/>
          {:else if comp.type === 'potentiometer'}
            <Potentiometer x={comp.x} y={comp.y} label={comp.props?.label} value={comp.props?.value}/>
          {:else if comp.type === 'oled'}
            <OledDisplay x={comp.x} y={comp.y} label={comp.props?.label}/>
          {:else if comp.type === 'lcd-i2c'}
            <LcdI2c x={comp.x} y={comp.y} label={comp.props?.label}/>
          {/if}

          {#if selectedComp?.id === comp.id}
            {@const bounds = COMP_BOUNDS[comp.type] || { w: 50, h: 50 }}
            <rect
              x={comp.x - 6}
              y={comp.y - 6}
              width={bounds.w + 12}
              height={bounds.h + 12}
              rx="4"
              fill="none"
              stroke="var(--cta, #4CAF50)"
              stroke-width="2"
              stroke-dasharray="4 3"
              opacity="0.8"
            >
              <animate attributeName="stroke-dashoffset" values="0;14" dur="1s" repeatCount="indefinite"/>
            </rect>
          {/if}
        </g>
      {/each}
    </g>
  </svg>

  <div class="wiregen-controls">
    <button on:click={zoomIn}>+</button>
    <button on:click={zoomOut}>−</button>
    <button on:click={resetView}>Reset</button>
  </div>
  <div class="wiregen-scale">{Math.round(scale * 100)}%</div>

  {#if !selectedComp && !selectedBoard && diagram.componentList?.length}
    <div class="wiregen-legend">
      {#each diagram.componentList as part}
        <span class="wiregen-legend-item">{part.qty}× {part.label}</span>
      {/each}
    </div>
  {/if}

  {#if selectedComp || selectedBoard}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="part-detail" on:click|stopPropagation>
      <div class="part-detail-header">
        <div class="part-detail-title">
          {#if selectedBoard}
            <span class="part-detail-badge">BOARD</span>
            <span class="part-detail-name">{BOARD_LABELS[diagram.board.type] || diagram.board.type}</span>
          {:else}
            <span class="part-detail-badge">{selectedComp.type.toUpperCase()}</span>
            <span class="part-detail-name">{COMP_LABELS[selectedComp.type] || selectedComp.type}</span>
          {/if}
        </div>
        <button class="part-detail-close" on:click={deselectComponent}>✕</button>
      </div>

      {#if selectedComp?.props?.label}
        <div class="part-detail-label">Label: {selectedComp.props.label}</div>
      {/if}
      {#if selectedComp?.props?.value}
        <div class="part-detail-label">Value: {selectedComp.props.value}</div>
      {/if}
      {#if selectedComp?.props?.color}
        <div class="part-detail-label">Color: {selectedComp.props.color}</div>
      {/if}
      {#if selectedBoard}
        <div class="part-detail-label">Position: ({diagram.board.x}, {diagram.board.y})</div>
        <div class="part-detail-label">Pins: {connectedWireDetails.length} connected</div>
      {/if}

      {#if connectedWireDetails.length}
        <div class="part-detail-section">WIRING</div>
        <div class="part-detail-wires">
          {#each connectedWireDetails as wd}
            <div class="part-detail-wire">
              <span class="wire-color-dot" style="background: {({'red':'#ef4444','black':'#374151','yellow':'#eab308','orange':'#f97316','blue':'#3b82f6','green':'#22c55e','purple':'#a855f7','white':'#f8fafc','gray':'#9ca3af'})[wd.color] || '#888'}"></span>
              <span class="wire-color-name">{wd.color}</span>
              {#if wd.label}<span class="wire-pin-label">→ {wd.label}</span>{/if}
            </div>
          {/each}
        </div>
      {/if}

      {#if partLink}
        <div class="part-detail-section">SHOP</div>
        <a class="part-detail-link" href={partLink.url} target="_blank" rel="noopener noreferrer">
          {partLink.text} →
        </a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .wiregen-canvas {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 2;
    min-height: 300px;
    max-height: 500px;
    overflow: hidden;
    background: var(--code-bg, #1A2529);
    border-radius: 6px;
    user-select: none;
    margin: 12px 0;
    border: 2px solid var(--border-col, #78909C);
    box-shadow: 0 3px 0 var(--surface2, #2E3C44);
  }
  .wiregen-grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .wiregen-diagram {
    width: 100%;
    height: 100%;
    cursor: grab;
  }
  .wiregen-diagram:active { cursor: grabbing; }

  .wiregen-transform-group {
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .wiregen-controls {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
  }
  .wiregen-controls button {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background: var(--surface, #37474F);
    color: var(--text, #F5F5F5);
    font-size: 13px;
    border: 1px solid var(--border-col, #78909C);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-family: 'IBM Plex Mono', monospace;
    box-shadow: 0 2px 0 var(--surface2, #2E3C44);
    transition: background 0.1s;
  }
  .wiregen-controls button:last-child {
    width: auto;
    padding: 0 8px;
    font-size: 11px;
  }
  .wiregen-controls button:hover { background: var(--code-bar, #2E3C44); }
  .wiregen-controls button:active { box-shadow: none; transform: translateY(1px); }
  .wiregen-scale {
    position: absolute;
    bottom: 10px;
    left: 10px;
    font-size: 11px;
    color: var(--text-muted, #90A4AE);
    font-family: 'IBM Plex Mono', monospace;
  }
  .wiregen-legend {
    position: absolute;
    top: 8px;
    left: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 60%;
  }
  .wiregen-legend-item {
    background: var(--surface, #37474F);
    color: var(--text, #F5F5F5);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'IBM Plex Mono', monospace;
    border: 1px solid var(--border-col, #78909C);
    box-shadow: 0 1px 0 var(--surface2, #2E3C44);
  }

  /* ── Clickable parts ── */
  .wiregen-part { cursor: pointer; }
  .wiregen-part:hover { filter: brightness(1.15); }

  /* ── Part detail panel ── */
  .part-detail {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 220px;
    background: var(--surface, #37474F);
    border: 1px solid var(--border-col, #78909C);
    border-radius: 6px;
    padding: 10px 12px;
    font-family: 'IBM Plex Mono', monospace;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    animation: part-detail-in 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    z-index: 10;
  }
  @keyframes part-detail-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .part-detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .part-detail-title {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .part-detail-badge {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--code-bg, #1A2529);
    background: var(--cta, #4CAF50);
    padding: 1px 6px;
    border-radius: 3px;
    width: fit-content;
  }
  .part-detail-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text, #F5F5F5);
  }
  .part-detail-close {
    background: none;
    border: none;
    color: var(--text-muted, #90A4AE);
    font-size: 14px;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;
  }
  .part-detail-close:hover { color: var(--text, #F5F5F5); }

  .part-detail-label {
    font-size: 10px;
    color: var(--text-muted, #90A4AE);
    margin-bottom: 2px;
  }

  .part-detail-section {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: var(--text-muted, #90A4AE);
    margin-top: 8px;
    margin-bottom: 4px;
    border-top: 1px solid var(--border-col, #78909C);
    padding-top: 6px;
  }

  .part-detail-wires {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .part-detail-wire {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: var(--text, #F5F5F5);
  }
  .wire-color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.2);
    flex-shrink: 0;
  }
  .wire-color-name {
    text-transform: capitalize;
    min-width: 44px;
  }
  .wire-pin-label {
    color: var(--text-muted, #90A4AE);
    font-size: 9px;
  }

  .part-detail-link {
    display: block;
    font-size: 10px;
    color: var(--link, #29B6F6);
    text-decoration: none;
    padding: 4px 8px;
    background: var(--code-bg, #1A2529);
    border-radius: 4px;
    border: 1px solid var(--border-col, #78909C);
    transition: background 0.15s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .part-detail-link:hover {
    background: var(--surface2, #2E3C44);
    text-decoration: underline;
  }
</style>
