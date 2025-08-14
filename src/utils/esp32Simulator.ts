// ESP32 System Data Simulator
// This simulates what a real ESP32 should send to Firebase /system path

export const generateESP32SystemData = () => {
  return {
    // System status
    status: "online",

    // Network information
    wifi: {
      status: "CONNECTED",
      ssid: "YourWiFiNetwork",
      rssi: Math.floor(Math.random() * 30) - 80, // -80 to -50 dBm
      ip: "192.168.1.100",
    },

    // Firebase connection
    firebase: {
      status: "FB_CONNECTED",
      last_sync: Math.floor(Date.now() / 1000),
    },

    // MQTT connection
    mqtt: {
      status: "MQTT_STATE_CONNECTED",
      broker: "ea53fbd1c1a54682b81526905851077b.s1.eu.hivemq.cloud",
      last_message: Math.floor(Date.now() / 1000),
    },

    // System performance
    uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400), // Random uptime up to 24h
    free_heap: Math.floor(Math.random() * 100000) + 50000, // 50KB to 150KB
    total_heap: 327680, // Typical ESP32 heap size

    // Sensor status
    sensors: {
      red: { connected: true, last_reading: Math.floor(Date.now() / 1000) },
      blue: { connected: true, last_reading: Math.floor(Date.now() / 1000) },
      green: { connected: true, last_reading: Math.floor(Date.now() / 1000) },
    },

    // Heater status
    heater: {
      status: Math.random() > 0.5,
      target_temp: 22.5,
      current_temp: 21.8 + Math.random() * 2, // Simulate temperature fluctuation
      last_toggle:
        Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
    },

    // Timestamps
    last_update: Math.floor(Date.now() / 1000),
    boot_time:
      Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),

    // Version info
    firmware_version: "1.2.3",
    compile_date: "2024-08-14",

    // Error counts
    wifi_reconnects: Math.floor(Math.random() * 5),
    firebase_errors: Math.floor(Math.random() * 3),
    mqtt_reconnects: Math.floor(Math.random() * 2),
  };
};

// Simplified version that matches current SystemStatus interface
export const generateSimpleSystemData = () => {
  const baseTime = Math.floor(Date.now() / 1000);
  const uptimeSeconds = Math.floor(Math.random() * 86400); // 0 to 24 hours

  return {
    status: "online",
    uptime: uptimeSeconds,
    rssi: Math.floor(Math.random() * 30) - 80, // -80 to -50 dBm
    wifi: "CONNECTED",
    firebase: "FB_CONNECTED",
    mqtt: "MQTT_STATE_CONNECTED",
    heaterStatus: Math.random() > 0.5,
    last_update: baseTime,
    freeHeap: Math.floor(Math.random() * 100000) + 50000,
    totalHeap: 327680,
  };
};
