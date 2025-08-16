import React from "react";
import { Paper, Typography, Box, Container } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { ThermostatOutlined, Wifi, WifiOff } from "@mui/icons-material";
import { useTemperature } from "../contexts/TemperatureContext";

const GreenChartPage: React.FC = () => {
  const { historicalData, currentTemperatures, mqttConnected } =
    useTemperature();

  // Use real MQTT data or fallback to sample data if no historical data yet
  const chartData =
    historicalData.length > 0
      ? historicalData
      : Array.from({ length: 50 }, (_, i) => ({
          timestamp: Date.now() - (50 - i) * 60000,
          temperature: {
            red: 20 + Math.random() * 5,
            blue: 20 + Math.random() * 5,
            green: 19 + Math.random() * 12 + Math.sin(i / 6) * 4,
            average: 20 + Math.random() * 5,
          },
          heaterStatus: Math.random() > 0.5,
          targetTemperature: 22,
        }));

  const timestamps = chartData.map((point) => new Date(point.timestamp));
  const greenTemps = chartData.map((point) => point.temperature.green);
  const targetTemps = chartData.map((point) => point.targetTemperature);

  // Calculate statistics - use current temp if available, otherwise last historical point
  const currentTemp =
    historicalData.length > 0
      ? currentTemperatures.green
      : greenTemps[greenTemps.length - 1] || 0;
  const maxTemp = Math.max(...greenTemps);
  const minTemp = Math.min(...greenTemps);
  const avgTemp =
    greenTemps.reduce((sum: number, temp: number) => sum + temp, 0) /
    greenTemps.length;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ThermostatOutlined sx={{ fontSize: 40, color: "#4caf50" }} />
            <Typography variant="h4" component="h1">
              Green Sensor Analysis
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {mqttConnected ? (
              <Wifi sx={{ color: "green" }} />
            ) : (
              <WifiOff sx={{ color: "red" }} />
            )}
            <Typography variant="body2" color={mqttConnected ? "green" : "red"}>
              {mqttConnected ? "MQTT Connected" : "MQTT Disconnected"}
            </Typography>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Paper elevation={2} sx={{ p: 2, minWidth: 120, flex: 1 }}>
            <Typography variant="h6" color="#4caf50" gutterBottom>
              Current
            </Typography>
            <Typography variant="h4">{currentTemp.toFixed(1)}°C</Typography>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, minWidth: 120, flex: 1 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Average
            </Typography>
            <Typography variant="h4">{avgTemp.toFixed(1)}°C</Typography>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, minWidth: 120, flex: 1 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Maximum
            </Typography>
            <Typography variant="h4">{maxTemp.toFixed(1)}°C</Typography>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, minWidth: 120, flex: 1 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Minimum
            </Typography>
            <Typography variant="h4">{minTemp.toFixed(1)}°C</Typography>
          </Paper>
        </Box>

        {/* Main Chart */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ color: "#4caf50" }}>
            Green Sensor Temperature History
          </Typography>

          <Box sx={{ height: "500px", width: "100%" }}>
            <LineChart
              width={undefined}
              height={500}
              series={[
                {
                  data: greenTemps,
                  label: "Green Sensor Temperature",
                  color: "#4caf50",
                  curve: "natural",
                },
                {
                  data: targetTemps,
                  label: "Target Temperature",
                  color: "#9c27b0",
                  curve: "linear",
                },
              ]}
              xAxis={[
                {
                  data: timestamps,
                  scaleType: "time",
                  tickLabelStyle: {
                    fontSize: 12,
                  },
                },
              ]}
              yAxis={[
                {
                  label: "Temperature (°C)",
                  tickLabelStyle: {
                    fontSize: 12,
                  },
                },
              ]}
              margin={{ left: 70, right: 30, top: 30, bottom: 80 }}
              grid={{ vertical: true, horizontal: true }}
            />
          </Box>
        </Paper>

        {/* Detailed Chart */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Temperature Trend (Last Hour)
          </Typography>

          <Box sx={{ height: "300px", width: "100%" }}>
            <LineChart
              width={undefined}
              height={300}
              series={[
                {
                  data: greenTemps.slice(-12), // Last 12 data points
                  label: "Green Sensor (Recent)",
                  color: "#4caf50",
                  curve: "natural",
                },
              ]}
              xAxis={[
                {
                  data: timestamps.slice(-12),
                  scaleType: "time",
                  tickLabelStyle: {
                    fontSize: 11,
                  },
                },
              ]}
              yAxis={[
                {
                  label: "Temperature (°C)",
                  tickLabelStyle: {
                    fontSize: 11,
                  },
                },
              ]}
              margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
              grid={{ vertical: true, horizontal: true }}
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default GreenChartPage;
