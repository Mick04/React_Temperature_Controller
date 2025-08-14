# ESP32 MQTT Schedule Integration Guide

## Overview

The React Temperature Controller now publishes schedule settings to MQTT topics that your ESP32 should subscribe to for automatic temperature scheduling.

## MQTT Topics for Schedule Control

### Main Schedule Data

- **Topic**: `esp32/control/schedule`
- **Format**: JSON string
- **Example**:

```json
{
  "amEnabled": true,
  "amHours": 6,
  "amMinutes": 30,
  "amTemperature": 22.5,
  "pmEnabled": true,
  "pmHours": 18,
  "pmMinutes": 0,
  "pmTemperature": 20.0,
  "defaultTemperature": 21.0
}
```

### Individual Schedule Components (for easier parsing)

#### Morning Schedule

- `esp32/control/schedule/am/enabled` → `"true"` or `"false"`
- `esp32/control/schedule/am/time` → `"06:30"` (HH:MM format)
- `esp32/control/schedule/am/temperature` → `"22.5"`

#### Evening Schedule

- `esp32/control/schedule/pm/enabled` → `"true"` or `"false"`
- `esp32/control/schedule/pm/time` → `"18:00"` (HH:MM format)
- `esp32/control/schedule/pm/temperature` → `"20.0"`

#### Default Temperature

- `esp32/control/schedule/default` → `"21.0"`

## Firebase Storage

Schedule settings are also stored in Firebase at `/schedule` path with the same JSON structure for persistence and web app synchronization.

## ESP32 Implementation Suggestions

### 1. MQTT Subscription Setup

```cpp
void setupMQTT() {
  // Subscribe to schedule topics
  mqttClient.subscribe("esp32/control/schedule");
  mqttClient.subscribe("esp32/control/schedule/am/enabled");
  mqttClient.subscribe("esp32/control/schedule/am/time");
  mqttClient.subscribe("esp32/control/schedule/am/temperature");
  mqttClient.subscribe("esp32/control/schedule/pm/enabled");
  mqttClient.subscribe("esp32/control/schedule/pm/time");
  mqttClient.subscribe("esp32/control/schedule/pm/temperature");
  mqttClient.subscribe("esp32/control/schedule/default");
}
```

### 2. Schedule Data Structure

```cpp
struct ScheduleSettings {
  bool amEnabled = false;
  int amHours = 6;
  int amMinutes = 0;
  float amTemperature = 22.0;

  bool pmEnabled = false;
  int pmHours = 18;
  int pmMinutes = 0;
  float pmTemperature = 20.0;

  float defaultTemperature = 21.0;
};

ScheduleSettings schedule;
```

### 3. Schedule Logic

```cpp
float getCurrentTargetTemperature() {
  time_t now;
  struct tm timeinfo;
  time(&now);
  localtime_r(&now, &timeinfo);

  int currentMinutes = timeinfo.tm_hour * 60 + timeinfo.tm_min;

  // Check AM schedule
  if (schedule.amEnabled) {
    int amMinutes = schedule.amHours * 60 + schedule.amMinutes;
    if (currentMinutes >= amMinutes &&
        (!schedule.pmEnabled || currentMinutes < (schedule.pmHours * 60 + schedule.pmMinutes))) {
      return schedule.amTemperature;
    }
  }

  // Check PM schedule
  if (schedule.pmEnabled) {
    int pmMinutes = schedule.pmHours * 60 + schedule.pmMinutes;
    if (currentMinutes >= pmMinutes ||
        (schedule.amEnabled && currentMinutes < (schedule.amHours * 60 + schedule.amMinutes))) {
      return schedule.pmTemperature;
    }
  }

  // Default temperature
  return schedule.defaultTemperature;
}
```

### 4. NVS Storage (for persistence across reboots)

```cpp
void saveScheduleToNVS() {
  nvs_handle_t nvs_handle;
  esp_err_t err = nvs_open("schedule", NVS_READWRITE, &nvs_handle);
  if (err == ESP_OK) {
    nvs_set_blob(nvs_handle, "settings", &schedule, sizeof(schedule));
    nvs_commit(nvs_handle);
    nvs_close(nvs_handle);
  }
}

void loadScheduleFromNVS() {
  nvs_handle_t nvs_handle;
  esp_err_t err = nvs_open("schedule", NVS_READONLY, &nvs_handle);
  if (err == ESP_OK) {
    size_t required_size = sizeof(schedule);
    nvs_get_blob(nvs_handle, "settings", &schedule, &required_size);
    nvs_close(nvs_handle);
  }
}
```

## Web App Features

### Settings Page

- ✅ Enable/disable AM and PM schedules independently
- ✅ Set time (hours and minutes) for each schedule
- ✅ Set target temperature for each schedule
- ✅ Set default temperature when no schedule is active
- ✅ Visual indicators showing current schedule settings
- ✅ Real-time publishing to MQTT and Firebase

### Schedule Display

- Morning schedule: Blue theme with clock icon
- Evening schedule: Orange theme with clock icon
- Visual chips showing "HH:MM → XX.X°C" when enabled
- Enable/disable switches for each schedule

### Data Flow

1. User configures schedule in Settings page
2. Settings saved to Firebase `/schedule` path
3. Settings published to MQTT topics
4. ESP32 receives MQTT messages and updates internal schedule
5. ESP32 saves schedule to NVS for persistence
6. ESP32 uses schedule to automatically adjust target temperature based on current time

## Testing

1. Go to Settings tab in the web app
2. Enable AM schedule (e.g., 06:30 → 22°C)
3. Enable PM schedule (e.g., 18:00 → 20°C)
4. Set default temperature (e.g., 21°C)
5. Click "Save Schedule"
6. Check MQTT broker for published messages
7. Verify ESP32 receives and processes the schedule data
