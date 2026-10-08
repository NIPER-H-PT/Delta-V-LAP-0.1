// motor_wheel_multi_pcint.ino
// Supports up to 8 Hall sensors on pins: 8,9,10,11,12,13,A0,A1
// Uses pin-change interrupts on PORTB and PORTC
// Prints: ms_since_start,encoder_placeholder,s1,s2,...,s8

#include <Arduino.h>

// Configuration
const uint8_t sensorPins[8] = {8,9,10,11,12,13,A0,A1};
const uint8_t SENSORS = 8;
const unsigned long MIN_GAP_US = 4000UL; // 4 ms debounce (tweak if needed)
const unsigned long PRINT_INTERVAL_MS = 100; // 100 ms print interval -> good for motor calibration

// volatile counters and state
volatile unsigned long counts[SENSORS];
volatile uint8_t lastState[SENSORS];
volatile unsigned long lastPulseMicros[SENSORS];

unsigned long startMillis = 0;
unsigned long lastPrint = 0;

// helper: map pin -> sensor index
// We'll compute masks for PORTB and PORTC to quickly check
const uint8_t portBPins[] = {8,9,10,11,12,13}; // PB0..PB5
const uint8_t portCPins[] = {A0, A1};         // PC0..PC1

// ISR for Port B (D8-D13)
ISR(PCINT0_vect) {
  uint8_t pb = PINB; // current PORTB state
  // loop sensors mapped to PORTB (indexes 0..5)
  for (uint8_t i=0; i<6; ++i) {
    uint8_t pin = portBPins[i];
    uint8_t bit = (1<<i); // PB0 is bit 0 for D8
    uint8_t curr = (pb & bit) ? 1 : 0;
    if (lastState[i] == 1 && curr == 0) { // falling edge
      unsigned long now = micros();
      if (now - lastPulseMicros[i] > MIN_GAP_US) {
        counts[i]++;
        lastPulseMicros[i] = now;
      }
    }
    lastState[i] = curr;
  }
}

// ISR for Port C (A0-A5)
ISR(PCINT1_vect) {
  uint8_t pc = PINC; // current PORTC state
  // sensors 6..7 map to PC0..PC1 (A0->PC0 index)
  for (uint8_t j=0; j<2; ++j) {
    uint8_t i = 6 + j; // sensor index 6 or 7
    uint8_t bit = (1<<j); // PC0 bit 0, PC1 bit1
    uint8_t curr = (pc & bit) ? 1 : 0;
    if (lastState[i] == 1 && curr == 0) {
      unsigned long now = micros();
      if (now - lastPulseMicros[i] > MIN_GAP_US) {
        counts[i]++;
        lastPulseMicros[i] = now;
      }
    }
    lastState[i] = curr;
  }
}

void setup() {
  Serial.begin(115200);
  // init arrays
  for (uint8_t i=0;i<SENSORS;++i) { counts[i]=0; lastPulseMicros[i]=0; }

  // configure pins and initial state
  // PORTB pins (digital 8..13)
  for (uint8_t i=0;i<6;++i) {
    pinMode(portBPins[i], INPUT_PULLUP);
    lastState[i] = (PINB & (1<<i)) ? 1 : 0;
  }
  // PORTC pins (A0..A1)
  for (uint8_t j=0;j<2;++j) {
    uint8_t pin = portCPins[j];
    pinMode(pin, INPUT_PULLUP);
    lastState[6+j] = (PINC & (1<<j)) ? 1 : 0;
  }

  // Enable PCINT for Port B and Port C
  PCICR |= (1 << PCIE0) | (1 << PCIE1);   // enable pin-change interrupts for PCINT0 (PB) and PCINT1 (PC)
  PCMSK0 |= 0x3F; // enable PCINT0..PCINT5 => bits 0..5 for PB0..PB5 (D8..D13)
  PCMSK1 |= 0x03; // enable PCINT8..PCINT9 mapping to PC0..PC1 (A0..A1), but mask bits relative: PCMSK1 bit0->PCINT8
                 // On AVR, PCMSK1 bit0 corresponds to PCINT8 (PC0), bit1->PCINT9 (PC1)

  delay(200);
  startMillis = millis();
  Serial.println("ready");
}

void loop() {
  unsigned long nowMs = millis();
  if (startMillis == 0) startMillis = nowMs;
  unsigned long ms_since_start = nowMs - startMillis;

  if (nowMs - lastPrint >= PRINT_INTERVAL_MS) {
    // copy volatile counts quickly
    noInterrupts();
    unsigned long snapshot[SENSORS];
    for (uint8_t i=0;i<SENSORS;++i) snapshot[i] = counts[i];
    interrupts();

    // Print format: ms_since_start,0,s1,s2,...s8
    Serial.print(ms_since_start); Serial.print(',');
    Serial.print(0); Serial.print(','); // encoder placeholder (0)
    for (uint8_t i=0;i<SENSORS;++i) {
      Serial.print(snapshot[i]);
      if (i < SENSORS-1) Serial.print(',');
    }
    Serial.println();
    lastPrint = nowMs;
  }
}
