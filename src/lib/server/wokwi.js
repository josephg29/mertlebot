export const LIBRARY_MAP = {
  'FastLED.h':               'FastLED',
  'Adafruit_NeoPixel.h':     'Adafruit NeoPixel',
  'DHT.h':                   'DHT sensor library',
  'DHT_U.h':                 'DHT sensor library',
  'Adafruit_SSD1306.h':      'Adafruit SSD1306',
  'Adafruit_GFX.h':          'Adafruit GFX Library',
  'Adafruit_BME280.h':       'Adafruit BME280 Library',
  'Adafruit_BMP280.h':       'Adafruit BMP280 Library',
  'Adafruit_MPU6050.h':      'Adafruit MPU6050',
  'Adafruit_ADXL345_U.h':    'Adafruit ADXL345',
  'Adafruit_HMC5883_U.h':    'Adafruit HMC5883 Unified',
  'Adafruit_Unified_Sensor.h':'Adafruit Unified Sensor',
  'LiquidCrystal_I2C.h':     'LiquidCrystal I2C',
  'IRremote.h':               'IRremote',
  'IRremoteESP8266.h':        'IRremoteESP8266',
  'Keypad.h':                 'Keypad',
  'TM1637Display.h':          'TM1637Display',
  'ezButton.h':               'ezButton',
  'RTClib.h':                 'RTClib',
  'DS1307RTC.h':              'DS1307RTC',
  'TimeLib.h':                'Time',
  'MFRC522.h':                'MFRC522',
  'Encoder.h':                'Encoder',
  'PID_v1.h':                 'PID',
  'ArduinoJson.h':            'ArduinoJson',
  'PubSubClient.h':           'PubSubClient',
  'U8g2lib.h':                'U8g2',
  'MAX6675.h':                'MAX6675 library',
  'HX711.h':                  'HX711',
  'Stepper28BYJ.h':           'Stepper28BYJ',
  'AccelStepper.h':           'AccelStepper',
  'NewPing.h':                'NewPing',
  'Ultrasonic.h':             'Ultrasonic',
  'SoftwareSerial.h':         'SoftwareSerial',
  'AltSoftSerial.h':          'AltSoftSerial',
  'NTPClient.h':              'NTPClient',
  'WiFiUdp.h':                'WiFi',
  'AsyncTCP.h':               'AsyncTCP',
  'ESPAsyncWebServer.h':      'ESPAsyncWebServer',
};

export const BUILTIN_HEADERS = new Set([
  'Arduino.h','Wire.h','SPI.h','Servo.h','EEPROM.h','LiquidCrystal.h',
  'Stepper.h','SD.h','SD_MMC.h','FS.h','SPIFFS.h','LittleFS.h',
  'WiFi.h','WiFiClient.h','WiFiServer.h','HTTPClient.h','WebServer.h',
  'BluetoothSerial.h','BLEDevice.h','BLEServer.h','BLEUtils.h','BLE2902.h',
  'HardwareSerial.h','IPAddress.h','Ticker.h','esp_system.h',
  'avr/pgmspace.h','avr/io.h','avr/interrupt.h','util/delay.h',
  'math.h','stdio.h','string.h','stdlib.h',
]);

/**
 * Component pin geometry offsets relative to component position (x, y).
 * Each pin is identified by a key (name) and its [dx, dy] offset.
 */
export const COMPONENT_PIN_OFFSETS = {
  led: {
    A: [8, 54],        // Anode (+)
    C: [16, 54]        // Cathode (-)
  },
  resistor: {
    1: [0, 10],        // Left pin
    2: [80, 10]        // Right pin
  },
  button: {
    1: [0, 0],         // Top-left
    2: [40, 0],        // Top-right
    3: [0, 40],        // Bottom-left
    4: [40, 40]        // Bottom-right
  },
  buzzer: {
    '+': [10, 40],     // Positive
    '-': [26, 40]      // Negative
  },
  servo: {
    GND: [0, 30],
    V5: [0, 37],
    SIG: [0, 44]
  },
  dht22: {
    VCC: [7, 60],
    DATA: [16, 60],
    GND: [33, 60]
  },
  'hc-sr04': {
    VCC: [12, 0],
    TRIG: [28, 0],
    ECHO: [52, 0],
    GND: [68, 0]
  },
  oled: {
    GND: [10, 50],
    VCC: [22, 50],
    SCL: [38, 50],
    SDA: [50, 50]
  },
  'lcd-i2c': {
    GND: [14, 60],
    VCC: [28, 60],
    SDA: [42, 60],
    SCL: [56, 60]
  }
};

/**
 * Validate that all component pins in a wiring diagram have at least one wire endpoint.
 * @param {object} diagram - Parsed wiregen diagram JSON
 * @returns {{ ok: boolean, orphans: Array<{componentId: string, pin: string, x: number, y: number}> }}
 */
export function validateDiagram(diagram) {
  const orphans = [];
  const tolerance = 4; // pixels

  if (!diagram.components || !Array.isArray(diagram.components)) {
    return { ok: true, orphans: [] };
  }

  const wires = diagram.wires || [];

  for (const component of diagram.components) {
    const componentType = component.type;
    const pinOffsets = COMPONENT_PIN_OFFSETS[componentType];

    if (!pinOffsets) {
      // Unknown component type — skip validation
      continue;
    }

    for (const [pinName, [dx, dy]] of Object.entries(pinOffsets)) {
      const pinX = component.x + dx;
      const pinY = component.y + dy;

      // Check if this pin is the endpoint of any wire
      const isConnected = wires.some(wire => {
        if (!wire.path || !Array.isArray(wire.path)) return false;
        return wire.path.some(point => {
          const distance = Math.hypot(point[0] - pinX, point[1] - pinY);
          return distance <= tolerance;
        });
      });

      if (!isConnected) {
        orphans.push({
          componentId: component.id,
          pin: pinName,
          x: pinX,
          y: pinY
        });
      }
    }
  }

  return {
    ok: orphans.length === 0,
    orphans
  };
}

export function extractLibraries(sketch) {
  const headers = [...sketch.matchAll(/#include\s*<([^>]+)>/g)].map(m => m[1]);
  return [...new Set(
    headers.flatMap(h => (!BUILTIN_HEADERS.has(h) && LIBRARY_MAP[h]) ? [LIBRARY_MAP[h]] : [])
  )];
}
