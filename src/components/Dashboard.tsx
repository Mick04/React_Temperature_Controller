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

  // Firebase status polling interval (ms)
  const STATUS_POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Helper to fetch ESP32 status from Firebase (correct path)
    const fetchEsp32Status = async () => {
      try {
        const statusRef = ref(database, "ESP32/control/wifi");
        const snapshot = await import("firebase/database").then((m) =>
          m.get(statusRef)
        );
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("[POLL] ESP32/control/wifi from Firebase:", data);
          if (isMounted && data) {
            setSystemStatus({
              wifi: data.wifi || "Unknown",
              rssi:
                typeof data.rssi === "number" && !isNaN(data.rssi)
                  ? data.rssi
                  : -100,
              status: data.status || "offline",
              last_update:
                data.lastUpdated !== undefined
                  ? Number(data.lastUpdated)
                  : Date.now() / 1000,
              firebase: data.firebase_status || "FB_ERROR",
              mqtt: data.mqtt_status || "MQTT_STATE_DISCONNECTED",
              heaterStatus:
                typeof data.heaterStatus === "boolean"
                  ? data.heaterStatus
                  : false,
              uptime: typeof data.uptime === "number" ? data.uptime : 0,
            });
          }
        }
      } catch (err) {
        console.error("[POLL] Failed to fetch ESP32/control/wifi:", err);
      }
    };

    // Authenticate and set up listeners
    const initializeFirebase = async () => {
      try {
        await signInAnonymously_Custom();
        console.log("Firebase authenticated successfully");
        setupRealtimeListeners();
        // Start polling
        await fetchEsp32Status();
        pollInterval = setInterval(fetchEsp32Status, STATUS_POLL_INTERVAL);
        // Add onfocus event to fetch status when dashboard regains focus
        window.addEventListener("focus", fetchEsp32Status);
      } catch (error) {
        console.error("Firebase authentication failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeFirebase();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener("focus", fetchEsp32Status);
    };
  }, []);

  // Update system status when MQTT data changes

  // (Removed broken setSystemStatus block from MQTT useEffect)

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
