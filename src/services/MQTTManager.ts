// MQTT WebSocket client for real-time ESP32 communication
import mqtt from "mqtt";
import type { ScheduleSettings } from "../types";

export interface MQTTConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId?: string;
}

export interface MQTTCallbacks {
  onTemperatureUpdate?: (sensor: string, temperature: number) => void;
  onHeaterStatusUpdate?: (status: boolean) => void;
  onSystemStatusUpdate?: (statusData: any) => void;
  onConnectionStatus?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

class MQTTManager {
  private client: mqtt.MqttClient | null = null;
  private callbacks: MQTTCallbacks = {};
  private isConnected = false;
  private config: MQTTConfig;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;

  constructor(config: MQTTConfig) {
    this.config = config;
  }

  connect(callbacks: MQTTCallbacks = {}) {
    this.callbacks = callbacks;
    this.connectionAttempts++;

    console.log("🔌 MQTT Connection Attempt Details:");
    console.log("  📍 Broker URL:", this.config.brokerUrl);
    console.log("  👤 Username:", this.config.username || "Not provided");
    console.log(
      "  🔑 Password:",
      this.config.password ? "✅ Provided" : "❌ Not provided"
    );
    console.log("  🆔 Client ID:", this.config.clientId || "Auto-generated");
    console.log("  📊 Attempt #:", this.connectionAttempts);
    console.log("  ⏰ Timestamp:", new Date().toISOString());

    const options: mqtt.IClientOptions = {
      clientId:
        this.config.clientId ||
        `react_dashboard_${Math.random().toString(16).substr(2, 8)}`,
      username: this.config.username,
      password: this.config.password,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
      clean: true,
      rejectUnauthorized: true,
    };

    try {
      console.log("� Initializing MQTT client with options:", {
        ...options,
        password: options.password ? "***HIDDEN***" : undefined,
      });

      this.client = mqtt.connect(this.config.brokerUrl, options);

      this.client.on("connect", () => {
        console.log("✅ MQTT connected successfully to", this.config.brokerUrl);
        this.isConnected = true;
        this.connectionAttempts = 0; // Reset on successful connection
        this.callbacks.onConnectionStatus?.(true);

        // Subscribe to ESP32 topics
        this.subscribeToTopics();
      });

      this.client.on("message", (topic: string, message: Buffer) => {
        this.handleMessage(topic, message.toString());
      });

      this.client.on("error", (error: Error) => {
        console.error("❌ MQTT connection error:", error);
        console.error("❌ Error details:", {
          message: error.message,
          name: error.name,
          connectionAttempt: this.connectionAttempts,
          brokerUrl: this.config.brokerUrl,
          username: this.config.username,
          hasPassword: !!this.config.password,
          clientId: options.clientId,
          timestamp: new Date().toISOString(),
        });

        this.isConnected = false;
        this.callbacks.onConnectionStatus?.(false);
        this.callbacks.onError?.(error);

        // If we've exceeded max attempts, stop trying
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          console.error(
            `❌ Max connection attempts (${this.maxConnectionAttempts}) reached. Stopping reconnection.`
          );
          this.client?.end(true);
        }
      });

      this.client.on("close", () => {
        console.log("🔌 MQTT connection closed");
        this.isConnected = false;
        this.callbacks.onConnectionStatus?.(false);
      });

      this.client.on("offline", () => {
        console.log("📵 MQTT client went offline");
        this.isConnected = false;
        this.callbacks.onConnectionStatus?.(false);
      });

      this.client.on("reconnect", () => {
        console.log("🔄 MQTT attempting to reconnect...");
      });
    } catch (error) {
      console.error("❌ Failed to initialize MQTT connection:", error);
      this.isConnected = false;
      this.callbacks.onConnectionStatus?.(false);
      this.callbacks.onError?.(error as Error);
    }
  }

