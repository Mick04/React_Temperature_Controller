import React, { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Thermostat,
  MoreVert,
  ExitToApp,
  ShowChart,
} from "@mui/icons-material";
import Dashboard from "./Dashboard";
import SettingsPage from "./SettingsPage";
//import RedChartPage from "./RedChartPage";
//import BlueChartPage from "./BlueChartPage";
//import GreenChartPage from "./GreenChartPage";

interface MainAppProps {
  onLogout?: () => void;
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

const MainApp: React.FC<MainAppProps> = ({ onLogout }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const TabPanel: React.FC<{
    children?: React.ReactNode;
    value: number;
    index: number;
  }> = ({ children, value, index }) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
      >
        {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
      </div>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Thermostat sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ESP32 Temperature Controller
            </Typography>

            {onLogout && (
              <>
                <IconButton
                  color="inherit"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                >
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                >
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      onLogout();
                    }}
                  >
                    <ExitToApp sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Toolbar>

          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              minHeight: 48,
            }}
          >
            <Tab
              icon={<DashboardIcon />}
              label="Dashboard"
              id="tab-0"
              aria-controls="tabpanel-0"
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.85rem",
              }}
            />
            <Tab
              icon={<ShowChart sx={{ color: "#f44336" }} />}
              label="Red Charts"
              id="tab-1"
              aria-controls="tabpanel-1"
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.85rem",
              }}
            />
            <Tab
              icon={<ShowChart sx={{ color: "#2196f3" }} />}
              label="Blue Charts"
              id="tab-2"
              aria-controls="tabpanel-2"
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.85rem",
              }}
            />
            <Tab
              icon={<ShowChart sx={{ color: "#4caf50" }} />}
              label="Green Charts"
              id="tab-3"
              aria-controls="tabpanel-3"
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.85rem",
              }}
            />
            <Tab
              icon={<SettingsIcon />}
              label="Settings"
              id="tab-4"
              aria-controls="tabpanel-4"
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.85rem",
              }}
            />
          </Tabs>
        </AppBar>

        <TabPanel value={currentTab} index={0}>
          <Dashboard />
        </TabPanel>

        {/* <TabPanel value={currentTab} index={1}>
          <RedChartPage />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <BlueChartPage />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <GreenChartPage />
        </TabPanel> */}

        <TabPanel value={currentTab} index={4}>
          <SettingsPage onLogout={onLogout} />
        </TabPanel>
      </Box>
    </ThemeProvider>
  );
};

export default MainApp;
