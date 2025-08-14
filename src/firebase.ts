// Firebase configuration for ESP32 Temperature Controller
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDkJinA0K6NqBLGR4KYnX8AdDNgXp2-FDI",
  authDomain: "esp32-heater-controler-6d11f.firebaseapp.com",
  databaseURL:
    "https://esp32-heater-controler-6d11f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "esp32-heater-controler-6d11f",
  storageBucket: "esp32-heater-controler-6d11f.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// Sign in anonymously
export const signInAnonymously_Custom = () => {
  return signInAnonymously(auth);
};

export default app;
