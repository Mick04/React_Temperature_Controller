import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useTemperature } from "../contexts/TemperatureContext";

const TemperatureChart: React.FC = () => {
  const { historicalData } = useTemperature();

  // Use real MQTT data or fallback to sample data if no historical data yet
  const chartData =
    historicalData.length > 0
      ? historicalData
      : Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() - (20 - i) * 60000,
          temperature: {
            red: 20 + Math.random() * 5,
            blue: 20 + Math.random() * 5,
            green: 20 + Math.random() * 5,
            average: 20 + Math.random() * 5,
          },
          heaterStatus: Math.random() > 0.5,
          targetTemperature: 22,
        }));

  const timestamps = chartData.map((point) => new Date(point.timestamp));
  const redTemps = chartData.map((point) => point.temperature.red);
  const blueTemps = chartData.map((point) => point.temperature.blue);
  const greenTemps = chartData.map((point) => point.temperature.green);
  const avgTemps = chartData.map((point) => point.temperature.average);
  const targetTemps = chartData.map((point) => point.targetTemperature);

  return (
    <Paper elevation={3} sx={{ p: 3, height: "400px" }}>
      <Typography variant="h6" gutterBottom>
        Temperature History
      </Typography>

      <Box sx={{ height: "350px", width: "100%" }}>
        <LineChart
          width={undefined}
          height={350}
          series={[
            {
              data: redTemps,
              label: "Red Sensor",
              color: "#f44336",
            },
            {
              data: blueTemps,
              label: "Blue Sensor",
              color: "#2196f3",
            },
            {
              data: greenTemps,
              label: "Green Sensor",
              color: "#4caf50",
            },
            {
              data: avgTemps,
              label: "Average",
              color: "#ff9800",
            },
            {
              data: targetTemps,
              label: "Target",
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
          margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
          grid={{ vertical: true, horizontal: true }}
        />
      </Box>
    </Paper>
  );
};

export default TemperatureChart;
