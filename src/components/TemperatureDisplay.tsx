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
            label={sensorData.heaterStatus ? "Heater ON" : "Heater OFF"}
            color={sensorData.heaterStatus ? "error" : "default"}
            icon={<Whatshot />}
             sx={{
    bgcolor: sensorData.heaterStatus ? "#ff5722" : "#00E100", // orange for ON, green for OFF
    color: "#fff"
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