  private subscribeToTopics() {
    if (!this.client) return;

    const topics = [
      "esp32/sensors/temperature/red",
      "esp32/sensors/temperature/blue",
      "esp32/sensors/temperature/green",
      "esp32/sensors/heaterStatus",
      "esp32/system/status",
      "esp32/system/rssi",
      "esp32/system/uptime",
      "esp32/system/wifi",
    ];

    topics.forEach((topic) => {
      this.client?.subscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Failed to subscribe to ${topic}:`, error);
        } else {
          console.log(`✅ Subscribed to ${topic}`);
        }
      });
    });
  }

  private handleMessage(topic: string, message: string) {
    try {
      console.log(`📨 MQTT message on ${topic}:`, message);

      if (topic.includes("/temperature/")) {
        const sensorType = topic.split("/").pop();
        const temperature = parseFloat(message);

        if (!isNaN(temperature) && sensorType) {
          this.callbacks.onTemperatureUpdate?.(sensorType, temperature);
        }
      } else if (topic.includes("/heaterStatus")) {
        const status = message.toLowerCase() === "true" || message === "1";
        this.callbacks.onHeaterStatusUpdate?.(status);
      } else if (topic.includes("/system/")) {
        // Handle individual system status updates
        if (topic.includes("/rssi")) {
          const rssi = parseInt(message);
          console.log(`📡 MQTT RSSI update: ${rssi} dBm (topic: ${topic})`);
          if (!isNaN(rssi)) {
            this.callbacks.onSystemStatusUpdate?.({ rssi });
          }
        } else if (topic.includes("/uptime")) {
          const uptime = parseInt(message);
          if (!isNaN(uptime)) {
            this.callbacks.onSystemStatusUpdate?.({ uptime });
          }
        } else if (topic.includes("/wifi")) {
          this.callbacks.onSystemStatusUpdate?.({ wifi: message });
        } else if (topic.includes("/status")) {
          // Handle full system status object
          try {
            const statusData = JSON.parse(message);
            this.callbacks.onSystemStatusUpdate?.(statusData);
          } catch (parseError) {
            // If not JSON, treat as simple status string
            this.callbacks.onSystemStatusUpdate?.({ status: message });
          }
        }
      }
    } catch (error) {
      console.error("❌ Error parsing MQTT message:", error);
    }
  }

  publish(topic: string, message: string): boolean {
    if (!this.client || !this.isConnected) {
      console.warn("MQTT not connected, cannot publish");
      return false;
    }

    this.client.publish(topic, message, (error) => {
      if (error) {
        console.error(`Failed to publish to ${topic}:`, error);
      } else {
        console.log(`Published to ${topic}:`, message);
      }
    });

    return true;
  }

  // Control functions
  setTargetTemperature(temperature: number): boolean {
    return this.publish(
      "esp32/control/targetTemperature",
      temperature.toString()
    );
  }

  setHeaterMode(mode: "auto" | "manual"): boolean {
    return this.publish("esp32/control/mode", mode);
  }

  // Schedule control functions
  publishSchedule(schedule: ScheduleSettings): boolean {
    // Parse time strings to get hours and minutes for ESP32 compatibility
    const parseTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(":").map(Number);
      return { hours, minutes };
    };

    const amTime = parseTime(schedule.amScheduledTime);
    const pmTime = parseTime(schedule.pmScheduledTime);

    // Transform React app format to ESP32 expected format
    const esp32ScheduleFormat = {
      am: {
        enabled: schedule.amEnabled,
        hours: amTime.hours,
        minutes: amTime.minutes,
        temperature: schedule.amTemperature,
        scheduledTime: schedule.amScheduledTime,
      },
      pm: {
        enabled: schedule.pmEnabled,
        hours: pmTime.hours,
        minutes: pmTime.minutes,
        temperature: schedule.pmTemperature,
        scheduledTime: schedule.pmScheduledTime,
      },
    };

    console.log("📤 Publishing ESP32 schedule format:", esp32ScheduleFormat);

    const success = this.publish(
      "esp32/control/schedule",
      JSON.stringify(esp32ScheduleFormat)
    );

    // Also publish individual schedule components for easier ESP32 parsing
    this.publish(
      "esp32/control/schedule/am/enabled",
      schedule.amEnabled.toString()
    );
    this.publish("esp32/control/schedule/am/time", schedule.amScheduledTime);
    this.publish(
      "esp32/control/schedule/am/scheduledTime",
      schedule.amScheduledTime
    );
    this.publish(
      "esp32/control/schedule/am/temperature",
      schedule.amTemperature.toString()
    );

    this.publish(
      "esp32/control/schedule/pm/enabled",
      schedule.pmEnabled.toString()
    );
    this.publish("esp32/control/schedule/pm/time", schedule.pmScheduledTime);
    this.publish(
      "esp32/control/schedule/pm/scheduledTime",
      schedule.pmScheduledTime
    );
    this.publish(
      "esp32/control/schedule/pm/temperature",
      schedule.pmTemperature.toString()
    );

    // Set control mode to auto when schedule is enabled
    const scheduleEnabled = schedule.amEnabled || schedule.pmEnabled;
    if (scheduleEnabled) {
      this.publish("esp32/control/mode", "auto");
      console.log("📤 Set control mode to 'auto' because schedule is enabled");
    }

    return success;
  }

  setScheduleEnabled(enabled: boolean): boolean {
    return this.publish("esp32/control/scheduleEnabled", enabled.toString());
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Test connection with detailed logging
  async testConnection(): Promise<{
    success: boolean;
    error?: string;
    details: any;
  }> {
    return new Promise((resolve) => {
      console.log("🧪 Testing MQTT connection...");

      const testClient = mqtt.connect(this.config.brokerUrl, {
        clientId: `test_${Math.random().toString(16).substr(2, 8)}`,
        username: this.config.username,
        password: this.config.password,
        connectTimeout: 10000,
        keepalive: 30,
        clean: true,
        rejectUnauthorized: true,
      });

      const timeout = setTimeout(() => {
        testClient.end(true);
        resolve({
          success: false,
          error: "Connection timeout after 10 seconds",
          details: {
            brokerUrl: this.config.brokerUrl,
            username: this.config.username,
            hasPassword: !!this.config.password,
            timestamp: new Date().toISOString(),
          },
        });
      }, 10000);

      testClient.on("connect", () => {
        clearTimeout(timeout);
        console.log("✅ Test connection successful!");
        testClient.end();
        resolve({
          success: true,
          details: {
            brokerUrl: this.config.brokerUrl,
            username: this.config.username,
            timestamp: new Date().toISOString(),
          },
        });
      });

      testClient.on("error", (error) => {
        clearTimeout(timeout);
        console.error("❌ Test connection failed:", error);
        testClient.end(true);
        resolve({
          success: false,
          error: error.message,
          details: {
            brokerUrl: this.config.brokerUrl,
            username: this.config.username,
            hasPassword: !!this.config.password,
            errorName: error.name,
            timestamp: new Date().toISOString(),
          },
        });
      });
    });
  }
}

export default MQTTManager;
