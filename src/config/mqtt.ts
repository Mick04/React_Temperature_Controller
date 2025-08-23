// Configuration for MQTT connection to HiveMQ Cloud
export const mqttConfig = {
  brokerUrl:
    "wss://ea53fbd1c1a54682b81526905851077b.s1.eu.hivemq.cloud:8884/mqtt",
  username: "ESP32FireBaseTortoise", // Replace with your HiveMQ credentials
  password: "ESP32FireBaseHea1951Ter", // Replace with your HiveMQ credentials
  clientId: `react_dashboard_${Math.random().toString(16).substr(2, 8)}`,
  // Add additional connection options for better reliability
  options: {
    keepalive: 60,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    rejectUnauthorized: true,
  },
};

// MQTT Topics matching your ESP32 configuration
export const mqttTopics = {
  // Sensor data topics
  temperatureRed: "esp32/sensors/temperature/red",
  temperatureBlue: "esp32/sensors/temperature/blue",
  temperatureGreen: "esp32/sensors/temperature/green",
  heaterStatus: "esp32/system/heaterStatus",

  // Control topics
  targetTemperature: "esp32/control/targetTemperature",
  controlMode: "esp32/control/mode",

  // System status
  systemStatus: "esp32/system/status",
};
