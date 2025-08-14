import React from "react";
import {
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Router,
  RouterOutlined,
  ExpandMore,
} from "@mui/icons-material";
import type { SystemStatus } from "../types";

interface SystemStatusCardProps {
  systemStatus: SystemStatus | null;
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  systemStatus,
}) => {
  // Handle null systemStatus
  if (!systemStatus) {
    return (
      <Paper elevation={3} sx={{ p: 3, height: "fit-content" }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading system status...
        </Typography>
      </Paper>
    );
  }
  const getConnectionIcon = (
    status: string | undefined,
    connected: boolean
  ) => {
    if (!status) return <WifiOff color="error" />;

    if (status.includes("wifi") || status.includes("WIFI")) {
      return connected ? <Wifi color="success" /> : <WifiOff color="error" />;
    }
    if (status.includes("firebase") || status.includes("FB")) {
      return connected ? <Cloud color="success" /> : <CloudOff color="error" />;
    }
    if (status.includes("mqtt") || status.includes("MQTT")) {
      return connected ? (
        <Router color="success" />
      ) : (
        <RouterOutlined color="error" />
      );
    }
    return null;
  };

  const getStatusColor = (
    status: string | undefined
  ): "success" | "warning" | "error" => {
    if (!status) return "error";

    if (status.includes("CONNECTED") || status.includes("online"))
      return "success";
    if (status.includes("CONNECTING")) return "warning";
    return "error";
  };

  const formatUptime = (uptime: number | undefined): string => {
    if (uptime === undefined || uptime === null || isNaN(uptime)) {
      return "0h 0m";
    }
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getRSSIQuality = (
    rssi: number | undefined
  ): { label: string; color: "success" | "warning" | "error" } => {
    if (rssi === undefined || rssi === null || isNaN(rssi)) {
      return { label: "Unknown", color: "error" };
    }
    if (rssi > -50) return { label: "Excellent", color: "success" };
    if (rssi > -60) return { label: "Good", color: "success" };
    if (rssi > -70) return { label: "Fair", color: "warning" };
    return { label: "Poor", color: "error" };
  };

  const rssiQuality = getRSSIQuality(systemStatus.rssi);

  return (
    <Paper elevation={3} sx={{ p: 3, height: "fit-content" }}>
      <Typography variant="h6" gutterBottom>
        System Status
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          {getConnectionIcon("wifi", systemStatus.wifi === "CONNECTED")}
          <Typography variant="body2" sx={{ ml: 1, mr: 2 }}>
            WiFi:
          </Typography>
          <Chip
            label={systemStatus.wifi}
            color={getStatusColor(systemStatus.wifi)}
            size="small"
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          {getConnectionIcon(
            "firebase",
            systemStatus.firebase === "FB_CONNECTED"
          )}
          <Typography variant="body2" sx={{ ml: 1, mr: 2 }}>
            Firebase:
          </Typography>
          <Chip
            label={
              systemStatus.firebase
                ? systemStatus.firebase.replace("FB_", "")
                : "UNKNOWN"
            }
            color={getStatusColor(systemStatus.firebase)}
            size="small"
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          {getConnectionIcon(
            "mqtt",
            systemStatus.mqtt === "MQTT_STATE_CONNECTED"
          )}
          <Typography variant="body2" sx={{ ml: 1, mr: 2 }}>
            MQTT:
          </Typography>
          <Chip
            label={
              systemStatus.mqtt
                ? systemStatus.mqtt.replace("MQTT_STATE_", "")
                : "UNKNOWN"
            }
            color={getStatusColor(systemStatus.mqtt)}
            size="small"
          />
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Signal Strength: {systemStatus.rssi || "Unknown"} dBm
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.max(
              0,
              Math.min(100, ((systemStatus.rssi || -100) + 100) * 2)
            )}
            color={rssiQuality.color}
            sx={{ flexGrow: 1, mr: 1 }}
          />
          <Chip
            label={rssiQuality.label}
            color={rssiQuality.color}
            size="small"
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Uptime: {formatUptime(systemStatus.uptime)}
        </Typography>
        <Chip
          label={systemStatus.heaterStatus ? "HEATING" : "IDLE"}
          color={systemStatus.heaterStatus ? "warning" : "default"}
          size="small"
        />
      </Box>

      {/* Debug Section */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="body2" color="text.secondary">
            Debug Info
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="caption"
              component="pre"
              sx={{ fontSize: "0.7rem", fontFamily: "monospace" }}
            >
              {JSON.stringify(systemStatus, null, 2)}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default SystemStatusCard;
