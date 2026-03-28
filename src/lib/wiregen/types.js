/**
 * @typedef {'arduino-uno' | 'arduino-mega' | 'arduino-nano' | 'esp32-devkit-v1'} BoardType
 * @typedef {'beginner' | 'intermediate' | 'advanced'} Difficulty
 * @typedef {'red' | 'black' | 'yellow' | 'orange' | 'blue' | 'green' | 'purple' | 'white' | 'gray'} WireColor
 * @typedef {'led' | 'resistor' | 'button' | 'dht22' | 'hc-sr04' | 'servo' | 'buzzer' | 'potentiometer' | 'oled' | 'lcd-i2c' | 'breadboard'} ComponentType
 *
 * @typedef {{ color: WireColor, path: [number, number][], label?: string }} WireSegment
 * @typedef {{ id: string, type: ComponentType, x: number, y: number, rotation?: number, props?: Record<string, unknown> }} PlacedComponent
 * @typedef {{ type: BoardType, x: number, y: number }} PlacedBoard
 * @typedef {{ id: string, name: string, description: string, difficulty: Difficulty, board: PlacedBoard, components: PlacedComponent[], wires: WireSegment[], componentList: { label: string, qty: number }[], tags?: string[] }} WiringDiagram
 */

/** JSON schema description for embedding in AI prompts */
export const WIRING_DIAGRAM_SCHEMA = `{
  "id": "string",
  "name": "string",
  "description": "string",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "board": { "type": "arduino-uno"|"arduino-mega"|"arduino-nano"|"esp32-devkit-v1", "x": number, "y": number },
  "components": [
    { "id": "string", "type": "led"|"resistor"|"button"|"dht22"|"hc-sr04"|"servo"|"buzzer"|"potentiometer"|"oled"|"lcd-i2c", "x": number, "y": number, "props": { "color": "red"|"green"|"yellow"|"blue"|"white", "value": "220Ω"|"10kΩ"|..., "label": "string" } }
  ],
  "wires": [
    { "color": "red"|"black"|"yellow"|"orange"|"blue"|"green"|"purple"|"white"|"gray", "path": [[x,y],[x,y],...], "label": "string" }
  ],
  "componentList": [ { "label": "string", "qty": number } ],
  "tags": ["string"]
}`;
