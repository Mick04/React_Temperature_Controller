import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, Thermostat } from "@mui/icons-material";

interface LoginPageProps {
  onLogin: (success: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  console.log("🔑 LoginPage: Component mounted");

  // Simple password - you can change this to whatever you want
  const DASHBOARD_PASSWORD = "Log1951In";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate a brief loading time
    setTimeout(() => {
      if (password === DASHBOARD_PASSWORD) {
        localStorage.setItem("esp32-dashboard-auth", "true");
        onLogin(true);
      } else {
        setError("Incorrect password");
        setPassword("");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%" }}>
        <CardContent sx={{ padding: 4 }}>
          <Box sx={{ textAlign: "center", marginBottom: 3 }}>
            <Thermostat
              sx={{ fontSize: 48, color: "primary.main", marginBottom: 1 }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              ESP32 Temperature Controller
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter password to access the dashboard
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ marginTop: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ marginTop: 3, marginBottom: 2 }}
            >
              {loading ? "Signing In..." : "Access Dashboard"}
            </Button>
          </form>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", marginTop: 2 }}
          >
            Secured access to your ESP32 system
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
