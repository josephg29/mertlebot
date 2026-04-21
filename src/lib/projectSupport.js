import { resolvePin } from './wiregen/boardPins.js';

export const SUPPORTED_BOARD_TYPES = ['arduino-uno', 'arduino-mega', 'arduino-nano', 'esp32-devkit-v1'];
export const SUPPORTED_BOARD_CHOICES = ['Arduino Uno', 'Arduino Nano', 'Arduino Mega', 'ESP32', 'Not sure yet'];
export const SUPPORTED_COMPONENT_TYPES = ['led', 'resistor', 'button', 'dht22', 'hc-sr04', 'servo', 'buzzer', 'potentiometer', 'oled', 'lcd-i2c'];
export const SUPPORTED_WIRE_COLORS = ['red', 'black', 'yellow', 'orange', 'blue', 'green', 'purple', 'white', 'gray'];
export const SIM_SUPPORTED_COMPONENT_TYPES = ['led', 'resistor', 'button', 'dht22', 'hc-sr04', 'servo', 'buzzer', 'potentiometer', 'oled'];
export const DIAGRAM_UNAVAILABLE_PREFIX = 'Diagram unavailable:';

const BOARD_ALIASES = [
  { pattern: /\b(arduino\s+uno|uno)\b/i, type: 'arduino-uno' },
  { pattern: /\b(arduino\s+mega|mega\s+2560|mega)\b/i, type: 'arduino-mega' },
  { pattern: /\b(arduino\s+nano|nano)\b/i, type: 'arduino-nano' },
  { pattern: /\b(esp32|esp32 devkit|esp32 dev module)\b/i, type: 'esp32-devkit-v1' },
];

const ACCESSORY_PATTERNS = [
  /\bbreadboard\b/i,
  /\bjumper\b/i,
  /\bwire kit\b/i,
  /\busb\b/i,
  /\bcable\b/i,
  /\bpower (adapter|supply|bank|pack|rail)\b/i,
  /\bbattery\b/i,
  /\bwall adapter\b/i,
  /\bbarrel jack\b/i,
  /\bbreakout\b/i,
  /\bmount(ing)?\b/i,
  /\bcardboard\b/i,
  /\btape\b/i,
  /\bglue\b/i,
  /\bhot-glue\b/i,
  /\bscrew\b/i,
  /\bstandoff\b/i,
  /\bkit\b/i,
];

const FUNCTIONAL_PART_PATTERNS = [
  { pattern: /\bled\b/i, kind: 'led' },
  { pattern: /\bresistor\b/i, kind: 'resistor' },
  { pattern: /\bbutton\b|\bswitch\b/i, kind: 'button' },
  { pattern: /\bdht ?22\b/i, kind: 'dht22' },
  { pattern: /\bhc-?sr04\b|\bultrasonic\b/i, kind: 'hc-sr04' },
  { pattern: /\bservo\b/i, kind: 'servo' },
  { pattern: /\bbuzzer\b/i, kind: 'buzzer' },
  { pattern: /\bpot(entiometer)?\b|\bknob\b/i, kind: 'potentiometer' },
  { pattern: /\boled\b|\bssd1306\b/i, kind: 'oled' },
  { pattern: /\blcd\b.*\bi2c\b|\bi2c\b.*\blcd\b/i, kind: 'lcd-i2c' },
];

const UNSUPPORTED_PATTERNS = [
  /\bneopixel\b/i,
  /\bws2812\b/i,
  /\bmicrophone\b/i,
  /\bmic\b/i,
  /\bsound sensor\b/i,
  /\bmax9814\b/i,
  /\bcapacitor\b/i,
  /\belectrolytic\b/i,
  /\bmotor driver\b/i,
  /\brelay\b/i,
  /\bstepper\b/i,
  /\brfid\b/i,
  /\bgps\b/i,
  /\baccelerometer\b/i,
  /\bgyro\b/i,
  /\bmpu\b/i,
  /\bbme280\b/i,
  /\bbmp280\b/i,
  /\bpir\b/i,
  /\bjoystick\b/i,
  /\bload cell\b/i,
  /\bhx711\b/i,
];

