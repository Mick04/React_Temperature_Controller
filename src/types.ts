// TypeScript interfaces for ESP32 Temperature Controller data

export interface TemperatureData {
  red: number;
  blue: number;
  green: number;
  average: number;
  timestamp: number;
}

export interface SensorData {
  temperature: TemperatureData;
  current: number;
  heaterStatus: boolean | "ON" | "OFF" | "ONE_ON" | "BOTH_BLOWN";
  timestamp: number;
}

export interface ControlSettings {
  target_temperature: number;
  heater_enabled: boolean;
  temperature_tolerance: number;
  update_interval: number;
  control_mode: "auto" | "manual";
}

export interface ScheduleSettings {
  amEnabled: boolean;
  amScheduledTime: string; // Format: "HH:MM" (e.g., "07:00")
  amTemperature: number;
  pmEnabled: boolean;
  pmScheduledTime: string; // Format: "HH:MM" (e.g., "19:30")
  pmTemperature: number;
}

export interface SystemStatus {
  wifi: "CONNECTING" | "CONNECTED" | "ERROR";
  firebase: "FB_CONNECTING" | "FB_CONNECTED" | "FB_ERROR";
  mqtt:
    | "MQTT_STATE_DISCONNECTED"
    | "MQTT_STATE_CONNECTING"
    | "MQTT_STATE_CONNECTED"
    | "MQTT_STATE_ERROR";
  heaterStatus: boolean | "ON" | "OFF" | "ONE_ON" | "BOTH_BLOWN";
  uptime: number;
  rssi: number;
  status: "online" | "offline";
  last_update: number;
}

export interface HistoricalDataPoint {
  timestamp: number;
  temperature: {
    red: number;
    blue: number;
    green: number;
    average: number;
  };
  heaterStatus: boolean | "ON" | "OFF" | "ONE_ON" | "BOTH_BLOWN";
  targetTemperature: number;
}

export interface MQTTMessage {
  topic: string;
  message: string;
  timestamp: number;
}

export interface FirebaseData {
  sensors: SensorData;
  control: ControlSettings;
  system: SystemStatus;
  schedule?: ScheduleSettings;
}
