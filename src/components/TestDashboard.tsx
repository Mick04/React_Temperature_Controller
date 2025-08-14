import React from "react";
import { Typography, Box, Paper } from "@mui/material";

const TestDashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🌡️ ESP32 Temperature Controller
        </Typography>
        <Typography variant="body1">
          Dashboard is loading successfully!
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Temperature Display
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box
            sx={{
              textAlign: "center",
              p: 2,
              bgcolor: "#ffebee",
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2">Red Sensor</Typography>
            <Typography variant="h4" color="error">
              22.5°C
            </Typography>
          </Box>
          <Box
            sx={{
              textAlign: "center",
              p: 2,
              bgcolor: "#e3f2fd",
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2">Blue Sensor</Typography>
            <Typography variant="h4" color="primary">
              23.1°C
            </Typography>
          </Box>
          <Box
            sx={{
              textAlign: "center",
              p: 2,
              bgcolor: "#e8f5e8",
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2">Green Sensor</Typography>
            <Typography variant="h4" color="success.main">
              22.8°C
            </Typography>
          </Box>
          <Box
            sx={{
              textAlign: "center",
              p: 2,
              bgcolor: "#fff3e0",
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2">Average</Typography>
            <Typography variant="h4" color="warning.main">
              22.8°C
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status
        </Typography>
        <Typography variant="body2" color="success.main">
          ✅ React Components Loading
        </Typography>
        <Typography variant="body2" color="success.main">
          ✅ Material-UI Working
        </Typography>
        <Typography variant="body2" color="warning.main">
          ⏳ Firebase Connection (Testing...)
        </Typography>
        <Typography variant="body2" color="warning.main">
          ⏳ MQTT Connection (Testing...)
        </Typography>
      </Paper>
    </Box>
  );
};

export default TestDashboard;