const COMPONENT_PIN_OFFSETS = {
  led: [{ name: 'A', x: 8, y: 54 }, { name: 'C', x: 16, y: 54 }],
  resistor: [{ name: '1', x: 0, y: 10 }, { name: '2', x: 80, y: 10 }],
  button: [{ name: 'TL', x: 0, y: 0 }, { name: 'TR', x: 40, y: 0 }, { name: 'BL', x: 0, y: 40 }, { name: 'BR', x: 40, y: 40 }],
  dht22: [{ name: 'VCC', x: 7, y: 60 }, { name: 'DATA', x: 16, y: 60 }, { name: 'GND', x: 33, y: 60 }],
  'hc-sr04': [{ name: 'VCC', x: 12, y: 0 }, { name: 'TRIG', x: 28, y: 0 }, { name: 'ECHO', x: 52, y: 0 }, { name: 'GND', x: 68, y: 0 }],
  servo: [{ name: 'GND', x: 0, y: 30 }, { name: '5V', x: 0, y: 37 }, { name: 'SIG', x: 0, y: 44 }],
  buzzer: [{ name: '+', x: 10, y: 40 }, { name: '-', x: 26, y: 40 }],
  potentiometer: [{ name: 'L', x: 8, y: 46 }, { name: 'W', x: 20, y: 46 }, { name: 'R', x: 32, y: 46 }],
  oled: [{ name: 'GND', x: 10, y: 50 }, { name: 'VCC', x: 22, y: 50 }, { name: 'SCL', x: 38, y: 50 }, { name: 'SDA', x: 50, y: 50 }],
  'lcd-i2c': [{ name: 'GND', x: 14, y: 60 }, { name: 'VCC', x: 28, y: 60 }, { name: 'SDA', x: 42, y: 60 }, { name: 'SCL', x: 56, y: 60 }],
};

// All logical pins that must have at least one wire for each component type.
// Missing any of these is a wiring error (e.g. DHT22 with DATA unwired).
const COMPONENT_REQUIRED_PINS = {
  led:           ['A', 'C'],
  buzzer:        ['+', '-'],
  dht22:         ['VCC', 'DATA', 'GND'],
  'hc-sr04':     ['VCC', 'TRIG', 'ECHO', 'GND'],
  servo:         ['GND', '5V', 'SIG'],
  oled:          ['GND', 'VCC', 'SCL', 'SDA'],
  'lcd-i2c':     ['GND', 'VCC', 'SDA', 'SCL'],
  potentiometer: ['L', 'W', 'R'],
  resistor:      ['1', '2'],
  button:        [], // buttons commonly leave some corner pins unwired
};

