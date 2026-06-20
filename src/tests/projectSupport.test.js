import { describe, it, expect } from 'vitest';
import {
  stripMarkdown,
  normalizeBoardChoice,
  classifyPartLabel,
  analyzePartList,
  parseGuideSections,
  extractWiregenBlocks,
  extractPartsLines,
  extractStepGroups,
  validateDiagram,
  summarizeSupport,
  repairGuide,
} from '../lib/projectSupport.js';

// ─── Fixture helpers ─────────────────────────────────────────────────────────
// Board pin geometry comes from src/lib/wiregen/boardPins.js. With the UNO
// placed at (100,100): D13=(142,90), D12=(152,90), V5=(152,295), GND=(162,295).
// Component pin offsets come from COMPONENT_PIN_OFFSETS in projectSupport.js.
// LED at (300,100): A=(308,154), C=(316,154).
// Resistor at (300,200): pin1=(300,210), pin2=(380,210).
// Each wire joins one board pin to one component pin so the validator's
// "terminates on a board pin AND a component pin" rule is satisfied.

function unoLedResistorDiagram() {
  return {
    board: { type: 'arduino-uno', x: 100, y: 100 },
    components: [
      { type: 'led', id: 'led1', x: 300, y: 100, props: { label: 'Status LED' } },
      { type: 'resistor', id: 'r1', x: 300, y: 200 },
    ],
    wires: [
      { label: 'D13', color: 'red', path: [[142, 90], [300, 210]] },
      { label: 'V5', color: 'black', path: [[152, 295], [380, 210]] },
      { label: 'D12', color: 'green', path: [[152, 90], [308, 154]] },
      { label: 'GND', color: 'blue', path: [[162, 295], [316, 154]] },
    ],
  };
}

// ─── stripMarkdown ───────────────────────────────────────────────────────────
describe('stripMarkdown', () => {
  it('removes inline code, bold, italic, and link markup', () => {
    expect(stripMarkdown('`code`')).toBe('code');
    expect(stripMarkdown('**bold**')).toBe('bold');
    expect(stripMarkdown('*em*')).toBe('em');
    expect(stripMarkdown('_under_')).toBe('under');
    expect(stripMarkdown('[text](https://x.com)')).toBe('text');
    expect(stripMarkdown('> quote')).toBe('quote');
  });
});

// ─── normalizeBoardChoice ────────────────────────────────────────────────────
describe('normalizeBoardChoice', () => {
  it('maps human board names to canonical types', () => {
    expect(normalizeBoardChoice('Arduino Uno')).toBe('arduino-uno');
    expect(normalizeBoardChoice('mega 2560')).toBe('arduino-mega');
    expect(normalizeBoardChoice('Nano')).toBe('arduino-nano');
    expect(normalizeBoardChoice('ESP32')).toBe('esp32-devkit-v1');
  });
  it('returns null for unrecognised input', () => {
    expect(normalizeBoardChoice('Raspberry Pi')).toBeNull();
    expect(normalizeBoardChoice('')).toBeNull();
  });
});

// ─── classifyPartLabel / analyzePartList ─────────────────────────────────────
describe('classifyPartLabel', () => {
  it('classifies a supported board', () => {
    expect(classifyPartLabel('1x Arduino Uno')).toMatchObject({ status: 'supported', kind: 'arduino-uno' });
  });
  it('classifies a supported functional part', () => {
    expect(classifyPartLabel('- 220Ω resistor')).toMatchObject({ status: 'supported', kind: 'resistor' });
  });
  it('flags an unsupported part', () => {
    expect(classifyPartLabel('NeoPixel strip')).toMatchObject({ status: 'unsupported' });
    expect(classifyPartLabel('5V relay module')).toMatchObject({ status: 'unsupported' });
  });
  it('classifies an accessory', () => {
    expect(classifyPartLabel('half-size breadboard')).toMatchObject({ status: 'accessory' });
  });
  it('falls back to unknown for unrecognised parts', () => {
    expect(classifyPartLabel('mystery widget')).toMatchObject({ status: 'unknown' });
  });
});

describe('analyzePartList', () => {
  it('buckets a mixed parts list', () => {
    const result = analyzePartList([
      '- 1x Arduino Uno',
      '- 1x LED',
      '- 1x breadboard',
      '- 1x relay',
      '- 1x mystery widget',
    ]);
    expect(result.supported.map((s) => s.kind)).toEqual(expect.arrayContaining(['arduino-uno', 'led']));
    expect(result.accessories).toHaveLength(1);
    expect(result.unsupported).toContain('relay');
    expect(result.unknown).toContain('mystery widget');
  });
});

