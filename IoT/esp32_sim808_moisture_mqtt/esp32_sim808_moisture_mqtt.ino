/*
  POLI ESP32 + SIM808 + Soil Moisture + OLED + GPS capture MQTT publisher

  Use this sketch when your ESP32 module arrives. Keep it in its own folder:
    IoT/esp32_sim808_moisture_mqtt/esp32_sim808_moisture_mqtt.ino

  Suggested ESP32 wiring:
    SIM808 TXD -> ESP32 GPIO16 / RX2
    SIM808 RXD -> ESP32 GPIO17 / TX2
    SIM808 GND -> ESP32 GND
    SIM808 VCC -> external SIM808-safe power

  Soil moisture sensor:
    AO -> ESP32 GPIO34
    VCC -> 3V3 or sensor-safe supply
    GND -> ESP32 GND
    DO is not used because the dashboard needs percentage moisture.

  SPI OLED NFP1315-51A / SSD1306-style wiring:
    OLED GND -> ESP32 GND
    OLED VCC -> ESP32 3V3
    OLED D0  -> ESP32 GPIO18 / SCK
    OLED D1  -> ESP32 GPIO23 / MOSI
    OLED DC  -> ESP32 GPIO26
    OLED CS  -> ESP32 GPIO25
    OLED RES -> ESP32 GPIO27

  GPS capture button:
    One side -> ESP32 GPIO33
    Other side -> ESP32 GND

  Dashboard MQTT topics:
    Sensors -> hackviet/data/sensors
    GPS     -> hackviet/data/gps
*/

#if !defined(ESP32)
#error "Select an ESP32 board before compiling this sketch."
#endif

#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// -------------------- WiFi --------------------
const char *WIFI_SSID = "B1225";
const char *WIFI_PASSWORD = "12345678";

// -------------------- MQTT --------------------
const char *MQTT_HOST = "broker.emqx.io";
const uint16_t MQTT_PORT = 1883;
const char *MQTT_TOPIC_SENSORS = "hackviet/data/sensors";
const char *MQTT_TOPIC_GPS = "hackviet/data/gps";
const char *DEVICE_ID = "greenhouse-1";

// -------------------- SIM808 UART --------------------
const uint8_t SIM808_RX_PIN = 16; // ESP32 RX2 receives from SIM808 TXD
const uint8_t SIM808_TX_PIN = 17; // ESP32 TX2 transmits to SIM808 RXD
const uint32_t SIM808_BAUD = 9600;

// -------------------- Soil moisture calibration --------------------
const uint8_t SOIL_AO_PIN = 34; // ADC1 pin, input-only, safe while WiFi is active

// Calibrate these two values with your own sensor:
//   SOIL_DRY_RAW = analogRead(GPIO34) in dry air / dry soil
//   SOIL_WET_RAW = analogRead(GPIO34) in water / very wet soil
const int SOIL_DRY_RAW = 3200;
const int SOIL_WET_RAW = 1300;

// -------------------- OLED display --------------------
const int OLED_WIDTH = 128;
const int OLED_HEIGHT = 64;
const int OLED_DC_PIN = 26;
const int OLED_RESET_PIN = 27;
const int OLED_CS_PIN = 25;

// -------------------- GPS capture button --------------------
const uint8_t GPS_CAPTURE_BUTTON_PIN = 33;
const unsigned long BUTTON_DEBOUNCE_MS = 60;
const unsigned long DISPLAY_REFRESH_INTERVAL_MS = 80;
const bool LOG_SIM808_AT = false;

// -------------------- Timing --------------------
const unsigned long MQTT_PUBLISH_INTERVAL_MS = 10000;
const unsigned long GPS_REFRESH_INTERVAL_MS = 5000;
const unsigned long WIFI_RETRY_DELAY_MS = 500;
const unsigned long MQTT_RETRY_DELAY_MS = 3000;

HardwareSerial sim808(2);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &SPI, OLED_DC_PIN, OLED_RESET_PIN, OLED_CS_PIN);

