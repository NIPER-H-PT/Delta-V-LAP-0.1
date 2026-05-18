// Arduino Uno — 8 Hall sensors using D8..D13 + A0..A1
const uint8_t sensorPins[] = {8, 9, 10, 11, 12, 13, A0, A1};
const uint8_t SENSOR_COUNT = sizeof(sensorPins) / sizeof(sensorPins[0]);

unsigned long counts[SENSOR_COUNT] = {0};
int lastState[SENSOR_COUNT];

unsigned long lastPrint = 0;

void setup() {
  Serial.begin(115200);
  for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
    pinMode(sensorPins[i], INPUT_PULLUP); // use internal pull-up
    lastState[i] = digitalRead(sensorPins[i]);
  }
}

void loop() {
  // Poll and detect falling edge (HIGH -> LOW)
  for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
    int s = digitalRead(sensorPins[i]);
    if (lastState[i] == HIGH && s == LOW) {
      counts[i]++;
      delayMicroseconds(3000); // tiny debounce 3 ms
    }
    lastState[i] = s;
  }

  // Print CSV once per second
  if (millis() - lastPrint >= 1000) {
    lastPrint = millis();
    for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
      Serial.print(counts[i]);
      if (i < SENSOR_COUNT - 1) Serial.print(',');
    }
    Serial.println();
  }
}

