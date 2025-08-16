import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import MQTTManager from "../services/MQTTManager";
import { mqttConfig } from "../config/mqtt";
import { database, signInAnonymously_Custom } from "../firebase";
import { ref, get } from "firebase/database";
import type { HistoricalDataPoint } from "../types";

interface TemperatureContextType {
  currentTemperatures: {
    red: number;
    blue: number;
    green: number;
    average: number;
  };
  historicalData: HistoricalDataPoint[];
  mqttConnected: boolean;
  heaterStatus: boolean;
  targetTemperature: number;
  systemStatus: {
    rssi: number;
    uptime: number;
    wifi: string;
    lastUpdate: number;
  };
  // MQTT functions
  publishSchedule: (schedule: any) => boolean;
  testMqttConnection: () => Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }>;
}

const TemperatureContext = createContext<TemperatureContextType | undefined>(
  undefined
);

interface TemperatureProviderProps {
  children: ReactNode;
}

export const TemperatureProvider: React.FC<TemperatureProviderProps> = ({
  children,
}) => {
  const [currentTemperatures, setCurrentTemperatures] = useState({
    red: 0,
    blue: 0,
    green: 0,
    average: 0,
  });

  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    []
  );
  const [mqttConnected, setMqttConnected] = useState(false);
  const [heaterStatus, setHeaterStatus] = useState(false);
  const [targetTemperature] = useState(22);
  const [systemStatus, setSystemStatus] = useState({
    rssi: -100,
    uptime: 0,
    wifi: "Unknown",
    lastUpdate: 0,
  });

  // Store MQTT manager reference for sharing
  const mqttManagerRef = useRef<MQTTManager | null>(null);

  // Load initial temperature values from Firebase
  const loadInitialTemperatures = async () => {
    try {
      console.log("🔥 Loading initial temperatures from Firebase...");

      // Authenticate first
      await signInAnonymously_Custom();

      // Try multiple possible paths where temperature data might be stored
      const possiblePaths = [
        "/", // Root level
        "sensors", // Sensors path
        "data", // Data path
        "temperature", // Temperature path
        "system", // System path
      ];

      for (const path of possiblePaths) {
        try {
          console.log(`🔍 Checking Firebase path: ${path}`);
          const tempRef = ref(database, path);
          const snapshot = await get(tempRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log(
              `📊 Data found at ${path}:`,
              JSON.stringify(data, null, 2)
            );

            // Look for temperature data in various formats
            let red = 0,
              blue = 0,
              green = 0;
            let found = false;

            // Format 1: Direct temperature_red, temperature_blue, temperature_green
            if (data.temperature_red !== undefined) {
              red = Number(data.temperature_red);
              blue = Number(data.temperature_blue) || 0;
              green = Number(data.temperature_green) || 0;
              found = true;
              console.log(`✅ Found direct temperature format at ${path}`);
            }
            // Format 2: Nested under temperature object
            else if (data.temperature && typeof data.temperature === "object") {
              if (data.temperature.red !== undefined) {
                red = Number(data.temperature.red);
                blue = Number(data.temperature.blue) || 0;
                green = Number(data.temperature.green) || 0;
                found = true;
                console.log(
                  `✅ Found nested temperature.red format at ${path}`
                );
              }
            }
            // Format 3: Nested sensors object
            else if (data.sensors && typeof data.sensors === "object") {
              if (data.sensors.temperature_red !== undefined) {
                red = Number(data.sensors.temperature_red);
                blue = Number(data.sensors.temperature_blue) || 0;
                green = Number(data.sensors.temperature_green) || 0;
                found = true;
                console.log(
                  `✅ Found sensors.temperature_red format at ${path}`
                );
              }
            }

            if (found) {
              const average = (red + blue + green) / 3;

              console.log(
                `🌡️ Setting temperatures - Red: ${red}°C, Blue: ${blue}°C, Green: ${green}°C, Average: ${average.toFixed(
                  1
                )}°C`
              );

              setCurrentTemperatures({
                red,
                blue,
                green,
                average,
              });

              return; // Success, exit the loop
            }
          } else {
            console.log(`📭 No data at path: ${path}`);
          }
        } catch (error) {
          console.error(`❌ Error reading path ${path}:`, error);
        }
      }

      console.log("⚠️ No temperature data found in any Firebase path");
    } catch (error) {
      console.error("❌ Failed to load initial temperatures:", error);
    }
  };

  useEffect(() => {
    console.log("Initializing MQTT connection for temperature data...");

    // Load initial temperatures from Firebase first
    loadInitialTemperatures();

    const mqtt = new MQTTManager(mqttConfig);
    mqttManagerRef.current = mqtt; // Store reference for sharing

    mqtt.connect({
      onConnectionStatus: (connected) => {
        console.log("MQTT connection status:", connected);
        setMqttConnected(connected);
      },
      onTemperatureUpdate: (sensor, temperature) => {
        console.log(`MQTT temperature update - ${sensor}: ${temperature}°C`);

        setCurrentTemperatures((prev) => {
          const updated = {
            ...prev,
            [sensor]: temperature,
          };

          // Calculate average
          updated.average = (updated.red + updated.blue + updated.green) / 3;

          // Add to historical data
          const newDataPoint: HistoricalDataPoint = {
            timestamp: Date.now(),
            temperature: {
              red: updated.red,
              blue: updated.blue,
              green: updated.green,
              average: updated.average,
            },
            heaterStatus,
            targetTemperature,
          };

          setHistoricalData((prevHistory) => {
            const newHistory = [...prevHistory, newDataPoint];
            // Keep only last 500 data points to prevent memory issues
            return newHistory.slice(-500);
          });

          return updated;
        });
      },
      onHeaterStatusUpdate: (status) => {
        console.log("MQTT heater status update:", status);
        setHeaterStatus(status);
      },
      onSystemStatusUpdate: (statusData) => {
        console.log("MQTT system status update:", statusData);
        console.log("📡 MQTT RSSI received:", statusData.rssi, "dBm");
        setSystemStatus((prev) => ({
          ...prev,
          ...statusData,
          lastUpdate: Date.now() / 1000,
        }));
      },
      onError: (error) => {
        console.error("MQTT error:", error);
        setMqttConnected(false);
      },
    });

    // Cleanup on unmount
    return () => {
      console.log("Disconnecting MQTT on cleanup");
      mqtt.disconnect();
    };
  }, []);

  // Listen for target temperature changes (you can extend this to listen to MQTT topic)
  useEffect(() => {
    // You can add MQTT subscription for target temperature here if needed
    // For now, we'll keep it static but this can be extended
  }, []);

  // MQTT helper functions for Settings page
  const publishSchedule = (schedule: any): boolean => {
    if (!mqttManagerRef.current || !mqttConnected) {
      console.warn("MQTT not connected, cannot publish schedule");
      return false;
    }
    return mqttManagerRef.current.publishSchedule(schedule);
  };

  const testMqttConnection = async (): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> => {
    if (!mqttManagerRef.current) {
      return {
        success: false,
        error: "MQTT manager not initialized",
        details: { timestamp: new Date().toISOString() },
      };
    }
    return mqttManagerRef.current.testConnection();
  };

  const value: TemperatureContextType = {
    currentTemperatures,
    historicalData,
    mqttConnected,
    heaterStatus,
    targetTemperature,
    systemStatus,
    publishSchedule,
    testMqttConnection,
  };

  return (
    <TemperatureContext.Provider value={value}>
      {children}
    </TemperatureContext.Provider>
  );
};

export const useTemperature = () => {
  const context = useContext(TemperatureContext);
  if (context === undefined) {
    throw new Error("useTemperature must be used within a TemperatureProvider");
  }
  return context;
};
