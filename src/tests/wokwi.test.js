import { describe, it, expect } from 'vitest';
import { validateDiagram } from '../lib/server/wokwi.js';

describe('validateDiagram', () => {
  it('returns ok: true when all pins are wired', () => {
    const diagram = {
      components: [
        { id: 'led1', type: 'led', x: 100, y: 100 }
      ],
      wires: [
        { path: [[108, 154]] },  // Anode at (100+8, 100+54)
        { path: [[116, 154]] }   // Cathode at (100+16, 100+54)
      ]
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(true);
    expect(result.orphans).toEqual([]);
  });

  it('detects orphan LED cathode when only anode is wired', () => {
    const diagram = {
      components: [
        { id: 'led1', type: 'led', x: 100, y: 100 }
      ],
      wires: [
        { path: [[108, 154]] }  // Only anode wired
      ]
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(false);
    expect(result.orphans).toHaveLength(1);
    expect(result.orphans[0]).toMatchObject({
      componentId: 'led1',
      pin: 'C',  // Cathode is missing
      x: 116,
      y: 154
    });
  });

  it('allows wire endpoints within tolerance', () => {
    const diagram = {
      components: [
        { id: 'led1', type: 'led', x: 100, y: 100 }
      ],
      wires: [
        { path: [[108, 154]] },
        { path: [[116, 151]] }  // Cathode endpoint within 4px tolerance
      ]
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(true);
    expect(result.orphans).toEqual([]);
  });

  it('detects orphan resistor pins when disconnected', () => {
    const diagram = {
      components: [
        { id: 'r1', type: 'resistor', x: 200, y: 100 }
      ],
      wires: []
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(false);
    expect(result.orphans).toHaveLength(2);
    expect(result.orphans.map(o => o.pin)).toContain('1');
    expect(result.orphans.map(o => o.pin)).toContain('2');
  });

  it('detects multiple orphan pins across components', () => {
    const diagram = {
      components: [
        { id: 'led1', type: 'led', x: 100, y: 100 },
        { id: 'r1', type: 'resistor', x: 200, y: 100 }
      ],
      wires: [
        { path: [[108, 154]] }  // Only LED anode
      ]
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(false);
    expect(result.orphans.length).toBeGreaterThan(2);  // LED cathode + both resistor pins
  });

  it('validates button with all 4 pins', () => {
    const diagram = {
      components: [
        { id: 'btn1', type: 'button', x: 300, y: 200 }
      ],
      wires: [
        { path: [[300, 200]] },   // Pin 1
        { path: [[340, 200]] },   // Pin 2
        { path: [[300, 240]] },   // Pin 3
        { path: [[340, 240]] }    // Pin 4
      ]
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(true);
  });

  it('detects buzzer with only positive pin wired', () => {
    const diagram = {
      components: [
        { id: 'buzz1', type: 'buzzer', x: 400, y: 300 }
      ],
      wires: [
        { path: [[410, 340]] }  // Only positive pin
      ]
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(false);
    expect(result.orphans).toHaveLength(1);
    expect(result.orphans[0].pin).toBe('-');
  });

  it('ignores empty diagram', () => {
    const result = validateDiagram({});
    expect(result.ok).toBe(true);
    expect(result.orphans).toEqual([]);
  });

  it('ignores unknown component types', () => {
    const diagram = {
      components: [
        { id: 'unknown1', type: 'unknown-device', x: 100, y: 100 }
      ],
      wires: []
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(true);
  });

  it('validates DHT22 with all three connections', () => {
    const diagram = {
      components: [
        { id: 'dht1', type: 'dht22', x: 500, y: 400 }
      ],
      wires: [
        { path: [[507, 460]] },  // VCC
        { path: [[516, 460]] },  // DATA
        { path: [[533, 460]] }   // GND
      ]
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(true);
  });

  it('detects missing wire in multi-component circuit', () => {
    const diagram = {
      components: [
        { id: 'led1', type: 'led', x: 100, y: 100 },
        { id: 'r1', type: 'resistor', x: 200, y: 100 },
        { id: 'btn1', type: 'button', x: 300, y: 200 }
      ],
      wires: [
        { path: [[108, 154], [200, 110]] },  // LED anode to resistor pin 1
        { path: [[280, 110], [116, 154]] },  // Resistor pin 2 to LED cathode
        { path: [[300, 200], [340, 200], [300, 240], [340, 240]] }  // Button wired
      ]
    };

    const result = validateDiagram(diagram);
    expect(result.ok).toBe(true);
  });
});
