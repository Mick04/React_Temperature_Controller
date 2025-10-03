import React, { useState, useEffect } from "react";
import { Box, Container, Typography } from "@mui/material";
import { database, signInAnonymously_Custom } from "../firebase";
import { ref, onValue } from "firebase/database";
import type { ControlSettings, SystemStatus } from "../types";
import TemperatureDisplay from "./TemperatureDisplay";
import SystemStatusCard from "./SystemStatusCard";
import TemperatureChart from "./TemperatureChart";
import FirebaseDebugger from "./FirebaseDebugger";
// ...existing code...
import { useTemperature } from "../contexts/TemperatureContext";
// import { generateSimpleSystemData } from "../utils/esp32Simulator"; // Disabled - uncomment to enable simulation

const Dashboard: React.FC = () => {
  const {
    currentTemperatures,
    mqttConnected,
    heaterStatus,
    targetTemperature,
    systemStatus: mqttSystemStatus,
  } = useTemperature();
  //const [controlSettings, setControlSettings] =
  useState<ControlSettings | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple Firebase authentication for temperature data only
    const initializeFirebase = async () => {
      try {
        await signInAnonymously_Custom();
        console.log("Firebase authenticated successfully for temperature data");
        setupRealtimeListeners();
      } catch (error) {
        console.error("Firebase authentication failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeFirebase();
  }, []);

  // Use MQTT system status directly (no Firebase polling/merging)
  useEffect(() => {
    if (mqttSystemStatus) {
      console.log(`� Using MQTT-only system status:`, mqttSystemStatus);

      // Smart mapping from MQTT to SystemStatus format
      const systemStatus: SystemStatus = {
        // If status is explicitly "offline" (from Last Will), WiFi should be ERROR
        wifi:
          mqttSystemStatus.status?.toLowerCase() === "offline"
            ? "ERROR"
            : mqttSystemStatus.rssi && mqttSystemStatus.rssi > -100
            ? "CONNECTED"
            : mqttSystemStatus.wifi?.toLowerCase().includes("connected")
            ? "CONNECTED"
            : mqttSystemStatus.wifi?.toLowerCase().includes("connecting")
            ? "CONNECTING"
            : "ERROR",
        // If ESP32 is offline, Firebase connection from React app doesn't matter for ESP32 status
        firebase:
          mqttSystemStatus.status?.toLowerCase() === "offline"
            ? "FB_ERROR"
            : (mqttSystemStatus.firebase as any) || "FB_CONNECTED",
        mqtt: mqttConnected
          ? "MQTT_STATE_CONNECTED"
          : "MQTT_STATE_DISCONNECTED",
        heaterStatus: heaterStatus,
        uptime: mqttSystemStatus.uptime || 0,
        rssi: mqttSystemStatus.rssi || -100,
        // RESPECT the Last Will status - if it says offline, it's offline!
        status:
          mqttSystemStatus.status?.toLowerCase() === "offline"
            ? "offline"
            : "online",
        last_update: mqttSystemStatus.lastUpdate || Date.now() / 1000,
      };
      console.log("✅ Final MQTT-only system status:", systemStatus);
      setSystemStatus(systemStatus);
    }
  }, [mqttSystemStatus, mqttConnected, heaterStatus]);

  const setupRealtimeListeners = () => {
    // Only listen to control settings and system status, not sensor data (that comes from MQTT)

    // Listen to control settings
    const controlRef = ref(database, "control");
    onValue(controlRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase control data received:", data);
      if (data) {
        // setControlSettings(data);
        console.log("Control settings updated:", data);
      } else {
        console.log("No control data found at path: /control");
      }
    });

    // Listen to system status (DISABLED: see polling logic for status updates)
    // const systemRef = ref(database, "system");
    // onValue(systemRef, (snapshot) => {
    //   const data = snapshot.val();
    //   console.log("🔥 Firebase system data received:", data);
    //   console.log(
    //     "🔥 Raw Firebase system data structure:",
    //     JSON.stringify(data, null, 2)
    //   );
    //   if (data) {
    //     ...status extraction logic...
    //   } else {
    //     ...fallback logic...
    //   }
    // });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <Typography variant="h5">Connecting to ESP32 System...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Temperature Display */}
        <Box>
          <TemperatureDisplay
            sensorData={{
              temperature: {
                ...currentTemperatures,
                timestamp: Date.now() / 1000,
              },
              heaterStatus,
              timestamp: Date.now() / 1000,
              current: 0,
            }}
            targetTemperature={targetTemperature}
          />
        </Box>

        {/* Second Row - Status and Control */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          {/* System Status */}
          <Box sx={{ flex: { md: "1 0 40%" } }}>
            {systemStatus && <SystemStatusCard systemStatus={systemStatus} />}
          </Box>
          {/* Heater Control
          <Box sx={{ flex: { md: "1 0 60%" } }}>
            {controlSettings && (
              <HeaterControl
                controlSettings={controlSettings}
                onControlChange={updateControlSettings}
              />
            )}
          </Box> */}
        </Box>

        {/* Temperature Chart */}
        <Box>
          <TemperatureChart />
        </Box>

        {/* Firebase Debugger - for development */}
        <Box>
          <FirebaseDebugger />
        </Box>

        {/* MQTT Debugger - for development */}
        <Box>{/* MQTTDebugger removed */}</Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
