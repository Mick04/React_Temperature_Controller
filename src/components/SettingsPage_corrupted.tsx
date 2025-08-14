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
          ? [workingPath, `users/${user.uid}/schedule`, `schedule`, `data/schedule`, `user-data/${user.uid}/schedule`, `public/schedule`]
          : [`users/${user.uid}/schedule`, `schedule`, `data/schedule`, `user-data/${user.uid}/schedule`, `public/schedule`];
        
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
  }, [isInitialLoad, user]);  const handleScheduleChange = (field: keyof ScheduleSettings, value: any) => {
    setHasUserMadeChanges(true);
    setScheduleSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      
      // Try different paths to find one with write access, with preference for known working path
      const possiblePaths = workingPath 
        ? [workingPath, `users/${user?.uid}/schedule`, `schedule`, `data/schedule`, `user-data/${user?.uid}/schedule`, `public/schedule`]
        : [`users/${user?.uid}/schedule`, `schedule`, `data/schedule`, `user-data/${user?.uid}/schedule`, `public/schedule`];
      
      let savedSuccessfully = false;
      let lastError = null;
      let savedToPath = null;
      
      for (const path of possiblePaths) {
        try {
          console.log(`🔍 Trying to save to path: ${path}`);
          const scheduleRef = ref(database, path);
          await set(scheduleRef, scheduleSettings);
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
      setErrorDetails(`✅ Settings saved successfully to: ${savedToPath}`);

      // Auto-clear status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
        setErrorDetails("");
      }, 3000);
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

  const testFirebasePermissions = async () => {
    try {
      setErrorDetails("🔍 Testing Firebase permissions...");

      // Test read access
      const testRef = ref(database, "test");
      await get(testRef);
      console.log("✅ Read test passed");

      // Test write access to different paths
      const testPaths = ["test/write", "schedule/test", "data/test"];

      for (const path of testPaths) {
        try {
          const testWriteRef = ref(database, path);
          await set(testWriteRef, { test: true, timestamp: Date.now() });
          console.log(`✅ Write test passed for: ${path}`);
          setErrorDetails(`✅ Write access confirmed for: ${path}`);
          return; // Success!
        } catch (error: any) {
          console.log(`❌ Write test failed for ${path}:`, error.code);
        }
      }

      setErrorDetails("❌ No write access to any tested paths");
    } catch (error: any) {
      console.error("❌ Permission test failed:", error);
      setErrorDetails(
        `❌ Permission test failed: ${error.code} - ${error.message}`
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
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

              <Button
                variant="outlined"
                onClick={testFirebasePermissions}
                disabled={saveStatus === "saving" || isAuthenticating}
                size="large"
              >
                Test Permissions
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SettingsPage;