unsigned long lastPublishMs = 0;
unsigned long lastGpsRefreshMs = 0;
unsigned long lastDisplayRefreshMs = 0;
unsigned long lastButtonChangeMs = 0;
uint8_t animationFrame = 0;
bool sim808Ready = false;
bool displayReady = false;
bool lastButtonReading = HIGH;
bool stableButtonState = HIGH;
bool captureBusy = false;
bool captureRequested = false;
bool buttonLowAtBoot = false;
bool lastGpsSendOk = false;
int lastSoilPercent = 0;
String locationMessage = "Press button";
String lastSendMessage = "-";

struct GpsData {
  bool hasFix;
  String fixStatus;
  String timestamp;
  double latitude;
  double longitude;
  String rawLatitude;
  String rawLongitude;
};

GpsData gps = {false, "-", "-", 0.0, 0.0, "-", "-"};

struct CapturedLocation {
  bool available;
  String timestamp;
  double latitude;
  double longitude;
};

CapturedLocation capturedLocation = {false, "-", 0.0, 0.0};

void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(SOIL_AO_PIN, INPUT);
  pinMode(GPS_CAPTURE_BUTTON_PIN, INPUT_PULLUP);
  lastButtonReading = digitalRead(GPS_CAPTURE_BUTTON_PIN);
  stableButtonState = lastButtonReading;
  if (stableButtonState == LOW) {
    buttonLowAtBoot = true;
    locationMessage = "Button stuck LOW";
  }
  analogReadResolution(12);
  analogSetPinAttenuation(SOIL_AO_PIN, ADC_11db);

  setupDisplay();

  sim808.begin(SIM808_BAUD, SERIAL_8N1, SIM808_RX_PIN, SIM808_TX_PIN);

  printBootSummary();

  updateDisplay();
  connectWiFi();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setSocketTimeout(1);
  setupSim808Gps();
  updateDisplay();
}

void loop() {
  ensureWiFi();
  ensureMqtt();
  mqttClient.loop();
  serviceControlsAndDisplay();
  processCaptureRequest();

  unsigned long now = millis();

  if (now - lastGpsRefreshMs >= GPS_REFRESH_INTERVAL_MS) {
    lastGpsRefreshMs = now;
    refreshGps();
  }

  if (now - lastPublishMs >= MQTT_PUBLISH_INTERVAL_MS) {
    lastPublishMs = now;
    publishCurrentData();
  }
}

void serviceControlsAndDisplay() {
  handleGpsCaptureButton();
  serviceDisplayOnly();
}

void serviceDisplayOnly() {
  unsigned long now = millis();
  if (now - lastDisplayRefreshMs >= DISPLAY_REFRESH_INTERVAL_MS) {
    lastDisplayRefreshMs = now;
    animationFrame = (animationFrame + 1) % 32;
    updateDisplay();
  }
}

void waitWithUi(unsigned long waitMs) {
  unsigned long start = millis();

  while (millis() - start < waitMs) {
    serviceControlsAndDisplay();
    delay(50);
    yield();
  }
}

void setupDisplay() {
  SPI.begin(18, -1, 23, -1);

  displayReady = display.begin(SSD1306_SWITCHCAPVCC);

  if (!displayReady) {
    Serial.println(F("OLED did not start. Check VCC, GND, D0, D1, DC, CS, and RES."));
    return;
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("POLI ESP32"));
  display.println(F("Starting..."));
  display.display();
}

void connectWiFi() {
  Serial.print(F("Connecting WiFi: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    waitWithUi(WIFI_RETRY_DELAY_MS);
    Serial.print('.');
  }

  Serial.println();
  Serial.print(F("WiFi connected. IP: "));
  Serial.println(WiFi.localIP());
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println(F("WiFi disconnected. Reconnecting..."));
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    waitWithUi(WIFI_RETRY_DELAY_MS);
    Serial.print('.');
    yield();
  }

  Serial.println();
  Serial.println(F("WiFi reconnected."));
}

void ensureMqtt() {
  while (!mqttClient.connected()) {
    Serial.print(F("Connecting MQTT... "));

    String clientId = "poli-esp32-";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);
    clientId += "-";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(F("connected."));
    } else {
      Serial.print(F("failed, rc="));
      Serial.print(mqttClient.state());
      Serial.println(F(". Retrying..."));
      waitWithUi(MQTT_RETRY_DELAY_MS);
    }
  }
}