const BOARD_PIN_NAMES = {
  'arduino-uno': ['AREF', 'GND_DIG', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'TX', 'RX', 'IOREF', 'RESET', 'V3_3', 'V5', 'GND', 'GND2', 'VIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
  'arduino-mega': ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'GND_DIG', 'AREF', 'SDA', 'SCL', 'D22', 'D23', 'D24', 'D25', 'D26', 'D27', 'IOREF', 'RESET', 'V3_3', 'V5', 'GND', 'GND2', 'VIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15'],
  'arduino-nano': ['D13', 'D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'GND_L', 'RESET_L', 'TX', 'RX', 'RESET_R', 'GND_R', 'V5', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'AREF', 'V3_3', 'VIN'],
  'esp32-devkit-v1': ['EN', 'VP', 'VN', 'IO34', 'IO35', 'IO32', 'IO33', 'IO25', 'IO26', 'IO27', 'IO14', 'IO12', 'GND_L', 'IO13', 'IO9', 'IO10', 'IO11', 'VIN', 'V3_3', 'GND_R', 'IO15', 'IO2', 'IO4', 'IO16', 'IO17', 'IO5', 'IO18', 'IO19', 'IO21', 'RX0', 'TX0', 'IO22', 'IO23', 'GND_R2'],
};

const BOARD_PIN_SET = Object.fromEntries(
  Object.entries(BOARD_PIN_NAMES).map(([board, pins]) => [board, new Set(pins)])
);

function distance(a, b) {
  return Math.hypot(a[0] - b.x, a[1] - b.y);
}

function nearestBoardPin(diagram, point) {
  const names = BOARD_PIN_NAMES[diagram.board.type] || [];
  let best = null;
  for (const name of names) {
    const pos = resolvePin(diagram.board.x, diagram.board.y, diagram.board.type, name);
    const d = distance(point, pos);
    if (!best || d < best.distance) best = { name, position: pos, distance: d };
  }
  return best;
}

function nearestComponentPin(diagram, point) {
  let best = null;
  for (const comp of diagram.components || []) {
    const offsets = COMPONENT_PIN_OFFSETS[comp.type] || [];
    for (const pin of offsets) {
      const pos = { x: comp.x + pin.x, y: comp.y + pin.y };
      const d = distance(point, pos);
      if (!best || d < best.distance) best = { componentId: comp.id, pin: pin.name, position: pos, distance: d };
    }
  }
  return best;
}

function endpointTouchesAnotherWire(point, wires, currentIndex) {
  return wires.some((wire, index) => {
    if (index === currentIndex) return false;
    return wire.path.some((candidate) => candidate[0] === point[0] && candidate[1] === point[1]);
  });
}

function pointEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function normalizePinToken(boardType, token) {
  if (!token) return null;
  const clean = token.replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
  if (!clean) return null;
  if (/^A\d+$/.test(clean)) return clean;
  if (/^IO\d+$/.test(clean)) return clean;
  if (/^D\d+$/.test(clean)) return clean;
  if (clean === 'SDA' || clean === 'SCL' || clean === 'V5' || clean === 'V3_3' || clean === 'VIN' || clean === 'GND' || clean === 'GND2' || clean === 'GND_DIG' || clean === 'GND_L' || clean === 'GND_R' || clean === 'GND_R2') return clean;
  if (/^\d+$/.test(clean)) {
    return boardType === 'esp32-devkit-v1' ? `IO${clean}` : `D${clean}`;
  }
  return null;
}

function likelyPinConstantName(name) {
  const upper = (name || '').toUpperCase();
  return upper.includes('PIN')
    || ['BUZZER', 'BUTTON', 'LED', 'RELAY', 'SERVO', 'TRIG', 'ECHO', 'SDA_PIN', 'SCL_PIN'].includes(upper);
}

function extractBoardPinsFromDiagram(diagram) {
  const pins = new Set();
  const wires = diagram.wires || [];
  for (const [index, wire] of wires.entries()) {
    const points = [wire.path[0], wire.path[wire.path.length - 1]];
    for (const point of points) {
      const nearest = nearestBoardPin(diagram, point);
      if (nearest?.distance <= 10) pins.add(nearest.name);
    }
    const labelPin = normalizePinToken(diagram.board.type, wire.label || '');
    if (labelPin && BOARD_PIN_SET[diagram.board.type]?.has(labelPin)) pins.add(labelPin);
    if (endpointTouchesAnotherWire(wire.path[0], wires, index) || endpointTouchesAnotherWire(wire.path[wire.path.length - 1], wires, index)) {
      // branch wires are allowed, no-op here
    }
  }
  return pins;
}

function findEndpointRole(diagram, point, wireIndex) {
  const wires = diagram.wires || [];
  const nearestBoard = nearestBoardPin(diagram, point);
  const nearestComp = nearestComponentPin(diagram, point);
  const wireTouch = endpointTouchesAnotherWire(point, wires, wireIndex);
  return {
    nearestBoard,
    nearestComp,
    board: nearestBoard?.distance <= 10 ? nearestBoard : null,
    comp: nearestComp?.distance <= 10 ? nearestComp : null,
    wireTouch,
  };
}

function cloneDiagram(diagram) {
  return JSON.parse(JSON.stringify(diagram));
}

function nearestPointIndex(path = [], target) {
  let bestIndex = -1;
  let bestDistance = Infinity;
  for (const [index, point] of path.entries()) {
    const d = distance(point, target);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = index;
    }
  }
  return { index: bestIndex, distance: bestDistance };
}

function snapPathPoint(path, index, pos) {
  if (index < 0 || index >= path.length || !pos) return false;
  const [x, y] = path[index];
  if (x === pos.x && y === pos.y) return false;
  path[index] = [pos.x, pos.y];
  return true;
}

