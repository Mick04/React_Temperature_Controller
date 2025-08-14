import { useState, useEffect } from "react";
import MainApp from "./components/MainApp";
import LoginPage from "./components/LoginPage";
import { TemperatureProvider } from "./contexts/TemperatureContext";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    console.log("🔍 App: Checking authentication status...");

    // Check for logout parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("logout") === "true") {
      console.log("🚪 App: Logout requested via URL");
      localStorage.removeItem("esp32-dashboard-auth");
      setIsAuthenticated(false);
      setIsLoading(false);
      // Remove the logout parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const authStatus = localStorage.getItem("esp32-dashboard-auth");
    console.log("🔐 App: Auth status from localStorage:", authStatus);

    if (authStatus === "true") {
      console.log("✅ App: User is authenticated, showing main app");
      setIsAuthenticated(true);
    } else {
      console.log("❌ App: User not authenticated, showing login page");
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (success: boolean) => {
    console.log("🔐 App: Login attempt result:", success);
    setIsAuthenticated(success);
  };

  const handleLogout = () => {
    console.log("🚪 App: Logout requested");
    localStorage.removeItem("esp32-dashboard-auth");
    setIsAuthenticated(false);
  };

  if (isLoading) {
    console.log("⏳ App: Still loading...");
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  try {
    if (!isAuthenticated) {
      console.log("🔑 App: Rendering LoginPage");
      return <LoginPage onLogin={handleLogin} />;
    }

    console.log("🏠 App: Rendering MainApp");
    return (
      <TemperatureProvider>
        <MainApp onLogout={handleLogout} />
      </TemperatureProvider>
    );
  } catch (error) {
    console.error("App Error:", error);
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Error Loading Dashboard</h1>
        <p>Check the browser console for details</p>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}

export default App;
