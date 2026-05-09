#include <WiFi.h>
#include <PubSubClient.h>

// --- KONFIGURASI WIFI ---
const char* ssid = "NAMA_WIFI_MU";
const char* password = "PASSWORD_WIFI_MU";

// --- KONFIGURASI EMQX BROKER ---
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;

// --- KONFIGURASI TOPIC ---
const char* topic_sensors = "hackviet/data/sensors";
const char* topic_gps     = "hackviet/data/gps";

// --- VARIABEL GLOBAL ---
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMqttPublish = 0;
const long mqttPublishInterval = 10000; // Publish setiap 10 detik

// Variabel Dummy/Simulasi (Ganti dengan pembacaan sensor aslimu)
String timestamp = "2026-05-07 13:54:48";
float temp_air = 27.184309;
float hum_air  = 66.182939;
float hum_soil = 51.967465;
float ph_soil  = 6.829253;
double latitude = -6.200034063191745;
double longitude = 106.81676662104249;

// --- FUNGSI WIFI ---
void setup_wifi() {
  delay(10);
  Serial.begin(115200);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// --- FUNGSI RECONNECT MQTT ---
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Membuat ID Client Unik agar tidak bentrok di broker publik
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected to EMQX");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Publish MQTT setiap mqttPublishInterval
  if (millis() - lastMqttPublish >= mqttPublishInterval) {
    
    // 1. Membangun Payload Data SENSORS secara manual
    String payloadSensors = "{";
    payloadSensors += "\"timestamp\":\"" + timestamp + "\",";
    payloadSensors += "\"temp_air\":" + String(temp_air, 6) + ",";
    payloadSensors += "\"hum_air\":" + String(hum_air, 6) + ",";
    payloadSensors += "\"hum_soil\":" + String(hum_soil, 6) + ",";
    payloadSensors += "\"ph_soil\":" + String(ph_soil, 6);
    payloadSensors += "}";

    // 2. Membangun Payload Data GPS secara manual
    String payloadGps = "{";
    payloadGps += "\"timestamp\":\"" + timestamp + "\",";
    payloadGps += "\"lat\":" + String(latitude, 14) + ",";
    payloadGps += "\"long\":" + String(longitude, 14);
    payloadGps += "}";

    // Eksekusi Publish jika terkoneksi
    if (client.connected()) {
      // Publish ke topic Sensors
      client.publish(topic_sensors, payloadSensors.c_str());
      Serial.print("Published Sensors: ");
      Serial.println(payloadSensors);

      // Publish ke topic GPS
      client.publish(topic_gps, payloadGps.c_str());
      Serial.print("Published GPS: ");
      Serial.println(payloadGps);
    }

    lastMqttPublish = millis();

    // --- Opsional: Update data dummy agar terlihat berubah di serial monitor ---
    temp_air += 0.1;
    latitude += 0.0001;
  }
}