function chooseBoardTarget(diagram, wire, start, end) {
  const labeledBoardPin = normalizePinToken(diagram.board.type, wire.label || '');
  if (labeledBoardPin && BOARD_PIN_SET[diagram.board.type]?.has(labeledBoardPin)) {
    const position = resolvePin(diagram.board.x, diagram.board.y, diagram.board.type, labeledBoardPin);
    const startDist = distance(start, position);
    const endDist = distance(end, position);
    return {
      name: labeledBoardPin,
      position,
      startDist,
      endDist,
      source: 'label',
    };
  }

  const nearestStartPin = nearestBoardPin(diagram, start);
  const nearestEndPin = nearestBoardPin(diagram, end);
  const options = [nearestStartPin, nearestEndPin].filter(Boolean).sort((a, b) => a.distance - b.distance);
  if (!options.length) return null;
  const best = options[0];
  return {
    name: best.name,
    position: best.position,
    startDist: nearestStartPin?.distance ?? Infinity,
    endDist: nearestEndPin?.distance ?? Infinity,
    source: 'proximity',
  };
}

function chooseComponentTarget(diagram, start, end) {
  const nearestStartComp = nearestComponentPin(diagram, start);
  const nearestEndComp = nearestComponentPin(diagram, end);
  const options = [nearestStartComp, nearestEndComp].filter(Boolean).sort((a, b) => a.distance - b.distance);
  if (!options.length) return null;
  const best = options[0];
  return {
    componentId: best.componentId,
    pin: best.pin,
    position: best.position,
    startDist: nearestStartComp?.distance ?? Infinity,
    endDist: nearestEndComp?.distance ?? Infinity,
  };
}

function repairDiagram(diagram) {
  const repaired = cloneDiagram(diagram);
  let changed = false;
  const boardSnapTolerance = 140;
  const componentSnapTolerance = 140;

  for (const [index, wire] of (repaired.wires || []).entries()) {
    const start = wire.path[0];
    const end = wire.path[wire.path.length - 1];
    if (!start || !end) continue;

    const startRole = findEndpointRole(repaired, start, index);
    const endRole = findEndpointRole(repaired, end, index);
    const boardTarget = chooseBoardTarget(repaired, wire, start, end);
    const componentTarget = chooseComponentTarget(repaired, start, end);

    let boardEndpoint = startRole.board ? 'start' : endRole.board ? 'end' : null;
    let componentEndpoint = startRole.comp ? 'start' : endRole.comp ? 'end' : null;

    if (!boardEndpoint && boardTarget) {
      if (Math.min(boardTarget.startDist, boardTarget.endDist) <= boardSnapTolerance) {
        boardEndpoint = boardTarget.startDist <= boardTarget.endDist ? 'start' : 'end';
      }
    }
    if (!componentEndpoint && componentTarget) {
      if (Math.min(componentTarget.startDist, componentTarget.endDist) <= componentSnapTolerance) {
        componentEndpoint = componentTarget.startDist <= componentTarget.endDist ? 'start' : 'end';
      }
    }

    if (boardEndpoint && componentEndpoint && boardEndpoint === componentEndpoint) {
      const other = boardEndpoint === 'start' ? 'end' : 'start';
      const otherDist = other === 'start'
        ? Math.min(boardTarget?.startDist ?? Infinity, componentTarget?.startDist ?? Infinity)
        : Math.min(boardTarget?.endDist ?? Infinity, componentTarget?.endDist ?? Infinity);
      if (otherDist < Infinity) {
        if (!boardTarget || !componentTarget) {
          componentEndpoint = other;
        } else if ((boardEndpoint === 'start' ? boardTarget.startDist : boardTarget.endDist) <= (componentEndpoint === 'start' ? componentTarget.startDist : componentTarget.endDist)) {
          componentEndpoint = other;
        } else {
          boardEndpoint = other;
        }
      }
    }

    if (!boardEndpoint && componentEndpoint) boardEndpoint = componentEndpoint === 'start' ? 'end' : 'start';
    if (!componentEndpoint && boardEndpoint) componentEndpoint = boardEndpoint === 'start' ? 'end' : 'start';

    if (boardTarget && boardEndpoint) {
      const pointIndex = boardEndpoint === 'start' ? 0 : wire.path.length - 1;
      changed = snapPathPoint(wire.path, pointIndex, boardTarget.position) || changed;
    }

    if (componentTarget && componentEndpoint) {
      const pointIndex = componentEndpoint === 'start' ? 0 : wire.path.length - 1;
      changed = snapPathPoint(wire.path, pointIndex, componentTarget.position) || changed;
    }

    if (wire.path.length > 2) {
      if (boardTarget) {
        const boardPoint = boardEndpoint === 'start' ? wire.path[0] : wire.path[wire.path.length - 1];
        const nearBoard = nearestPointIndex(wire.path, boardTarget.position);
        if (nearBoard.distance <= 20) changed = snapPathPoint(wire.path, nearBoard.index, { x: boardPoint[0], y: boardPoint[1] }) || changed;
      }
      if (componentTarget) {
        const compPoint = componentEndpoint === 'start' ? wire.path[0] : wire.path[wire.path.length - 1];
        const nearComp = nearestPointIndex(wire.path, componentTarget.position);
        if (nearComp.distance <= 20) changed = snapPathPoint(wire.path, nearComp.index, { x: compPoint[0], y: compPoint[1] }) || changed;
      }
    }
  }

  return { diagram: repaired, changed };
}

