import React, { useState, useEffect } from "react";
import { Box, Container, Typography } from "@mui/material";
import { database, signInAnonymously_Custom } from "../firebase";
import { ref, onValue, set } from "firebase/database";
import type { ControlSettings, SystemStatus } from "../types";
import TemperatureDisplay from "./TemperatureDisplay";
import HeaterControl from "./HeaterControl";
import SystemStatusCard from "./SystemStatusCard";
import TemperatureChart from "./TemperatureChart";
import { useTemperature } from "../contexts/TemperatureContext";

const Dashboard: React.FC = () => {
  const { currentTemperatures, mqttConnected, heaterStatus } = useTemperature();
  const [controlSettings, setControlSettings] =
    useState<ControlSettings | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Firebase connection
    const initializeFirebase = async () => {
      try {
        await signInAnonymously_Custom();
        console.log("Firebase authenticated successfully");

        // Set up real-time listeners
        setupRealtimeListeners();
      } catch (error) {
        console.error("Firebase authentication failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeFirebase();
  }, []); // Empty dependency array to run only once

  const setupRealtimeListeners = () => {
    // Only listen to control settings and system status, not sensor data (that comes from MQTT)

    // Listen to control settings
    const controlRef = ref(database, "control");
    onValue(controlRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase control data received:", data);
      if (data) {
        setControlSettings(data);
        console.log("Control settings updated:", data);
      } else {
        console.log("No control data found at path: /control");
      }
    });

    // Listen to system status
    const systemRef = ref(database, "system");
    onValue(systemRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase system data received:", data);
      if (data) {
        // Transform ESP32 system data to match our interface
        const transformedSystemStatus: SystemStatus = {
          wifi: data.status === "online" ? "CONNECTED" : "ERROR",
          firebase: data.status === "online" ? "FB_CONNECTED" : "FB_ERROR",
          mqtt: mqttConnected
            ? "MQTT_STATE_CONNECTED"
            : "MQTT_STATE_DISCONNECTED",
          heaterStatus: heaterStatus,
          uptime: data.uptime || 0,
          rssi: data.rssi || -70,
          status: data.status || "offline",
          last_update: data.last_update || Date.now() / 1000,
        };

        setSystemStatus(transformedSystemStatus);
        console.log(
          "System status transformed and updated:",
          transformedSystemStatus
        );
      } else {
        console.log("No system data found at path: /system");
      }
    });
  };

  // Control updates
  const updateControlSettings = async (settings: ControlSettings) => {
    try {
      await set(ref(database, "control"), settings);
      setControlSettings(settings);
    } catch (error) {
      console.error("Error updating control settings:", error);
    }
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
            targetTemperature={controlSettings?.target_temperature || 20}
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

          {/* Heater Control */}
          <Box sx={{ flex: { md: "1 0 60%" } }}>
            {controlSettings && (
              <HeaterControl
                controlSettings={controlSettings}
                onControlChange={updateControlSettings}
              />
            )}
          </Box>
        </Box>

        {/* Temperature Chart */}
        <Box>
          <TemperatureChart />
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
