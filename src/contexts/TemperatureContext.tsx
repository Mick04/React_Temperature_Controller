import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Load initial temperature values from Firebase
  const loadInitialTemperatures = async () => {
    try {
      console.log("🔥 Loading initial temperatures from Firebase...");

      // Authenticate first
      await signInAnonymously_Custom();

      // Try to get temperature data from Firebase
      const tempRef = ref(database, "sensors");
      const snapshot = await get(tempRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("📊 Firebase temperature data:", data);

        // Extract temperature values - handle different possible structures
        let red = 0,
          blue = 0,
          green = 0;

        if (data.temperature_red !== undefined) {
          red = data.temperature_red;
          blue = data.temperature_blue || 0;
          green = data.temperature_green || 0;
        } else if (data.temperature) {
          red = data.temperature.red || 0;
          blue = data.temperature.blue || 0;
          green = data.temperature.green || 0;
        }

        const average = (red + blue + green) / 3;

        console.log(
          `🌡️ Initial temperatures - Red: ${red}°C, Blue: ${blue}°C, Green: ${green}°C, Average: ${average.toFixed(
            1
          )}°C`
        );

        setCurrentTemperatures({
          red,
          blue,
          green,
          average,
        });
      } else {
        console.log("📭 No temperature data found in Firebase sensors path");

        // Try alternative path at root level
        const rootRef = ref(database, "/");
        const rootSnapshot = await get(rootRef);

        if (rootSnapshot.exists()) {
          const rootData = rootSnapshot.val();
          console.log(
            "📊 Checking root Firebase data for temperatures:",
            rootData
          );

          let red = 0,
            blue = 0,
            green = 0;

          if (rootData.temperature_red !== undefined) {
            red = rootData.temperature_red;
            blue = rootData.temperature_blue || 0;
            green = rootData.temperature_green || 0;

            const average = (red + blue + green) / 3;

            console.log(
              `🌡️ Found temperatures at root - Red: ${red}°C, Blue: ${blue}°C, Green: ${green}°C, Average: ${average.toFixed(
                1
              )}°C`
            );

            setCurrentTemperatures({
              red,
              blue,
              green,
              average,
            });
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to load initial temperatures:", error);
    }
  };

  useEffect(() => {
    console.log("Initializing MQTT connection for temperature data...");

    // Load initial temperatures from Firebase first
    loadInitialTemperatures();

    const mqtt = new MQTTManager(mqttConfig);

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

  const value: TemperatureContextType = {
    currentTemperatures,
    historicalData,
    mqttConnected,
    heaterStatus,
    targetTemperature,
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