function describeComponent(comp) {
  return comp?.props?.label || comp?.type || 'component';
}

function deriveWiringSummary(diagram) {
  const lines = [];
  const seen = new Set();
  for (const [index, wire] of (diagram.wires || []).entries()) {
    if (!wire.label) continue;
    const start = wire.path[0];
    const end = wire.path[wire.path.length - 1];
    const startRole = findEndpointRole(diagram, start, index);
    const endRole = findEndpointRole(diagram, end, index);
    const boardSide = startRole.board ? startRole : endRole.board ? endRole : null;
    const compSide = startRole.comp ? startRole : endRole.comp ? endRole : null;
    if (!boardSide || !compSide) continue;
    const boardPin = boardSide.board.name;
    const comp = diagram.components.find((item) => item.id === compSide.comp.componentId);
    const key = `${boardPin}:${compSide.comp.componentId}:${compSide.comp.pin}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`- ${boardPin} -> ${describeComponent(comp)} ${compSide.comp.pin} (${wire.color} wire)`);
  }
  return lines;
}

function replaceWiringSectionText(guide, lines) {
  const match = guide.match(/(## WIRING\s*\n\n(?:```wiregen\r?\n[\s\S]*?```\s*\n\n)?)([\s\S]*?)(\n## PARTS\b)/);
  if (!match) return guide;
  const replacementBody = lines.length ? `${lines.join('\n')}\n` : '';
  return `${guide.slice(0, match.index)}${match[1]}${replacementBody}${match[3]}${guide.slice(match.index + match[0].length)}`;
}

export function repairGuide(guide) {
  const wiregenBlocks = extractWiregenBlocks(guide);
  if (!wiregenBlocks.length) return guide;
  let diagram;
  try {
    diagram = JSON.parse(wiregenBlocks[0]);
  } catch {
    return guide;
  }

  const { diagram: repaired, changed } = repairDiagram(diagram);

  if (!changed) return guide;
  const repairedJson = JSON.stringify(repaired, null, 2);
  let nextGuide = guide.replace(/```wiregen\r?\n[\s\S]*?```/, `\`\`\`wiregen\n${repairedJson}\n\`\`\``);
  nextGuide = replaceWiringSectionText(nextGuide, deriveWiringSummary(repaired));
  return nextGuide;
}

function extractCodePins(boardType, code) {
  const pins = new Set();
  const patterns = [
    /#define\s+(\w+)\s+\(?\s*([A-Za-z0-9_]+)\s*\)?/g,
    /\b(?:const\s+)?(?:int|uint8_t|byte|constexpr\s+int)\s+(\w+)\s*=\s*([A-Za-z0-9_]+)\s*;/g,
  ];
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      if (!likelyPinConstantName(match[1])) continue;
      const pin = normalizePinToken(boardType, match[2]);
      if (pin && BOARD_PIN_SET[boardType]?.has(pin)) pins.add(pin);
    }
  }
  return pins;
}

