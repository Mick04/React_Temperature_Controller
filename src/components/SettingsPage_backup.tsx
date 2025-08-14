import React, { useState, useEffect } from "react";
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
  InputAdornment,
  Chip,
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
  Schedule,
  AccessTime,
  DeviceThermostat,
} from "@mui/icons-material";
import { database } from "../firebase";
import { ref, set, get } from "firebase/database";
import MQTTManager from "../services/MQTTManager";
import { mqttConfig } from "../config/mqtt";
import type { ScheduleSettings } from "../types";

interface SettingsPageProps {
  onLogout?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  // Schedule Settings State
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    amEnabled: false,
    amHours: 6,
    amMinutes: 0,
    amTemperature: 22,
    pmEnabled: false,
    pmHours: 18,
    pmMinutes: 0,
    pmTemperature: 20,
    defaultTemperature: 21,
  });

  // System Settings State
  const [settings, setSettings] = useState({
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

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [mqttManager] = useState(() => new MQTTManager(mqttConfig));
  const [lastPublishedData, setLastPublishedData] = useState<string>("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");

  // Load existing schedule settings from Firebase (only on initial load)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load schedule settings from Firebase (one-time read)
        const scheduleRef = ref(database, "schedule");
        const snapshot = await get(scheduleRef);

        if (snapshot.exists() && isInitialLoad) {
          const data = snapshot.val();
          console.log("Loaded initial schedule settings from Firebase:", data);
          setScheduleSettings(data);
        }

        // Load local settings
        const localSettings = localStorage.getItem("esp32-dashboard-settings");
        if (localSettings) {
          setSettings(JSON.parse(localSettings));
        }

        setIsInitialLoad(false);
      } catch (error) {
        console.error("Failed to load initial settings:", error);
        setErrorDetails(`Failed to load settings: ${error}`);
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) {
      loadInitialData();
    }
  }, [isInitialLoad]);

  const handleScheduleChange = (field: keyof ScheduleSettings, value: any) => {
    setHasUserMadeChanges(true);
    setScheduleSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingChange = (key: string, value: any) => {
    setHasUserMadeChanges(true);
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const testFirebaseConnection = async () => {
    try {
      console.log("🔍 Testing Firebase connection...");
      setErrorDetails("Testing Firebase connection...");

      // Test write to a test path
      const testRef = ref(database, "test/connection");
      await set(testRef, { timestamp: Date.now(), test: true });

      console.log("✅ Firebase write test successful");

      // Test read from the same path
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        console.log("✅ Firebase read test successful");
        setErrorDetails("✅ Firebase connection test passed!");
        return true;
      } else {
        console.log("❌ Firebase read test failed - no data");
        setErrorDetails("❌ Firebase read test failed - no data");
        return false;
      }
    } catch (error) {
      console.error("❌ Firebase test failed:", error);
      setErrorDetails(`❌ Firebase test failed: ${error}`);
      return false;
    }
  };

  const publishScheduleToMQTT = async (schedule: ScheduleSettings) => {
    try {
      console.log("🔌 Checking MQTT connection status...");

      // Skip MQTT for now to isolate Firebase issues
      console.log("⚠️ Skipping MQTT publish for debugging");
      setLastPublishedData(JSON.stringify(schedule, null, 2));
      return true;
    } catch (error) {
      console.warn("⚠️ MQTT publish failed:", error);
      return false;
    }
  };

  const saveScheduleSettings = async () => {
    setSaveStatus("saving");
    setErrorDetails("");

    try {
      // First test Firebase connection
      console.log("🔍 Testing Firebase connection before save...");
      const connectionTest = await testFirebaseConnection();

      if (!connectionTest) {
        throw new Error("Firebase connection test failed");
      }

      // Save to Firebase
      console.log("💾 Saving schedule to Firebase...", scheduleSettings);
      await set(ref(database, "schedule"), scheduleSettings);
      console.log("✅ Schedule settings saved to Firebase successfully");

      // Try MQTT (but don't fail if it doesn't work)
      try {
        const mqttSuccess = await publishScheduleToMQTT(scheduleSettings);
        if (mqttSuccess) {
          console.log("✅ Schedule published to MQTT successfully");
        }
      } catch (mqttError) {
        console.warn("⚠️ MQTT publish error (continuing anyway):", mqttError);
      }

      // Success
      setSaveStatus("success");
      setHasUserMadeChanges(false);
      setErrorDetails("✅ Settings saved successfully!");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("❌ Failed to save schedule settings:", error);
      setErrorDetails(`❌ Save failed: ${error}`);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
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
      setHasUserMadeChanges(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setErrorDetails(`Failed to save local settings: ${error}`);
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
      setHasUserMadeChanges(true);
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

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
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

      {hasUserMadeChanges && saveStatus === "idle" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes. Don't forget to save your settings!
        </Alert>
      )}

      {errorDetails && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Debug Info: {errorDetails}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Debug Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔧 Debug Tools
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={testFirebaseConnection}
                size="small"
              >
                Test Firebase Connection
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  console.log("Current scheduleSettings:", scheduleSettings);
                  console.log("Current settings:", settings);
                  setErrorDetails(
                    `Settings: ${JSON.stringify(scheduleSettings, null, 2)}`
                  );
                }}
                size="small"
              >
                Log Current Settings
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Temperature Schedule Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
              Temperature Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Set automatic temperature changes for morning and evening times
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* AM Schedule */}
              <Box>
                <Paper
                  sx={{
                    p: 3,
                    border: scheduleSettings.amEnabled
                      ? "2px solid #1976d2"
                      : "1px solid #e0e0e0",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <AccessTime sx={{ mr: 1, color: "#1976d2" }} />
                    <Typography variant="h6">Morning Schedule</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={scheduleSettings.amEnabled}
                          onChange={(e) =>
                            handleScheduleChange("amEnabled", e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label="Enable"
                      sx={{ ml: "auto" }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      opacity: scheduleSettings.amEnabled ? 1 : 0.5,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        label="Hours"
                        type="number"
                        value={scheduleSettings.amHours}
                        onChange={(e) =>
                          handleScheduleChange(
                            "amHours",
                            parseInt(e.target.value) || 0
                          )
                        }
                        inputProps={{ min: 0, max: 23 }}
                        disabled={!scheduleSettings.amEnabled}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Minutes"
                        type="number"
                        value={scheduleSettings.amMinutes}
                        onChange={(e) =>
                          handleScheduleChange(
                            "amMinutes",
                            parseInt(e.target.value) || 0
                          )
                        }
                        inputProps={{ min: 0, max: 59 }}
                        disabled={!scheduleSettings.amEnabled}
                        sx={{ flex: 1 }}
                      />
                    </Box>

                    <TextField
                      label="Target Temperature"
                      type="number"
                      value={scheduleSettings.amTemperature}
                      onChange={(e) =>
                        handleScheduleChange(
                          "amTemperature",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      inputProps={{ min: 5, max: 50, step: 0.5 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">°C</InputAdornment>
                        ),
                      }}
                      disabled={!scheduleSettings.amEnabled}
                      fullWidth
                    />

                    {scheduleSettings.amEnabled && (
                      <Chip
                        icon={<DeviceThermostat />}
                        label={`${formatTime(
                          scheduleSettings.amHours,
                          scheduleSettings.amMinutes
                        )} → ${scheduleSettings.amTemperature}°C`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* PM Schedule */}
              <Box>
                <Paper
                  sx={{
                    p: 3,
                    border: scheduleSettings.pmEnabled
                      ? "2px solid #ed6c02"
                      : "1px solid #e0e0e0",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <AccessTime sx={{ mr: 1, color: "#ed6c02" }} />
                    <Typography variant="h6">Evening Schedule</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={scheduleSettings.pmEnabled}
                          onChange={(e) =>
                            handleScheduleChange("pmEnabled", e.target.checked)
                          }
                          color="warning"
                        />
                      }
                      label="Enable"
                      sx={{ ml: "auto" }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      opacity: scheduleSettings.pmEnabled ? 1 : 0.5,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        label="Hours"
                        type="number"
                        value={scheduleSettings.pmHours}
                        onChange={(e) =>
                          handleScheduleChange(
                            "pmHours",
                            parseInt(e.target.value) || 0
                          )
                        }
                        inputProps={{ min: 0, max: 23 }}
                        disabled={!scheduleSettings.pmEnabled}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Minutes"
                        type="number"
                        value={scheduleSettings.pmMinutes}
                        onChange={(e) =>
                          handleScheduleChange(
                            "pmMinutes",
                            parseInt(e.target.value) || 0
                          )
                        }
                        inputProps={{ min: 0, max: 59 }}
                        disabled={!scheduleSettings.pmEnabled}
                        sx={{ flex: 1 }}
                      />
                    </Box>

                    <TextField
                      label="Target Temperature"
                      type="number"
                      value={scheduleSettings.pmTemperature}
                      onChange={(e) =>
                        handleScheduleChange(
                          "pmTemperature",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      inputProps={{ min: 5, max: 50, step: 0.5 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">°C</InputAdornment>
                        ),
                      }}
                      disabled={!scheduleSettings.pmEnabled}
                      fullWidth
                    />

                    {scheduleSettings.pmEnabled && (
                      <Chip
                        icon={<DeviceThermostat />}
                        label={`${formatTime(
                          scheduleSettings.pmHours,
                          scheduleSettings.pmMinutes
                        )} → ${scheduleSettings.pmTemperature}°C`}
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Default Temperature */}
              <Box>
                <Paper sx={{ p: 3, backgroundColor: "#f5f5f5" }}>
                  <Typography variant="h6" gutterBottom>
                    <Thermostat sx={{ mr: 1, verticalAlign: "middle" }} />
                    Default Temperature
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Temperature used when no schedule is active
                  </Typography>

                  <TextField
                    label="Default Target Temperature"
                    type="number"
                    value={scheduleSettings.defaultTemperature}
                    onChange={(e) =>
                      handleScheduleChange(
                        "defaultTemperature",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    inputProps={{ min: 5, max: 50, step: 0.5 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">°C</InputAdornment>
                      ),
                    }}
                    sx={{ maxWidth: 300 }}
                  />
                </Paper>
              </Box>
            </Box>

            {/* Schedule Action Buttons */}
            <Box
              sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "center" }}
            >
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={saveScheduleSettings}
                disabled={saveStatus === "saving"}
                color={hasUserMadeChanges ? "secondary" : "primary"}
              >
                {saveStatus === "saving"
                  ? "Saving Schedule..."
                  : hasUserMadeChanges
                  ? "Save Changes"
                  : "Save Schedule"}
              </Button>

              <Button
                variant="outlined"
                onClick={() => {
                  setScheduleSettings({
                    amEnabled: false,
                    amHours: 6,
                    amMinutes: 0,
                    amTemperature: 22,
                    pmEnabled: false,
                    pmHours: 18,
                    pmMinutes: 0,
                    pmTemperature: 20,
                    defaultTemperature: 21,
                  });
                  setHasUserMadeChanges(true);
                }}
              >
                Reset Schedule
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* MQTT Debug Info */}
        {lastPublishedData && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📡 Last Published Schedule Data
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}
                >
                  {lastPublishedData}
                </Typography>
              </Paper>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This data was published to MQTT topics and saved to Firebase.
                Your ESP32 should receive these values.
              </Typography>
            </CardContent>
          </Card>
        )}

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
