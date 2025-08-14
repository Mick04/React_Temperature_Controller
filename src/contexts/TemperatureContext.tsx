import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import MQTTManager from "../services/MQTTManager";
import { mqttConfig } from "../config/mqtt";
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

  useEffect(() => {
    console.log("Initializing MQTT connection for temperature data...");
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