// ─── parseGuideSections / extractors ─────────────────────────────────────────
describe('guide section parsing', () => {
  const guide = [
    '# My Project',
    '',
    '## PARTS',
    '- 1x Arduino Uno',
    '- 1x LED',
    '',
    '## STEPS',
    '1. Plug in the LED.',
    '2. Upload the sketch.',
    '',
    '## WIRING',
    'Connect D13 to the LED.',
  ].join('\n');

  it('parseGuideSections keys sections by uppercase heading', () => {
    const sections = parseGuideSections(guide);
    expect([...sections.keys()]).toEqual(expect.arrayContaining(['PARTS', 'STEPS', 'WIRING']));
  });

  it('extractPartsLines returns only bullet lines from PARTS', () => {
    expect(extractPartsLines(guide)).toEqual(['- 1x Arduino Uno', '- 1x LED']);
  });

  it('extractStepGroups parses numbered steps with text', () => {
    const steps = extractStepGroups(guide);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ num: '1', text: 'Plug in the LED.' });
  });

  it('extractWiregenBlocks pulls fenced wiregen JSON', () => {
    const withBlock = '## WIRING\n\n```wiregen\n{"board":{}}\n```\n';
    expect(extractWiregenBlocks(withBlock)).toEqual(['{"board":{}}']);
    expect(extractWiregenBlocks('no block here')).toEqual([]);
  });
});

// ─── validateDiagram ─────────────────────────────────────────────────────────
describe('validateDiagram', () => {
  it('accepts a well-formed UNO + LED + resistor diagram', () => {
    const result = validateDiagram(unoLedResistorDiagram());
    expect(result).toEqual({ ok: true, issues: [] });
  });

  it('rejects a non-object diagram', () => {
    expect(validateDiagram(null).ok).toBe(false);
    expect(validateDiagram(undefined).issues[0]).toMatch(/missing or not a JSON object/);
  });

  it('flags an unsupported board type', () => {
    const result = validateDiagram({ board: { type: 'arduino-due', x: 0, y: 0 }, components: [], wires: [] });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => /Unsupported board type/.test(i))).toBe(true);
  });

  it('flags an unsupported component type', () => {
    const result = validateDiagram({
      board: { type: 'arduino-uno', x: 0, y: 0 },
      components: [{ type: 'relay', id: 'x1', x: 0, y: 0 }],
      wires: [],
    });
    expect(result.issues.some((i) => /Unsupported component type/.test(i))).toBe(true);
  });

  it('flags a missing or duplicated component id', () => {
    const result = validateDiagram({
      board: { type: 'arduino-uno', x: 0, y: 0 },
      components: [{ type: 'led', id: 'dup', x: 0, y: 0 }, { type: 'led', id: 'dup', x: 0, y: 0 }],
      wires: [],
    });
    expect(result.issues.some((i) => /missing or duplicated/.test(i))).toBe(true);
  });

  it('reports a required component pin with no wire (DHT22 DATA unwired)', () => {
    const diagram = unoLedResistorDiagram();
    // Drop the wire to the LED cathode so a required pin goes unconnected.
    diagram.wires = diagram.wires.filter((w) => w.label !== 'GND');
    const result = validateDiagram(diagram);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => /missing wire\(s\) on: C/.test(i))).toBe(true);
  });

  it('flags an unsupported wire color', () => {
    const result = validateDiagram({
      board: { type: 'arduino-uno', x: 100, y: 100 },
      components: [],
      wires: [{ label: 'D13', color: 'pink', path: [[142, 90], [142, 90]] }],
    });
    expect(result.issues.some((i) => /Unsupported wire color/.test(i))).toBe(true);
  });

  it('flags a wire with fewer than two path points', () => {
    const result = validateDiagram({
      board: { type: 'arduino-uno', x: 100, y: 100 },
      components: [],
      wires: [{ label: 'D13', color: 'red', path: [[142, 90]] }],
    });
    expect(result.issues.some((i) => /at least two path points/.test(i))).toBe(true);
  });

  it('flags a wire that terminates on neither a board nor component pin', () => {
    const result = validateDiagram({
      board: { type: 'arduino-uno', x: 100, y: 100 },
      components: [],
      wires: [{ label: '', color: 'red', path: [[5000, 5000], [6000, 6000]] }],
    });
    expect(result.issues.some((i) => /does not terminate on a known board pin/.test(i))).toBe(true);
    expect(result.issues.some((i) => /does not terminate on a known component pin/.test(i))).toBe(true);
  });

  it('flags a wire whose label disagrees with its board endpoint', () => {
    const diagram = unoLedResistorDiagram();
    // Wire physically lands on D13 but is mislabeled D9.
    diagram.wires[0].label = 'D9';
    const result = validateDiagram(diagram);
    expect(result.issues.some((i) => /does not match its board endpoint/.test(i))).toBe(true);
  });

  it('enforces dedicated I2C pins on Arduino Mega', () => {
    const result = validateDiagram({
      board: { type: 'arduino-mega', x: 0, y: 0 },
      components: [{ type: 'oled', id: 'o1', x: 400, y: 400 }],
      wires: [{ label: 'SDA', color: 'green', path: [[78, -10], [414, 450]] }],
    });
    expect(result.issues.some((i) => /must use the dedicated SDA pin on Arduino Mega/.test(i))).toBe(true);
  });

  it('enforces IO21/IO22 for I2C on ESP32', () => {
    const result = validateDiagram({
      board: { type: 'esp32-devkit-v1', x: 0, y: 0 },
      components: [{ type: 'oled', id: 'o1', x: 400, y: 400 }],
      wires: [{ label: 'SDA', color: 'green', path: [[110, 114], [450, 450]] }],
    });
    expect(result.issues.some((i) => /must use IO21\/IO22 on ESP32/.test(i))).toBe(true);
  });

  it('allows a button to leave corner pins unwired', () => {
    const result = validateDiagram({
      board: { type: 'arduino-uno', x: 100, y: 100 },
      components: [{ type: 'button', id: 'b1', x: 300, y: 300 }],
      wires: [],
    });
    expect(result).toEqual({ ok: true, issues: [] });
  });
});

