# Copilot Instructions for ESP32 Temperature Controller React Dashboard

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a React TypeScript web application that serves as a dashboard for an ESP32-based temperature controller system. The application integrates with Firebase Realtime Database and uses MQTT for real-time communication with the ESP32 device.

## Technology Stack

- React 18 with TypeScript
- Vite for build tooling
- Material-UI (MUI) for UI components
- Firebase for data storage and real-time updates
- MQTT for real-time device communication
- Recharts for data visualization

## Key Features

- Real-time temperature monitoring from multiple sensors (red, blue, green)
- Heater control with manual and scheduled modes
- Temperature scheduling (AM/PM schedules)
- Historical data visualization with charts
- System status monitoring (WiFi, Firebase, MQTT, heater status)
- Responsive design for desktop and mobile

## Firebase Integration

- Database URL: `https://esp32-heater-controler-6d11f-default-rtdb.europe-west1.firebasedatabase.app/`
- Uses anonymous authentication
- Real-time data paths:
  - `/sensors/` - temperature readings and sensor data
  - `/control/` - heater control settings and target temperatures
  - `/system/` - system status and timestamps

## MQTT Configuration

- Broker: HiveMQ Cloud (`ea53fbd1c1a54682b81526905851077b.s1.eu.hivemq.cloud`)
- Topics:
  - `esp32/sensors/temperature/red` - Red sensor temperature
  - `esp32/sensors/temperature/blue` - Blue sensor temperature
  - `esp32/sensors/temperature/green` - Green sensor temperature
  - `esp32/sensors/heaterStatus` - Heater on/off status
  - `esp32/control/targetTemperature` - Target temperature control

## Code Style Guidelines

- Use TypeScript for all components and utilities
- Follow React functional components with hooks
- Use Material-UI components consistently
- Implement proper error handling for Firebase and MQTT connections
- Use meaningful component and variable names
- Add proper TypeScript interfaces for data structures

## Development Notes

- The ESP32 system saves data to NVS for power outage recovery
- All timestamps should be Unix timestamps (seconds since epoch)
- Temperature ranges are validated (5°C to 50°C)
- Time schedules use 24-hour format (0-23 hours, 0-59 minutes)
- System supports both manual control and automatic scheduling
