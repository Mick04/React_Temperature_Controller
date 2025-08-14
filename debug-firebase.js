// Simple Firebase debug script
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
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

async function debugFirebase() {
  try {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const auth = getAuth(app);

    console.log("Signing in anonymously...");
    await signInAnonymously(auth);

    console.log("Connected! Reading database...");

    // Read entire database
    const rootRef = ref(database, "/");
    const rootSnapshot = await get(rootRef);
    console.log("\n=== ENTIRE DATABASE ===");
    console.log(JSON.stringify(rootSnapshot.val(), null, 2));

    // Read system data
    const systemRef = ref(database, "/system");
    const systemSnapshot = await get(systemRef);
    console.log("\n=== SYSTEM DATA (/system) ===");
    console.log(JSON.stringify(systemSnapshot.val(), null, 2));

    // Read control data
    const controlRef = ref(database, "/control");
    const controlSnapshot = await get(controlRef);
    console.log("\n=== CONTROL DATA (/control) ===");
    console.log(JSON.stringify(controlSnapshot.val(), null, 2));

    // Read sensors data
    const sensorsRef = ref(database, "/sensors");
    const sensorsSnapshot = await get(sensorsRef);
    console.log("\n=== SENSORS DATA (/sensors) ===");
    console.log(JSON.stringify(sensorsSnapshot.val(), null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

debugFirebase();