function extractWiringTextPins(boardType, lines) {
  const pins = new Set();
  const pinPattern = /\b(IO\d+|D\d+|A\d+|SDA|SCL|5V|3\.3V|VIN|GND)\b/gi;
  for (const line of lines) {
    for (const match of line.matchAll(pinPattern)) {
      const raw = match[1].toUpperCase().replace('3.3V', 'V3_3').replace('5V', 'V5');
      const pin = normalizePinToken(boardType, raw);
      if (pin && BOARD_PIN_SET[boardType]?.has(pin)) pins.add(pin);
    }
  }
  return pins;
}

function normalizePartLine(line) {
  return line
    .replace(/^[-*]\s*/, '')
    .replace(/^\d+x\s+/i, '')
    .replace(/^1x\s+/i, '')
    .replace(/\s+--.*$/, '')
    .trim();
}

export function stripMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .trim();
}

export function normalizeBoardChoice(choice) {
  for (const board of BOARD_ALIASES) {
    if (board.pattern.test(choice || '')) return board.type;
  }
  return null;
}

export function classifyPartLabel(line) {
  const label = normalizePartLine(stripMarkdown(line));
  if (!label) return { label, status: 'unknown', kind: null };
  const boardType = normalizeBoardChoice(label);
  if (boardType) return { label, status: 'supported', kind: boardType };
  for (const entry of FUNCTIONAL_PART_PATTERNS) {
    if (entry.pattern.test(label)) return { label, status: 'supported', kind: entry.kind };
  }
  for (const entry of UNSUPPORTED_PATTERNS) {
    if (entry.test(label)) return { label, status: 'unsupported', kind: label };
  }
  if (ACCESSORY_PATTERNS.some((pattern) => pattern.test(label))) {
    return { label, status: 'accessory', kind: label };
  }
  return { label, status: 'unknown', kind: label };
}

export function analyzePartList(lines = []) {
  const supported = [];
  const accessories = [];
  const unsupported = [];
  const unknown = [];
  for (const line of lines) {
    const result = classifyPartLabel(line);
    if (result.status === 'supported') supported.push(result);
    else if (result.status === 'accessory') accessories.push(result);
    else if (result.status === 'unsupported') unsupported.push(result.label);
    else if (result.label) unknown.push(result.label);
  }
  return { supported, accessories, unsupported, unknown };
}

export function parseGuideSections(guide) {
  const lines = guide.split('\n');
  const sections = new Map();
  let current = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = heading[1].trim().toUpperCase();
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current).push(line);
  }
  return sections;
}

export function extractWiregenBlocks(guide) {
  return [...guide.matchAll(/```wiregen\r?\n([\s\S]*?)```/g)].map((match) => match[1].trim());
}

export function extractPartsLines(guide) {
  const sections = parseGuideSections(guide);
  return (sections.get('PARTS') || []).filter((line) => /^[-*]\s/.test(line.trim()));
}

export function extractStepGroups(guide) {
  const steps = [];
  const lines = guide.split('\n');
  let current = null;
  for (const rawLine of lines) {
    const numbered = rawLine.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      if (current) steps.push(current);
      current = { num: numbered[1], lines: [numbered[2].trim()] };
      continue;
    }
    if (!current) continue;
    if (/^##\s+/.test(rawLine)) {
      steps.push(current);
      current = null;
      continue;
    }
    if (!rawLine.trim()) continue;
    if (/^\s+/.test(rawLine) || /^[A-Z][A-Z ]+:/.test(rawLine.trim()) || /^\*\*/.test(rawLine.trim()) || /^>\s/.test(rawLine.trim())) {
      current.lines.push(rawLine.trim());
      continue;
    }
    if (!/^\d+\.\s+/.test(rawLine)) {
      current.lines.push(rawLine.trim());
    }
  }
  if (current) steps.push(current);
  return steps.map((step) => ({
    num: step.num,
    text: stripMarkdown(step.lines.join(' ')).replace(/\s+/g, ' ').trim(),
  }));
}

