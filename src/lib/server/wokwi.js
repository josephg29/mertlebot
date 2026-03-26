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

export function extractLibraries(sketch) {
  const headers = [...sketch.matchAll(/#include\s*<([^>]+)>/g)].map(m => m[1]);
  return [...new Set(
    headers.flatMap(h => (!BUILTIN_HEADERS.has(h) && LIBRARY_MAP[h]) ? [LIBRARY_MAP[h]] : [])
  )];
}
