import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import {
  Save,
  Refresh,
  Delete,
  Info,
  Security,
  Wifi,
  Thermostat,
  Settings,
} from "@mui/icons-material";

interface SettingsPageProps {
  onLogout?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  const [settings, setSettings] = useState({
    // Temperature Settings
    temperatureUnit: "C",
    autoRefreshInterval: 5,
    alertThreshold: 40,
    enableAlerts: true,

    // System Settings
    deviceName: "ESP32 Temperature Controller",
    enableLogging: true,
    logRetentionDays: 30,

    // Network Settings
    mqttReconnectDelay: 5,
    firebaseTimeout: 10,

    // UI Settings
    darkMode: false,
    compactView: false,
    showAdvanced: false,
  });

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus("saving");

    try {
      localStorage.setItem(
        "esp32-dashboard-settings",
        JSON.stringify(settings)
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings({
        temperatureUnit: "C",
        autoRefreshInterval: 5,
        alertThreshold: 40,
        enableAlerts: true,
        deviceName: "ESP32 Temperature Controller",
        enableLogging: true,
        logRetentionDays: 30,
        mqttReconnectDelay: 5,
        firebaseTimeout: 10,
        darkMode: false,
        compactView: false,
        showAdvanced: false,
      });
    }
  };

  const clearStorageData = (type: string) => {
    if (confirm(`Are you sure you want to clear all ${type} data?`)) {
      switch (type) {
        case "cache":
          localStorage.removeItem("esp32-dashboard-cache");
          break;
        case "logs":
          localStorage.removeItem("esp32-dashboard-logs");
          break;
        case "history":
          localStorage.removeItem("esp32-dashboard-history");
          break;
      }
      alert(`${type} data cleared successfully!`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        <Settings sx={{ mr: 2, verticalAlign: "middle" }} />
        Settings
      </Typography>

      {saveStatus === "success" && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to save settings. Please try again.
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Temperature Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Thermostat sx={{ mr: 1, verticalAlign: "middle" }} />
              Temperature Settings
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Device Name"
                value={settings.deviceName}
                onChange={(e) =>
                  handleSettingChange("deviceName", e.target.value)
                }
              />

              <TextField
                fullWidth
                label="Alert Threshold (°C)"
                type="number"
                value={settings.alertThreshold}
                onChange={(e) =>
                  handleSettingChange("alertThreshold", Number(e.target.value))
                }
                inputProps={{ min: 0, max: 100 }}
              />

              <TextField
                fullWidth
                label="Auto Refresh Interval (seconds)"
                type="number"
                value={settings.autoRefreshInterval}
                onChange={(e) =>
                  handleSettingChange(
                    "autoRefreshInterval",
                    Number(e.target.value)
                  )
                }
                inputProps={{ min: 1, max: 60 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableAlerts}
                    onChange={(e) =>
                      handleSettingChange("enableAlerts", e.target.checked)
                    }
                  />
                }
                label="Enable Temperature Alerts"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Network Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Wifi sx={{ mr: 1, verticalAlign: "middle" }} />
              Network Settings
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="MQTT Reconnect Delay (seconds)"
                type="number"
                value={settings.mqttReconnectDelay}
                onChange={(e) =>
                  handleSettingChange(
                    "mqttReconnectDelay",
                    Number(e.target.value)
                  )
                }
                inputProps={{ min: 1, max: 60 }}
              />

              <TextField
                fullWidth
                label="Firebase Timeout (seconds)"
                type="number"
                value={settings.firebaseTimeout}
                onChange={(e) =>
                  handleSettingChange("firebaseTimeout", Number(e.target.value))
                }
                inputProps={{ min: 5, max: 30 }}
              />

              <TextField
                fullWidth
                label="Log Retention (days)"
                type="number"
                value={settings.logRetentionDays}
                onChange={(e) =>
                  handleSettingChange(
                    "logRetentionDays",
                    Number(e.target.value)
                  )
                }
                inputProps={{ min: 1, max: 365 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableLogging}
                    onChange={(e) =>
                      handleSettingChange("enableLogging", e.target.checked)
                    }
                  />
                }
                label="Enable System Logging"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Security sx={{ mr: 1, verticalAlign: "middle" }} />
              Data Management
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="Clear Cache Data"
                  secondary="Remove cached temperature readings"
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => clearStorageData("cache")}
                    color="warning"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="Clear Log Data"
                  secondary="Remove system logs and error reports"
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => clearStorageData("logs")}
                    color="warning"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            {onLogout && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={onLogout}
              >
                Sign Out
              </Button>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Info sx={{ mr: 1, verticalAlign: "middle" }} />
            System Information
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Version
              </Typography>
              <Typography variant="body1">1.0.0</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {new Date().toLocaleDateString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                ESP32 Device
              </Typography>
              <Typography variant="body1">{settings.deviceName}</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "center" }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveSettings}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "Saving..." : "Save Settings"}
        </Button>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleResetSettings}
          disabled={saveStatus === "saving"}
        >
          Reset to Defaults
        </Button>
      </Box>
    </Container>
  );
};

export default SettingsPage;