export function validateDiagram(diagram) {
  const issues = [];
  if (!diagram || typeof diagram !== 'object') {
    return { ok: false, issues: ['Diagram is missing or not a JSON object.'] };
  }
  if (!SUPPORTED_BOARD_TYPES.includes(diagram.board?.type)) {
    issues.push(`Unsupported board type "${diagram.board?.type || 'unknown'}".`);
  }
  const ids = new Set();
  for (const comp of diagram.components || []) {
    if (!SUPPORTED_COMPONENT_TYPES.includes(comp.type)) {
      issues.push(`Unsupported component type "${comp.type}".`);
    }
    if (!comp.id || ids.has(comp.id)) issues.push(`Component id "${comp.id || 'missing'}" is missing or duplicated.`);
    ids.add(comp.id);
  }
  const wires = diagram.wires || [];
  for (const [index, wire] of wires.entries()) {
    if (!SUPPORTED_WIRE_COLORS.includes((wire.color || '').toLowerCase())) {
      issues.push(`Unsupported wire color "${wire.color}".`);
    }
    if (!Array.isArray(wire.path) || wire.path.length < 2) {
      issues.push('Each wire must contain at least two path points.');
      continue;
    }
    const start = wire.path[0];
    const end = wire.path[wire.path.length - 1];
    const nearestStartPin = nearestBoardPin(diagram, start);
    const nearestEndComp = nearestComponentPin(diagram, end);
    const nearestStartComp = nearestComponentPin(diagram, start);
    const nearestEndPin = nearestBoardPin(diagram, end);
    const endpointTolerance = 10;
    const boardTouchesStart = nearestStartPin && nearestStartPin.distance <= endpointTolerance;
    const boardTouchesEnd = nearestEndPin && nearestEndPin.distance <= endpointTolerance;
    const compTouchesStart = nearestStartComp && nearestStartComp.distance <= endpointTolerance;
    const compTouchesEnd = nearestEndComp && nearestEndComp.distance <= endpointTolerance;
    const wireTouchesStart = endpointTouchesAnotherWire(start, wires, index);
    const wireTouchesEnd = endpointTouchesAnotherWire(end, wires, index);
    if (!(boardTouchesStart || boardTouchesEnd || wireTouchesStart || wireTouchesEnd)) {
      issues.push(`Wire "${wire.label || wire.color}" does not terminate on a known board pin.`);
    }
    if (!(compTouchesStart || compTouchesEnd || wireTouchesStart || wireTouchesEnd)) {
      issues.push(`Wire "${wire.label || wire.color}" does not terminate on a known component pin.`);
    }
    const labeledBoardPin = normalizePinToken(diagram.board.type, wire.label || '');
    if (labeledBoardPin && BOARD_PIN_SET[diagram.board.type]?.has(labeledBoardPin)) {
      const actualBoardPin = boardTouchesStart ? nearestStartPin.name : boardTouchesEnd ? nearestEndPin.name : null;
      if (actualBoardPin && actualBoardPin !== labeledBoardPin) {
        issues.push(`Wire label "${wire.label}" does not match its board endpoint (${actualBoardPin}).`);
      }
    }
    if (wire.label && /(sda|scl)/i.test(wire.label)) {
      const boardPinName = boardTouchesStart ? nearestStartPin.name : boardTouchesEnd ? nearestEndPin.name : null;
      if (diagram.board.type === 'arduino-mega' && ((/sda/i.test(wire.label) && boardPinName !== 'SDA') || (/scl/i.test(wire.label) && boardPinName !== 'SCL'))) {
        issues.push(`I2C wire "${wire.label}" must use the dedicated ${wire.label.match(/sda/i) ? 'SDA' : 'SCL'} pin on Arduino Mega.`);
      }
      if (diagram.board.type === 'esp32-devkit-v1' && ((/sda/i.test(wire.label) && boardPinName !== 'IO21') || (/scl/i.test(wire.label) && boardPinName !== 'IO22'))) {
        issues.push(`I2C wire "${wire.label}" must use IO21/IO22 on ESP32 DevKit V1.`);
      }
    }
  }

  // Check that every component has all required pins connected
  const compConnectedPins = {};
  for (const comp of diagram.components || []) compConnectedPins[comp.id] = new Set();
  for (const wire of wires) {
    if (!Array.isArray(wire.path) || wire.path.length < 2) continue;
    const s = wire.path[0];
    const e = wire.path[wire.path.length - 1];
    const nc1 = nearestComponentPin(diagram, s);
    const nc2 = nearestComponentPin(diagram, e);
    if (nc1?.distance <= 10 && compConnectedPins[nc1.componentId]) compConnectedPins[nc1.componentId].add(nc1.pin);
    if (nc2?.distance <= 10 && compConnectedPins[nc2.componentId]) compConnectedPins[nc2.componentId].add(nc2.pin);
  }
  for (const comp of diagram.components || []) {
    const required = COMPONENT_REQUIRED_PINS[comp.type] || [];
    const connected = compConnectedPins[comp.id] || new Set();
    const missing = required.filter(pin => !connected.has(pin));
    if (missing.length > 0) {
      issues.push(`${describeComponent(comp)} (${comp.id}) is missing wire(s) on: ${missing.join(', ')}.`);
    }
  }

  return { ok: issues.length === 0, issues };
}

