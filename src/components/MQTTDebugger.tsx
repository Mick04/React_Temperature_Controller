import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore, Refresh, Router } from "@mui/icons-material";
import { useTemperature } from "../contexts/TemperatureContext";
import MQTTManager from "../services/MQTTManager";
import { mqttConfig } from "../config/mqtt";

const MQTTDebugger: React.FC = () => {
  const { mqttConnected, systemStatus } = useTemperature();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [lastConnectionAttempt, setLastConnectionAttempt] =
    useState<Date | null>(null);

  const testMQTTConnection = async () => {
    setLastConnectionAttempt(new Date());

    const testMqtt = new MQTTManager(mqttConfig);

    const connectionPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          status: "timeout",
          message: "Connection timeout after 10 seconds",
        });
      }, 10000);

      testMqtt.connect({
        onConnectionStatus: (connected) => {
          clearTimeout(timeout);
          if (connected) {
            resolve({
              status: "success",
              message: "MQTT connected successfully",
            });
            setTimeout(() => testMqtt.disconnect(), 2000); // Disconnect after 2 seconds
          } else {
            resolve({ status: "failed", message: "MQTT connection failed" });
          }
        },
        onError: (error) => {
          clearTimeout(timeout);
          resolve({ status: "error", message: error.message });
        },
      });
    });

    const result = await connectionPromise;
    setDebugInfo(result);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Router sx={{ mr: 1 }} />
        <Typography variant="h6">MQTT Debug Information</Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2">Connection Status:</Typography>
          <Chip
            label={mqttConnected ? "CONNECTED" : "DISCONNECTED"}
            color={mqttConnected ? "success" : "error"}
            size="small"
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={testMQTTConnection}
          >
            Test Connection
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body2">
            <strong>Broker URL:</strong> {mqttConfig.brokerUrl}
          </Typography>
          <Typography variant="body2">
            <strong>Username:</strong>{" "}
            {mqttConfig.username ? "✅ Set" : "❌ Not Set"}
          </Typography>
          <Typography variant="body2">
            <strong>Password:</strong>{" "}
            {mqttConfig.password ? "✅ Set" : "❌ Not Set"}
          </Typography>
          <Typography variant="body2">
            <strong>System RSSI:</strong> {systemStatus.rssi} dBm
          </Typography>
          <Typography variant="body2">
            <strong>System Uptime:</strong>{" "}
            {Math.floor(systemStatus.uptime / 3600)}h{" "}
            {Math.floor((systemStatus.uptime % 3600) / 60)}m
          </Typography>
        </Box>

        {debugInfo.status && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>Last Test Result:</strong>
            </Typography>
            <Chip
              label={`${debugInfo.status.toUpperCase()}: ${debugInfo.message}`}
              color={debugInfo.status === "success" ? "success" : "error"}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        )}

        {lastConnectionAttempt && (
          <Typography variant="caption" color="text.secondary">
            Last test: {lastConnectionAttempt.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="body2">Full System Status</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography
            component="pre"
            variant="caption"
            sx={{ fontSize: "0.7rem", fontFamily: "monospace" }}
          >
            {JSON.stringify(systemStatus, null, 2)}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default MQTTDebugger;
