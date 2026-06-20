// Sample circuits for the static showcase. Coordinates use the real
// boardPins.js / component geometry, so every wire lands on an actual pin —
// these pass the same validateDiagram() checks the live app runs.
export const samples = [
  {
    name: 'LED + resistor',
    blurb: 'Arduino Uno driving an LED through a 220Ω current-limiting resistor.',
    diagram: {
      board: { type: 'arduino-uno', x: 80, y: 120 },
      components: [
        { type: 'led', id: 'led1', x: 340, y: 90, props: { label: 'Status LED', color: 'red' } },
        { type: 'resistor', id: 'r1', x: 300, y: 300, props: { label: '220Ω' } },
      ],
      wires: [
        { label: 'D13', color: 'red', path: [[122, 110], [300, 310]] },
        { label: 'V5', color: 'black', path: [[132, 315], [380, 310]] },
        { label: 'D12', color: 'green', path: [[132, 110], [348, 144]] },
        { label: 'GND', color: 'blue', path: [[142, 315], [356, 144]] },
      ],
    },
  },
  {
    name: 'DHT22 sensor',
    blurb: 'Temperature/humidity sensor wired to power, ground, and a data pin.',
    diagram: {
      board: { type: 'arduino-uno', x: 80, y: 120 },
      components: [
        { type: 'dht22', id: 'dht1', x: 380, y: 150, props: { label: 'DHT22' } },
      ],
      wires: [
        { label: 'V5', color: 'red', path: [[132, 315], [387, 210]] },
        { label: 'D2', color: 'green', path: [[242, 110], [396, 210]] },
        { label: 'GND', color: 'black', path: [[142, 315], [413, 210]] },
      ],
    },
  },
];