void setupSim808Gps() {
  Serial.println(F("Checking SIM808 AT connection..."));

  sim808Ready = sendCommandExpect("AT", "OK", 1500);

  if (!sim808Ready) {
    Serial.println(F("SIM808 did not answer AT. Check TX/RX crossing, GND, power, and PWRKEY."));
    return;
  }

  sendCommandExpect("ATE0", "OK", 1500);
  sendCommandExpect("AT+CGPSPWR=1", "OK", 2000);
  sendCommandExpect("AT+CGPSRST=0", "OK", 2000);

  Serial.println(F("SIM808 GPS commands sent. Wait for outdoor GPS fix."));
}

void refreshGps() {
  if (!sim808Ready) {
    setupSim808Gps();
    return;
  }

  updateGpsFixStatus();
  updateGpsRmcData();
}

void updateGpsFixStatus() {
  String response = sendCommand("AT+CGPSSTATUS?", 1500);
  String line = extractAtLine(response, "+CGPSSTATUS:");

  if (line.length() == 0) {
    gps.fixStatus = "-";
    return;
  }

  gps.fixStatus = line;
}

void updateGpsRmcData() {
  String response = sendCommand("AT+CGPSINF=32", 2000);
  String line = extractAtLine(response, "+CGPSINF:");

  if (line.length() == 0) {
    gps.hasFix = false;
    return;
  }

  parseCgpsinf32(line);
}

void parseCgpsinf32(String line) {
  String fields[13];
  splitCsv(line, fields, 13);

  String utcTime = fields[1];
  String validFlag = fields[2];
  String rawLat = fields[3];
  String latHemisphere = fields[4];
  String rawLon = fields[5];
  String lonHemisphere = fields[6];
  String utcDate = fields[9];

  double lat = coordinateToDecimal(rawLat, latHemisphere, false);
  double lon = coordinateToDecimal(rawLon, lonHemisphere, true);

  gps.rawLatitude = valueOrDash(rawLat);
  gps.rawLongitude = valueOrDash(rawLon);
  gps.timestamp = gpsTimestampOrFallback(utcDate, utcTime);
  gps.hasFix = validFlag == "A" && lat != 0.0 && lon != 0.0;

  if (gps.hasFix) {
    gps.latitude = lat;
    gps.longitude = lon;
  }
}

void publishCurrentData() {
  lastSoilPercent = readSoilMoisturePercent();
  String timestamp = gps.timestamp != "-" ? gps.timestamp : uptimeTimestamp();

  char sensorPayload[180];
  snprintf(
    sensorPayload,
    sizeof(sensorPayload),
    "{\"device_id\":\"%s\",\"timestamp\":\"%s\",\"hum_soil\":%d}",
    DEVICE_ID,
    timestamp.c_str(),
    lastSoilPercent
  );

  mqttClient.publish(MQTT_TOPIC_SENSORS, sensorPayload);
  Serial.print(F("MQTT sensors: soil="));
  Serial.print(lastSoilPercent);
  Serial.println(F("%"));

  if (gps.hasFix) {
    lastGpsSendOk = publishGpsIfFixed(timestamp);
    lastSendMessage = lastGpsSendOk ? "Sent OK" : "Send failed";
  } else {
    Serial.print(F("GPS waiting: "));
    Serial.println(gps.fixStatus);
  }
}

bool publishGpsIfFixed(String timestamp) {
  if (!gps.hasFix) return false;

  char gpsPayload[220];
  char latBuffer[18];
  char lonBuffer[18];

  dtostrf(gps.latitude, 0, 6, latBuffer);
  dtostrf(gps.longitude, 0, 6, lonBuffer);

  snprintf(
    gpsPayload,
    sizeof(gpsPayload),
    "{\"device_id\":\"%s\",\"timestamp\":\"%s\",\"lat\":%s,\"long\":%s,\"fix_status\":\"%s\"}",
    DEVICE_ID,
    timestamp.c_str(),
    latBuffer,
    lonBuffer,
    gps.fixStatus.c_str()
  );

  bool sent = mqttClient.publish(MQTT_TOPIC_GPS, gpsPayload);
  Serial.print(F("MQTT GPS: "));
  Serial.print(sent ? F("sent") : F("failed"));
  Serial.print(F(" | lat="));
  Serial.print(latBuffer);
  Serial.print(F(", lon="));
  Serial.println(lonBuffer);
  return sent;
}

