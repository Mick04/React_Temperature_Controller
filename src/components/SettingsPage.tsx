import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Paper,
  InputAdornment,
  Chip,
} from "@mui/material";
import {
  Save,
  Schedule,
  AccessTime,
  DeviceThermostat,
  Thermostat,
  Settings,
} from "@mui/icons-material";
import { database, auth, signInAnonymously_Custom } from "../firebase";
import { ref, set, get } from "firebase/database";
import { onAuthStateChanged, type User } from "firebase/auth";
import MQTTManager from "../services/MQTTManager";
import { mqttConfig } from "../config/mqtt";
import type { ScheduleSettings } from "../types";

interface SettingsPageProps {
  onLogout?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
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

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [workingPath, setWorkingPath] = useState<string | null>(null);
  const [mqttManager, setMqttManager] = useState<MQTTManager | null>(null);
  const [mqttConnected, setMqttConnected] = useState(false);

  // Authentication effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser && !isAuthenticating) {
        // Sign in anonymously if not authenticated
        setIsAuthenticating(true);
        signInAnonymously_Custom()
          .then((result) => {
            console.log("✅ Signed in anonymously:", result.user.uid);
            setUser(result.user);
            setIsAuthenticating(false);
          })
          .catch((error) => {
            console.error("❌ Anonymous sign-in failed:", error);
            setErrorDetails(`Authentication failed: ${error.message}`);
            setIsAuthenticating(false);
          });
      }
    });

    return () => unsubscribe();
  }, [isAuthenticating]);

  // Initialize MQTT connection
  useEffect(() => {
    console.log("🔌 Initializing MQTT connection for settings...");
    const mqtt = new MQTTManager(mqttConfig);

    mqtt.connect({
      onConnectionStatus: (connected) => {
        console.log("MQTT connection status in settings:", connected);
        setMqttConnected(connected);
      },
      onError: (error) => {
        console.error("MQTT connection error in settings:", error);
        setMqttConnected(false);
      },
    });

    setMqttManager(mqtt);

    // Cleanup on unmount
    return () => {
      console.log("🔌 Disconnecting MQTT from settings");
      mqtt.disconnect();
    };
  }, []);

  // Load settings on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (!user) {
          console.log("⚠️ No user authenticated yet, skipping load");
          return;
        }

        console.log("📥 Loading schedule settings...");

        // Try to load from the same paths we save to, with preference for known working path
        const possiblePaths = workingPath
          ? [
              workingPath,
              `users/${user.uid}/schedule`,
              `schedule`,
              `data/schedule`,
              `user-data/${user.uid}/schedule`,
              `public/schedule`,
            ]
          : [
              `users/${user.uid}/schedule`,
              `schedule`,
              `data/schedule`,
              `user-data/${user.uid}/schedule`,
              `public/schedule`,
            ];

        let loadedData = null;
        let loadedFrom = null;

        for (const path of possiblePaths) {
          try {
            console.log(`🔍 Trying to load from path: ${path}`);
            const scheduleRef = ref(database, path);
            const snapshot = await get(scheduleRef);

            if (snapshot.exists()) {
              loadedData = snapshot.val();
              loadedFrom = path;
              setWorkingPath(path); // Remember this path works
              console.log(`✅ Loaded data from path: ${path}`, loadedData);
              break;
            } else {
              console.log(`📭 No data found at path: ${path}`);
            }
          } catch (error: any) {
            console.log(`❌ Failed to load from ${path}:`, error.code);
          }
        }

        if (loadedData && isInitialLoad) {
          console.log("✅ Setting loaded schedule data:", loadedData);
          setScheduleSettings(loadedData);
          setErrorDetails(`✅ Loaded settings from: ${loadedFrom}`);
        } else if (!loadedData) {
          console.log("📭 No schedule data found in any path, using defaults");
          setErrorDetails("ℹ️ No saved settings found, using defaults");
        }

        setIsInitialLoad(false);
      } catch (error) {
        console.error("⚠️ Failed to load settings:", error);
        setErrorDetails(`Load error: ${error}`);
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad && user) {
      loadInitialData();
    }
  }, [isInitialLoad, user, workingPath]);

  const handleScheduleChange = (field: keyof ScheduleSettings, value: any) => {
    setHasUserMadeChanges(true);
    setScheduleSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const publishScheduleToMQTT = async (
    schedule: ScheduleSettings
  ): Promise<boolean> => {
    try {
      console.log("🔌 Publishing schedule to MQTT...", schedule);

      if (!mqttManager || !mqttConnected) {
        console.warn("⚠️ MQTT not connected, skipping publish");
        return false;
      }

      const success = mqttManager.publishSchedule(schedule);

      if (success) {
        console.log("✅ Schedule published to MQTT successfully");
      } else {
        console.warn("❌ Failed to publish schedule to MQTT");
      }

      return success;
    } catch (error) {
      console.error("❌ MQTT publish error:", error);
      return false;
    }
  };

  const saveScheduleSettings = async () => {
    setSaveStatus("saving");
    setErrorDetails("Saving...");

    try {
      // Check authentication first
      if (!user) {
        setErrorDetails("🔐 Authenticating...");
        setIsAuthenticating(true);
        const result = await signInAnonymously_Custom();
        setUser(result.user);
        setIsAuthenticating(false);
        console.log("✅ Authentication successful:", result.user.uid);
      }

      console.log("💾 Attempting to save to Firebase:", scheduleSettings);
      console.log("🔐 Current user:", user?.uid || "Not authenticated");

      // Enhance schedule settings with scheduledTime for Firebase
      const enhancedScheduleSettings = {
        ...scheduleSettings,
        amScheduledTime: `${scheduleSettings.amHours
          .toString()
          .padStart(2, "0")}:${scheduleSettings.amMinutes
          .toString()
          .padStart(2, "0")}`,
        pmScheduledTime: `${scheduleSettings.pmHours
          .toString()
          .padStart(2, "0")}:${scheduleSettings.pmMinutes
          .toString()
          .padStart(2, "0")}`,
      };

      console.log(
        "💾 Enhanced schedule settings with scheduledTime:",
        enhancedScheduleSettings
      );

      // Try different paths to find one with write access, with preference for known working path
      const possiblePaths = workingPath
        ? [
            workingPath,
            `users/${user?.uid}/schedule`,
            `schedule`,
            `data/schedule`,
            `user-data/${user?.uid}/schedule`,
            `public/schedule`,
          ]
        : [
            `users/${user?.uid}/schedule`,
            `schedule`,
            `data/schedule`,
            `user-data/${user?.uid}/schedule`,
            `public/schedule`,
          ];

      let savedSuccessfully = false;
      let lastError = null;
      let savedToPath = null;

      for (const path of possiblePaths) {
        try {
          console.log(`🔍 Trying to save to path: ${path}`);
          const scheduleRef = ref(database, path);
          await set(scheduleRef, enhancedScheduleSettings);
          console.log(`✅ Save successful to path: ${path}`);
          savedSuccessfully = true;
          savedToPath = path;
          setWorkingPath(path); // Remember this path works for future operations
          break;
        } catch (error: any) {
          console.log(`❌ Failed to save to ${path}:`, error.code);
          lastError = error;
        }
      }

      if (!savedSuccessfully) {
        throw lastError || new Error("All save paths failed");
      }

      console.log("✅ Save successful!");
      setSaveStatus("success");
      setHasUserMadeChanges(false);

      // Also publish to MQTT (but don't fail if it doesn't work)
      try {
        const mqttSuccess = await publishScheduleToMQTT(scheduleSettings);
        if (mqttSuccess) {
          setErrorDetails(
            `✅ Settings saved to Firebase (${savedToPath}) and published to MQTT`
          );
        } else {
          setErrorDetails(
            `✅ Settings saved to Firebase (${savedToPath}), but MQTT publish failed`
          );
        }
      } catch (mqttError) {
        console.warn("⚠️ MQTT publish error (continuing anyway):", mqttError);
        setErrorDetails(
          `✅ Settings saved to Firebase (${savedToPath}), but MQTT publish failed`
        );
      }

      // Auto-clear status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
        setErrorDetails("");
      }, 3000);
    } catch (error: any) {
      console.error("❌ Save failed:", error);
      setSaveStatus("error");

      if (error.code === "PERMISSION_DENIED") {
        setErrorDetails(
          `❌ Permission denied. Check Firebase database rules. User: ${
            user?.uid || "not authenticated"
          }`
        );
      } else {
        setErrorDetails(`❌ Save failed: ${error.message || error}`);
      }

      // Auto-clear error after 10 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 10000);
    }
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Box sx={{ width: '100vw', minHeight: '100vh', px: 2, py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
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
          You have unsaved changes!
        </Alert>
      )}

      {errorDetails && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {errorDetails}
        </Alert>
      )}

      {isAuthenticating && (
        <Alert severity="info" sx={{ mb: 3 }}>
          🔐 Authenticating with Firebase...
        </Alert>
      )}

      {user && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Authenticated (User ID: {user.uid.substring(0, 8)}...)
        </Alert>
      )}

      {mqttConnected ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          🔌 MQTT Connected - Settings will be sent to ESP32
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ MQTT Disconnected - Settings will only be saved to Firebase
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Temperature Schedule Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
              Temperature Schedule
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* AM Schedule */}
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

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Schedule Time (24-hour format)"
                    type="time"
                    value={`${scheduleSettings.amHours
                      .toString()
                      .padStart(2, "0")}:${scheduleSettings.amMinutes
                      .toString()
                      .padStart(2, "0")}`}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map((num) => parseInt(num) || 0);
                      handleScheduleChange("amHours", hours);
                      handleScheduleChange("amMinutes", minutes);
                    }}
                    disabled={!scheduleSettings.amEnabled}
                    sx={{ maxWidth: 200 }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />

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

              {/* PM Schedule */}
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

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Schedule Time (24-hour format)"
                    type="time"
                    value={`${scheduleSettings.pmHours
                      .toString()
                      .padStart(2, "0")}:${scheduleSettings.pmMinutes
                      .toString()
                      .padStart(2, "0")}`}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map((num) => parseInt(num) || 0);
                      handleScheduleChange("pmHours", hours);
                      handleScheduleChange("pmMinutes", minutes);
                    }}
                    disabled={!scheduleSettings.pmEnabled}
                    sx={{ maxWidth: 200 }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />

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

              {/* Default Temperature */}
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

            {/* Save Button */}
            <Box
              sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "center" }}
            >
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={saveScheduleSettings}
                disabled={saveStatus === "saving" || isAuthenticating}
                color={hasUserMadeChanges ? "secondary" : "primary"}
                size="large"
              >
                {saveStatus === "saving"
                  ? "Saving..."
                  : hasUserMadeChanges
                  ? "Save Changes"
                  : "Save Schedule"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SettingsPage;
