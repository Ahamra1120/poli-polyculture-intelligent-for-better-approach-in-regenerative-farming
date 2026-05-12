/*
  POLI Wemos ESP8266 + SIM808 + Soil Moisture MQTT publisher

  Board:
    Wemos D1 mini / ESP8266

  SIM808 wiring from your note:
    SIM808 TXD -> Wemos D5 / GPIO14
    SIM808 RXD -> Wemos D6 / GPIO12
    SIM808 GND -> Wemos GND
    SIM808 VCC -> external SIM808-safe power

  Soil moisture sensor:
    AO -> Wemos A0
    VCC -> 3V3 or sensor-safe supply
    GND -> Wemos GND
    DO is not used because the dashboard needs percentage moisture.

  Dashboard MQTT topics:
    Sensors -> hackviet/data/sensors
    GPS     -> hackviet/data/gps
*/

#if !defined(ESP8266)
#error "Select an ESP8266 board, for example LOLIN(WEMOS) D1 R2 & mini."
#endif

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <SoftwareSerial.h>

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
const uint8_t SIM808_RX_PIN = 14; // Wemos D5/GPIO14 receives from SIM808 TXD
const uint8_t SIM808_TX_PIN = 12; // Wemos D6/GPIO12 transmits to SIM808 RXD
const uint32_t SIM808_BAUD = 9600;

// -------------------- Soil moisture calibration --------------------
const uint8_t SOIL_AO_PIN = A0;

// Calibrate these two values with your own sensor:
//   SOIL_DRY_RAW = analogRead(A0) in dry air / dry soil
//   SOIL_WET_RAW = analogRead(A0) in water / very wet soil
const int SOIL_DRY_RAW = 850;
const int SOIL_WET_RAW = 350;

// -------------------- Timing --------------------
const unsigned long MQTT_PUBLISH_INTERVAL_MS = 10000;
const unsigned long GPS_REFRESH_INTERVAL_MS = 5000;
const unsigned long WIFI_RETRY_DELAY_MS = 500;
const unsigned long MQTT_RETRY_DELAY_MS = 3000;

SoftwareSerial sim808(SIM808_RX_PIN, SIM808_TX_PIN);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastPublishMs = 0;
unsigned long lastGpsRefreshMs = 0;
bool sim808Ready = false;

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

void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(SOIL_AO_PIN, INPUT);
  sim808.begin(SIM808_BAUD);

  Serial.println();
  Serial.println(F("POLI ESP8266 SIM808 soil-moisture MQTT publisher"));
  Serial.println(F("SIM808 must use external SIM808-safe power, not Wemos 3V3."));
  Serial.println(F("Soil moisture uses A0 percentage only; DO is ignored."));

  connectWiFi();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  setupSim808Gps();
}

void loop() {
  ensureWiFi();
  ensureMqtt();
  mqttClient.loop();

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

void connectWiFi() {
  Serial.print(F("Connecting WiFi: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(WIFI_RETRY_DELAY_MS);
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
    delay(WIFI_RETRY_DELAY_MS);
    Serial.print('.');
    yield();
  }

  Serial.println();
  Serial.println(F("WiFi reconnected."));
}

void ensureMqtt() {
  while (!mqttClient.connected()) {
    Serial.print(F("Connecting MQTT... "));

    String clientId = "poli-wemos-";
    clientId += String(ESP.getChipId(), HEX);
    clientId += "-";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(F("connected."));
    } else {
      Serial.print(F("failed, rc="));
      Serial.print(mqttClient.state());
      Serial.println(F(". Retrying..."));
      delay(MQTT_RETRY_DELAY_MS);
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
  int soilPercent = readSoilMoisturePercent();
  String timestamp = gps.timestamp != "-" ? gps.timestamp : uptimeTimestamp();

  char sensorPayload[180];
  snprintf(
    sensorPayload,
    sizeof(sensorPayload),
    "{\"device_id\":\"%s\",\"timestamp\":\"%s\",\"hum_soil\":%d}",
    DEVICE_ID,
    timestamp.c_str(),
    soilPercent
  );

  mqttClient.publish(MQTT_TOPIC_SENSORS, sensorPayload);
  Serial.print(F("Published sensors: "));
  Serial.println(sensorPayload);

  if (gps.hasFix) {
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

    mqttClient.publish(MQTT_TOPIC_GPS, gpsPayload);
    Serial.print(F("Published GPS: "));
    Serial.println(gpsPayload);
  } else {
    Serial.print(F("GPS not fixed yet. Status: "));
    Serial.println(gps.fixStatus);
  }
}

int readSoilMoisturePercent() {
  int raw = analogRead(SOIL_AO_PIN);

  int percent = map(raw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100);
  percent = constrain(percent, 0, 100);

  Serial.print(F("Soil raw A0="));
  Serial.print(raw);
  Serial.print(F(" -> "));
  Serial.print(percent);
  Serial.println(F("%"));

  return percent;
}

String sendCommand(const char *command, unsigned long timeoutMs) {
  while (sim808.available()) sim808.read();

  Serial.print(F("SIM808 >> "));
  Serial.println(command);

  sim808.println(command);

  String response = "";
  unsigned long start = millis();

  while (millis() - start < timeoutMs) {
    while (sim808.available()) {
      response += char(sim808.read());
    }
    yield();
  }

  Serial.print(F("SIM808 << "));
  if (response.length() == 0) {
    Serial.println(F("(no response)"));
  } else {
    Serial.println(response);
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