int readSoilMoisturePercent() {
  int raw = analogRead(SOIL_AO_PIN);

  int percent = map(raw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100);
  percent = constrain(percent, 0, 100);

  return percent;
}

String sendCommand(const char *command, unsigned long timeoutMs) {
  while (sim808.available()) sim808.read();

  if (LOG_SIM808_AT) {
    Serial.print(F("SIM808 >> "));
    Serial.println(command);
  }

  sim808.println(command);

  String response = "";
  unsigned long start = millis();

  while (millis() - start < timeoutMs) {
    while (sim808.available()) {
      response += char(sim808.read());
    }
    serviceControlsAndDisplay();
    yield();
  }

  if (LOG_SIM808_AT) {
    Serial.print(F("SIM808 << "));
    if (response.length() == 0) {
      Serial.println(F("(no response)"));
    } else {
      Serial.println(response);
    }
  }

  return response;
}

bool sendCommandExpect(const char *command, const char *expected, unsigned long timeoutMs) {
  String response = sendCommand(command, timeoutMs);
  return response.indexOf(expected) >= 0;
}

String extractAtLine(String response, const char *prefix) {
  int start = response.indexOf(prefix);
  if (start < 0) return "";

  start += strlen(prefix);
  int end = response.indexOf('\n', start);
  if (end < 0) end = response.length();

  String line = response.substring(start, end);
  line.trim();
  return line;
}

void splitCsv(String source, String fields[], int maxFields) {
  int fieldIndex = 0;
  int fieldStart = 0;

  for (int i = 0; i <= source.length() && fieldIndex < maxFields; i++) {
    if (i == source.length() || source.charAt(i) == ',') {
      fields[fieldIndex] = source.substring(fieldStart, i);
      fields[fieldIndex].trim();
      fieldIndex++;
      fieldStart = i + 1;
    }
  }

  while (fieldIndex < maxFields) {
    fields[fieldIndex++] = "";
  }
}

double coordinateToDecimal(String raw, String hemisphere, bool isLongitude) {
  raw.trim();
  hemisphere.trim();

  if (raw.length() == 0 || raw == "0" || raw == "0.000000") return 0.0;

  bool negative = raw.charAt(0) == '-';
  if (negative) raw = raw.substring(1);

  int degreeDigits = isLongitude ? 3 : 2;
  int dotIndex = raw.indexOf('.');

  if (dotIndex < degreeDigits || raw.length() <= degreeDigits) return 0.0;

  double degrees = raw.substring(0, degreeDigits).toDouble();
  double minutes = raw.substring(degreeDigits).toDouble();
  double decimal = degrees + (minutes / 60.0);

  if (negative || hemisphere == "S" || hemisphere == "W") {
    decimal *= -1.0;
  }

  return decimal;
}

