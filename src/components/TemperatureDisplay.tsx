import React from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import { Thermostat, ThermostatAuto, Whatshot } from "@mui/icons-material";
import type { SensorData } from "../types";

interface TemperatureDisplayProps {
  sensorData: SensorData | null;
  targetTemperature: number;
}

const TemperatureDisplay: React.FC<TemperatureDisplayProps> = ({
  sensorData,
  targetTemperature,
}) => {
  // Debug logging for target temperature
  console.log(
    "🌡️ TemperatureDisplay received targetTemperature:",
    targetTemperature
  );

  const formatTemperature = (temp: number | undefined | null): string => {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return "--°C";
    }
    return `${temp.toFixed(1)}°C`;
  };

  const getTemperatureColor = (
    temp: number | undefined | null,
    target: number
  ): string => {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return "#9e9e9e"; // Gray for invalid data
    }
    const diff = Math.abs(temp - target);
    if (diff <= 1) return "#4caf50"; // Green - within 1°C
    if (diff <= 3) return "#ff9800"; // Orange - within 3°C
    return "#f44336"; // Red - more than 3°C difference
  };

  const getHeaterStatusLabel = (status: boolean | string): string => {
    if (typeof status === "string") {
      switch (status) {
        case "ON":
          return "Heater ON";
        case "OFF":
          return "Heater OFF";
        case "ONE_ON":
          return "ONE Heater ON";
        case "BOTH_BLOWN":
          return "BOTH BLOWN";
        default:
          return "Unknown Status";
      }
    }
    // Legacy boolean support
    return status ? "Heater ON" : "Heater OFF";
  };

  const getHeaterStatusColor = (status: boolean | string): string => {
    if (typeof status === "string") {
      switch (status) {
        case "ON":
          return "#00E100"; // Green
        case "OFF":
          return "#f44336"; // Red
        case "ONE_ON":
          return "#d7e023ff"; // Bright Orange
        case "BOTH_BLOWN":
          return "#2196F3"; // Blue
        default:
          return "#9e9e9e"; // Gray for unknown
      }
    }
    // Legacy boolean support
    return status ? "#00E100" : "#f44336";
  };

  if (!sensorData) {
    return (
      <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Temperature Monitoring
        </Typography>
        <Typography color="text.secondary">No sensor data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Thermostat sx={{ mr: 1 }} />
        <Typography variant="h6">Temperature Monitoring</Typography>
        <Box ml="auto">
          <Chip
            label={getHeaterStatusLabel(sensorData.heaterStatus)}
            color="default"
            icon={<Whatshot />}
            sx={{
              bgcolor: getHeaterStatusColor(sensorData.heaterStatus),
              color: "#ffffff",
              fontWeight: "bold",
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          "& > div": {
            flex: { xs: "1 0 100%", md: "1 0 calc(25% - 12px)" },
            minWidth: { xs: "100%", md: "200px" },
          },
        }}
      >
        {/* Red Sensor */}
        <Box textAlign="center" p={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Red Sensor
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: getTemperatureColor(
                sensorData.temperature.red,
                targetTemperature
              ),
              fontWeight: "bold",
            }}
          >
            {formatTemperature(sensorData.temperature.red)}
          </Typography>
        </Box>

        {/* Blue Sensor */}
        <Box textAlign="center" p={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Blue Sensor
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: getTemperatureColor(
                sensorData.temperature.blue,
                targetTemperature
              ),
              fontWeight: "bold",
            }}
          >
            {formatTemperature(sensorData.temperature.blue)}
          </Typography>
        </Box>

        {/* Green Sensor */}
        <Box textAlign="center" p={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Green Sensor
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: getTemperatureColor(
                sensorData.temperature.green,
                targetTemperature
              ),
              fontWeight: "bold",
            }}
          >
            {formatTemperature(sensorData.temperature.green)}
          </Typography>
        </Box>

        {/* Average Temperature */}
        <Box textAlign="center" p={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Average
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: getTemperatureColor(
                sensorData.temperature.average,
                targetTemperature
              ),
              fontWeight: "bold",
            }}
          >
            {formatTemperature(sensorData.temperature.average)}
          </Typography>
        </Box>
      </Box>

      {/* Target Temperature */}
      <Box mt={3} p={2} bgcolor="background.default" borderRadius={1}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <ThermostatAuto sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ mr: 2 }}>
            Target:
          </Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {formatTemperature(targetTemperature)}
          </Typography>
        </Box>
      </Box>

      {/* Additional Info */}
      <Box mt={2} display="flex" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          Current: {formatTemperature(sensorData.current)}A
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last Update:{" "}
          {new Date(sensorData.timestamp * 1000).toLocaleTimeString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default TemperatureDisplay;
