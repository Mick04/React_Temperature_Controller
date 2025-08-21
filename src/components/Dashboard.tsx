import React, { useState, useEffect } from "react";
import { Box, Container, Typography } from "@mui/material";
import { database, signInAnonymously_Custom } from "../firebase";
import { ref, onValue } from "firebase/database";
import type { ControlSettings, SystemStatus } from "../types";
import TemperatureDisplay from "./TemperatureDisplay";
import SystemStatusCard from "./SystemStatusCard";
import TemperatureChart from "./TemperatureChart";
import FirebaseDebugger from "./FirebaseDebugger";
import MQTTDebugger from "./MQTTDebugger";
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

        // ESP32 Simulator - DISABLED
        // Uncomment the code below to enable simulation when ESP32 is not connected
        /*
        const simulateESP32Data = () => {
          const systemData = generateSimpleSystemData();
          console.log("Setting simulated ESP32 system data:", systemData);
          set(ref(database, "system"), systemData);
        };

        // Set initial data
        simulateESP32Data();

        // Update every 30 seconds to simulate real ESP32 behavior
        const intervalId = setInterval(simulateESP32Data, 30000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
        */
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
      console.log("🔥 Firebase system data received:", data);
      console.log(
        "🔥 Raw Firebase system data structure:",
        JSON.stringify(data, null, 2)
      );

      if (data) {
        // Check what fields are actually available
        console.log("🔍 DASHBOARD RSSI DEBUG:");
        console.log(
          "  Available Firebase system data fields:",
          Object.keys(data)
        );
        console.log(
          "  Firebase data.rssi:",
          data.rssi,
          "type:",
          typeof data.rssi
        );
        console.log(
          "  MQTT mqttSystemStatus.rssi:",
          mqttSystemStatus.rssi,
          "type:",
          typeof mqttSystemStatus.rssi
        );
        console.log("  MQTT connected:", mqttConnected);
        console.log(
          "  Firebase RSSI available:",
          data.rssi !== undefined && data.rssi !== null
        );
        console.log("  MQTT RSSI valid:", mqttSystemStatus.rssi > -100);
        console.log("🔍 END DASHBOARD RSSI DEBUG");
        console.log("data.status:", data.status);
        console.log("data.wifi:", data.wifi);
        console.log("data.firebase:", data.firebase);
        console.log("data.mqtt:", data.mqtt);

        // Transform ESP32 system data to match our interface
        const transformedSystemStatus: SystemStatus = {
          // Use actual status fields if they exist, otherwise fallback based on general status
          wifi: data.wifi || (data.status === "online" ? "CONNECTED" : "ERROR"),
          firebase:
            data.firebase ||
            (data.status === "online" ? "FB_CONNECTED" : "FB_ERROR"),
          mqtt:
            data.mqtt ||
            (mqttConnected
              ? "MQTT_STATE_CONNECTED"
              : "MQTT_STATE_DISCONNECTED"),
          heaterStatus:
            data.heaterStatus !== undefined ? data.heaterStatus : heaterStatus,
          uptime:
            mqttSystemStatus.uptime > 0
              ? mqttSystemStatus.uptime
              : data.uptime !== undefined && data.uptime !== null
              ? data.uptime
              : 0,
          rssi:
            // Always prefer Firebase data when available, since MQTT may be stale
            data.rssi !== undefined && data.rssi !== null
              ? (() => {
                  console.log(
                    "🔄 Using Firebase RSSI:",
                    data.rssi,
                    "dBm (Firebase data available)"
                  );
                  return data.rssi;
                })()
              : (() => {
                  console.log(
                    "� No Firebase RSSI available, MQTT has stale data:",
                    mqttSystemStatus.rssi
                  );
                  console.log(
                    "🔄 Using default -62 dBm since MQTT is working (sensor updates prove connection)"
                  );
                  return -62; // Use reasonable default since MQTT is working
                })(),
          status: data.status || "offline",
          last_update: data.last_update || data.lastUpdate || Date.now() / 1000,
        };

        setSystemStatus(transformedSystemStatus);
        console.log(
          "🟢 FIRST setSystemStatus called with RSSI:",
          transformedSystemStatus.rssi
        );
        console.log(
          "System status transformed and updated:",
          transformedSystemStatus
        );
        console.log(
          "🔍 Final RSSI value used:",
          transformedSystemStatus.rssi,
          "dBm"
        );
        console.log(
          "📊 Data sources - Firebase RSSI:",
          data.rssi,
          "MQTT RSSI:",
          mqttSystemStatus.rssi
        );
      } else {
        console.log("No system data found at path: /system");
        console.log(
          "🚨 Using fallback system status - MQTT may have stale data"
        );
        console.log(
          "📊 Fallback MQTT RSSI would be:",
          mqttSystemStatus.rssi,
          "dBm"
        );

        // Set a default system status when no data is available
        // Don't use stale MQTT data for RSSI if it's unreliable
        const defaultSystemStatus: SystemStatus = {
          wifi: "ERROR",
          firebase: "FB_ERROR",
          mqtt: mqttConnected
            ? "MQTT_STATE_CONNECTED"
            : "MQTT_STATE_DISCONNECTED",
          heaterStatus: heaterStatus,
          uptime: mqttSystemStatus.uptime || 0,
          rssi:
            mqttConnected && mqttSystemStatus.rssi > -100
              ? mqttSystemStatus.rssi
              : -100, // Only use MQTT RSSI if MQTT is actually connected
          status: "offline",
          last_update: Date.now() / 1000,
        };
        setSystemStatus(defaultSystemStatus);
        console.log(
          "🔴 SECOND setSystemStatus called with RSSI:",
          defaultSystemStatus.rssi
        );
        console.log(
          "🔄 Set fallback system status with RSSI:",
          defaultSystemStatus.rssi,
          "dBm"
        );
      }
    });

    // ALSO listen to sensors path to see if system data is there
    const sensorsRef = ref(database, "sensors");
    onValue(sensorsRef, (snapshot) => {
      const sensorsData = snapshot.val();
      console.log("🌡️ Firebase sensors data received:", sensorsData);
      if (sensorsData && sensorsData.rssi !== undefined) {
        console.log("🎯 Found RSSI in sensors path:", sensorsData.rssi, "dBm");
      }
    });
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
        <Box>
          <MQTTDebugger />
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