// ─── summarizeSupport ────────────────────────────────────────────────────────
function guideWith({ parts, wiringBody, code }) {
  return [
    '# Demo Project',
    '',
    '## PARTS',
    parts,
    '',
    '## WIRING',
    '',
    wiringBody,
    '',
    '## STEPS',
    '1. Build it.',
    '',
    '## CODE',
    '```cpp',
    code || 'void setup(){}',
    '```',
    '',
  ].join('\n');
}

function wiregenBlock(diagram) {
  return '```wiregen\n' + JSON.stringify(diagram, null, 2) + '\n```';
}

describe('summarizeSupport', () => {
  it('accepts a complete, valid guide', () => {
    const guide = guideWith({
      parts: ['- 1x Arduino Uno', '- 1x LED', '- 1x 220Ω resistor'].join('\n'),
      wiringBody: wiregenBlock(unoLedResistorDiagram()),
    });
    const result = summarizeSupport(guide);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.supportedDiagram).toBe(true);
    expect(result.canSimulate).toBe(true);
  });

  it('reports missing top-level sections', () => {
    const result = summarizeSupport('Just some text with no headings.');
    expect(result.issues.some((i) => /missing a PARTS section/.test(i))).toBe(true);
    expect(result.issues.some((i) => /missing a STEPS section/.test(i))).toBe(true);
    expect(result.issues.some((i) => /missing a WIRING section/.test(i))).toBe(true);
  });

  it('requires a text-only wiring section when an unsupported part is present', () => {
    const guide = guideWith({
      parts: ['- 1x Arduino Uno', '- 1x relay'].join('\n'),
      wiringBody: wiregenBlock(unoLedResistorDiagram()),
    });
    const result = summarizeSupport(guide);
    expect(result.issues.some((i) => /text-only wiring section/.test(i))).toBe(true);
  });

  it('rejects a guide that has both a diagram and a "Diagram unavailable" notice', () => {
    const guide = guideWith({
      parts: ['- 1x Arduino Uno', '- 1x LED', '- 1x 220Ω resistor'].join('\n'),
      wiringBody: 'Diagram unavailable: too complex.\n\n' + wiregenBlock(unoLedResistorDiagram()),
    });
    const result = summarizeSupport(guide);
    expect(result.issues.some((i) => /cannot include both/.test(i))).toBe(true);
  });

  it('flags a wiregen block that fails to parse', () => {
    const guide = guideWith({
      parts: ['- 1x Arduino Uno', '- 1x LED'].join('\n'),
      wiringBody: '```wiregen\n{ not valid json ]\n```',
    });
    const result = summarizeSupport(guide);
    expect(result.issues.some((i) => /failed to parse/.test(i))).toBe(true);
  });

  it('treats a Diagram-unavailable-only guide as safe text-only', () => {
    const guide = guideWith({
      parts: ['- 1x Arduino Uno', '- 1x relay'].join('\n'),
      wiringBody: 'Diagram unavailable: relay not supported by the canvas.',
    });
    const result = summarizeSupport(guide);
    expect(result.safeTextOnly).toBe(true);
    expect(result.supportedDiagram).toBe(false);
  });
});

// ─── repairGuide ─────────────────────────────────────────────────────────────
describe('repairGuide', () => {
  it('leaves a guide without a wiregen block unchanged', () => {
    const guide = '# T\n\n## WIRING\nConnect D13.\n\n## PARTS\n- 1x LED\n';
    expect(repairGuide(guide)).toBe(guide);
  });

  it('leaves an already-correct diagram unchanged (idempotent)', () => {
    const guide = guideWith({
      parts: ['- 1x Arduino Uno', '- 1x LED', '- 1x 220Ω resistor'].join('\n'),
      wiringBody: wiregenBlock(unoLedResistorDiagram()),
    });
    expect(repairGuide(guide)).toBe(guide);
  });

  it('snaps a slightly-off wire endpoint back onto its board pin', () => {
    const diagram = unoLedResistorDiagram();
    // Nudge the D13 endpoint a few px off the pin (within snap tolerance).
    diagram.wires[0].path[0] = [150, 96];
    const guide = guideWith({
      parts: ['- 1x Arduino Uno', '- 1x LED', '- 1x 220Ω resistor'].join('\n'),
      wiringBody: wiregenBlock(diagram),
    });
    const repaired = repairGuide(guide);
    expect(repaired).not.toBe(guide);
    // The repaired diagram should validate cleanly.
    const block = extractWiregenBlocks(repaired)[0];
    expect(validateDiagram(JSON.parse(block))).toEqual({ ok: true, issues: [] });
  });
});