String gpsTimestampOrFallback(String date, String time) {
  date.trim();
  time.trim();

  if (date.length() < 6 || time.length() < 6) {
    return uptimeTimestamp();
  }

  String day = date.substring(0, 2);
  String month = date.substring(2, 4);
  String year = "20" + date.substring(4, 6);
  String hour = time.substring(0, 2);
  String minute = time.substring(2, 4);
  String second = time.substring(4, 6);

  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

String uptimeTimestamp() {
  unsigned long seconds = millis() / 1000;
  return "uptime-" + String(seconds) + "s";
}

String valueOrDash(String value) {
  value.trim();
  return value.length() > 0 ? value : "-";
}

bool buttonPressed() {
  return digitalRead(GPS_CAPTURE_BUTTON_PIN) == LOW;
}

void setLocationMessage(const char *message) {
  locationMessage = message;
  updateDisplay();
}

bool locationReadyToSend() {
  return sim808Ready && WiFi.status() == WL_CONNECTED && mqttClient.connected() && gps.hasFix && !captureBusy;
}

const char *centerStatusText() {
  if (buttonLowAtBoot && buttonPressed()) return "WIRING?";
  if (captureBusy) return "GPS...";
  if (captureRequested) return "QUEUED";
  if (locationMessage == "Button seen") return "PRESSED";
  if (lastSendMessage == "Sent OK") return "SENT";
  if (lastSendMessage == "Send failed" || lastSendMessage == "Not sent") return "FAILED";
  if (WiFi.status() != WL_CONNECTED) return "NO WIFI";
  if (!mqttClient.connected()) return "MQTT OFF";
  if (!sim808Ready) return "SIM808";
  if (!gps.hasFix) return "NO FIX";
  if (locationReadyToSend()) return "PRESS";
  return "WAIT";
}

void drawCornerTicks(uint8_t phase) {
  uint8_t foldedPhase = phase % 16;
  if (foldedPhase > 8) foldedPhase = 16 - foldedPhase;

  int offset = 2 + (foldedPhase / 2);
  display.drawLine(0, offset, 0, offset + 8, SSD1306_WHITE);
  display.drawLine(offset, 0, offset + 8, 0, SSD1306_WHITE);
  display.drawLine(127, offset, 127, offset + 8, SSD1306_WHITE);
  display.drawLine(127 - offset, 0, 119 - offset, 0, SSD1306_WHITE);
  display.drawLine(0, 63 - offset, 0, 55 - offset, SSD1306_WHITE);
  display.drawLine(offset, 63, offset + 8, 63, SSD1306_WHITE);
  display.drawLine(127, 63 - offset, 127, 55 - offset, SSD1306_WHITE);
  display.drawLine(127 - offset, 63, 119 - offset, 63, SSD1306_WHITE);
}

void drawFocusPulse(uint8_t phase) {
  uint8_t foldedPhase = phase % 32;
  if (foldedPhase > 16) foldedPhase = 32 - foldedPhase;

  int radius = 18 + foldedPhase;
  display.drawCircle(64, 32, radius, SSD1306_WHITE);
  display.drawCircle(64, 32, radius + 7, SSD1306_WHITE);

  const int8_t orbitX[] = {0, 7, 13, 18, 22, 24, 22, 18, 13, 7, 0, -7, -13, -18, -22, -24, -22, -18, -13, -7, 0, 7, 13, 18, 22, 24, 22, 18, 13, 7, 0, -7};
  const int8_t orbitY[] = {-24, -22, -18, -13, -7, 0, 7, 13, 18, 22, 24, 22, 18, 13, 7, 0, -7, -13, -18, -22, -24, -22, -18, -13, -7, 0, 7, 13, 18, 22, 24, 22};
  uint8_t orbitFrame = phase % 32;
  display.fillCircle(64 + orbitX[orbitFrame], 32 + orbitY[orbitFrame], 2, SSD1306_WHITE);
}

void drawSuccessIcon() {
  display.drawLine(42, 33, 55, 46, SSD1306_WHITE);
  display.drawLine(43, 34, 55, 47, SSD1306_WHITE);
  display.drawLine(55, 46, 86, 18, SSD1306_WHITE);
  display.drawLine(56, 47, 87, 19, SSD1306_WHITE);
}

void drawFailureIcon() {
  display.drawLine(43, 18, 85, 46, SSD1306_WHITE);
  display.drawLine(44, 17, 86, 45, SSD1306_WHITE);
  display.drawLine(85, 18, 43, 46, SSD1306_WHITE);
  display.drawLine(86, 19, 44, 47, SSD1306_WHITE);
}

void drawCenterStatus(const char *text) {
  if (strcmp(text, "SENT") == 0) {
    drawSuccessIcon();
    return;
  }

  if (strcmp(text, "FAILED") == 0) {
    drawFailureIcon();
    return;
  }

  drawCenteredText(text);
}

void drawCenteredText(const char *text) {
  int16_t x1;
  int16_t y1;
  uint16_t textWidth;
  uint16_t textHeight;

  display.setTextSize(2);
  display.getTextBounds(text, 0, 0, &x1, &y1, &textWidth, &textHeight);

  int16_t x = (OLED_WIDTH - textWidth) / 2;
  int16_t y = (OLED_HEIGHT - textHeight) / 2;

  display.fillRect(0, y - 3, OLED_WIDTH, textHeight + 6, SSD1306_BLACK);
  display.setCursor(x, y);
  display.print(text);
}

void printBootSummary() {
  Serial.println();
  Serial.println(F("POLI ESP32 field node"));
  Serial.println(F("SIM808 power: external 3.7V-4.2V supply, shared GND."));
  Serial.println(F("OLED: D0=GPIO18, D1=GPIO23, DC=GPIO26, CS=GPIO25, RES=GPIO27."));
  Serial.println(F("Button: GPIO33 to GND, INPUT_PULLUP."));

  Serial.print(F("Button boot: "));
  Serial.println(buttonPressed() ? F("LOW/PRESSED") : F("HIGH/READY"));

  if (buttonPressed()) {
    Serial.println(F("Button warning: GPIO33 is already LOW. If not pressed, move to opposite button legs."));
  }
}

void printButtonEvent(bool pressed) {
  Serial.print(F("Button "));
  Serial.print(pressed ? F("pressed") : F("released"));
  Serial.print(F(" | GPIO"));
  Serial.print(GPS_CAPTURE_BUTTON_PIN);
  Serial.print(F("="));
  Serial.println(buttonPressed() ? F("LOW") : F("HIGH"));
}

void handleGpsCaptureButton() {
  bool reading = digitalRead(GPS_CAPTURE_BUTTON_PIN);
  unsigned long now = millis();

  if (reading != lastButtonReading) {
    lastButtonChangeMs = now;
    lastButtonReading = reading;

    if (reading == LOW) {
      printButtonEvent(true);
      setLocationMessage("Button seen");
    } else {
      printButtonEvent(false);
    }
  }

  if (now - lastButtonChangeMs < BUTTON_DEBOUNCE_MS) return;
  if (reading == stableButtonState) return;

  stableButtonState = reading;

  if (stableButtonState == LOW) {
    requestLocationCapture();
  }
}

void requestLocationCapture() {
  if (captureBusy || captureRequested) return;

  if (!locationReadyToSend()) {
    lastGpsSendOk = false;
    lastSendMessage = "Not sent";
    Serial.print(F("GPS capture: blocked | "));
    Serial.println(centerStatusText());
    setLocationMessage("Not ready");
    return;
  }

  captureRequested = true;
  Serial.println(F("GPS capture: queued"));
  setLocationMessage("Queued");
}

void processCaptureRequest() {
  if (!captureRequested || captureBusy) return;

  captureRequested = false;
  captureCurrentLocation();
}

void captureCurrentLocation() {
  captureBusy = true;
  Serial.println(F("GPS capture: checking..."));
  setLocationMessage("Checking GPS");
  refreshGps();

  if (!gps.hasFix) {
    Serial.print(F("GPS capture: no fix | status="));
    Serial.println(gps.fixStatus);
    lastGpsSendOk = false;
    lastSendMessage = "Not sent";
    captureBusy = false;
    setLocationMessage("No fix found");
    return;
  }

  capturedLocation.available = true;
  capturedLocation.timestamp = gps.timestamp != "-" ? gps.timestamp : uptimeTimestamp();
  capturedLocation.latitude = gps.latitude;
  capturedLocation.longitude = gps.longitude;

  lastGpsSendOk = publishGpsIfFixed(capturedLocation.timestamp);
  lastSendMessage = lastGpsSendOk ? "Sent OK" : "Send failed";

  Serial.print(F("GPS capture: saved | lat="));
  Serial.print(capturedLocation.latitude, 6);
  Serial.print(F(", lon="));
  Serial.println(capturedLocation.longitude, 6);

  captureBusy = false;
  setLocationMessage(lastGpsSendOk ? "Location sent" : "Send failed");
}

void updateDisplay() {
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  drawCornerTicks(animationFrame);
  drawFocusPulse(animationFrame);
  drawCenterStatus(centerStatusText());

  display.display();
}