export function summarizeSupport(guide) {
  const sections = parseGuideSections(guide);
  const wiringLines = (sections.get('WIRING') || []).map((line) => line.trim()).filter(Boolean);
  const partsLines = extractPartsLines(guide);
  const partAnalysis = analyzePartList(partsLines);
  const wiregenBlocks = extractWiregenBlocks(guide);
  const diagramUnavailableLine = wiringLines.find((line) => line.startsWith(DIAGRAM_UNAVAILABLE_PREFIX));
  let diagram = null;
  let diagramValidation = null;
  let boardPinsInDiagram = new Set();
  if (wiregenBlocks[0]) {
    try {
      diagram = repairDiagram(JSON.parse(wiregenBlocks[0])).diagram;
      diagramValidation = validateDiagram(diagram);
      if (diagramValidation.ok) boardPinsInDiagram = extractBoardPinsFromDiagram(diagram);
    } catch (error) {
      diagramValidation = { ok: false, issues: [`Wiregen JSON failed to parse: ${error.message}`] };
    }
  }

  const issues = [];
  if (!guide.match(/^#\s/m)) issues.push('Guide is missing a project title.');
  if (!sections.has('PARTS')) issues.push('Guide is missing a PARTS section.');
  if (!sections.has('STEPS')) issues.push('Guide is missing a STEPS section.');
  if (!sections.has('WIRING')) issues.push('Guide is missing a WIRING section.');
  if (partAnalysis.unsupported.length > 0 && !diagramUnavailableLine) {
    issues.push(`Unsupported functional parts require a text-only wiring section: ${partAnalysis.unsupported.join(', ')}.`);
  }
  if (diagramUnavailableLine && wiregenBlocks.length > 0) {
    issues.push('A guide cannot include both a wiregen diagram and a "Diagram unavailable" notice.');
  }
  if (!diagramUnavailableLine && wiregenBlocks.length === 0) {
    issues.push('Supported projects must include a valid wiregen diagram.');
  }
  if (diagramValidation && !diagramValidation.ok) issues.push(...diagramValidation.issues);
  if (diagramValidation?.ok && diagram) {
    const wiringPins = extractWiringTextPins(diagram.board.type, wiringLines);
    const codeSection = (sections.get('CODE') || []).join('\n');
    const codePins = extractCodePins(diagram.board.type, codeSection);
    for (const pin of wiringPins) {
      if (!boardPinsInDiagram.has(pin)) {
        issues.push(`WIRING text references ${pin} but the diagram does not connect that board pin.`);
      }
    }
    for (const pin of codePins) {
      if (!boardPinsInDiagram.has(pin)) {
        issues.push(`CODE references ${pin} but the diagram does not connect that board pin.`);
      }
    }
  }

  const safeTextOnly = !!diagramUnavailableLine && wiregenBlocks.length === 0;
  const supportedDiagram = !diagramUnavailableLine && wiregenBlocks.length > 0 && diagramValidation?.ok;
  const canSimulate = supportedDiagram && diagram.components.every((comp) => SIM_SUPPORTED_COMPONENT_TYPES.includes(comp.type));
  const simulationBlockers = (supportedDiagram && diagram)
    ? [...new Set(diagram.components.filter(c => !SIM_SUPPORTED_COMPONENT_TYPES.includes(c.type)).map(c => c.type))]
    : [];

  return {
    ok: issues.length === 0,
    issues,
    sections,
    partAnalysis,
    wiregenBlocks,
    diagram,
    supportedDiagram,
    safeTextOnly,
    canSimulate,
    simulationBlockers,
  };
}
