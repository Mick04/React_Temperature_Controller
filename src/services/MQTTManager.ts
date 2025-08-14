// MQTT WebSocket client for real-time ESP32 communication
import mqtt from "mqtt";

export interface MQTTConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId?: string;
}

export interface MQTTCallbacks {
  onTemperatureUpdate?: (sensor: string, temperature: number) => void;
  onHeaterStatusUpdate?: (status: boolean) => void;
  onConnectionStatus?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

class MQTTManager {
  private client: mqtt.MqttClient | null = null;
  private callbacks: MQTTCallbacks = {};
  private isConnected = false;
  private config: MQTTConfig;

  constructor(config: MQTTConfig) {
    this.config = config;
  }

  connect(callbacks: MQTTCallbacks = {}) {
    this.callbacks = callbacks;

    const options: mqtt.IClientOptions = {
      clientId:
        this.config.clientId ||
        `react_dashboard_${Math.random().toString(16).substr(2, 8)}`,
      username: this.config.username,
      password: this.config.password,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    };

    try {
      this.client = mqtt.connect(this.config.brokerUrl, options);

      this.client.on("connect", () => {
        console.log("MQTT connected to", this.config.brokerUrl);
        this.isConnected = true;
        this.callbacks.onConnectionStatus?.(true);

        // Subscribe to ESP32 topics
        this.subscribeToTopics();
      });

      this.client.on("message", (topic: string, message: Buffer) => {
        this.handleMessage(topic, message.toString());
      });

      this.client.on("error", (error: Error) => {
        console.error("MQTT error:", error);
        this.callbacks.onError?.(error);
      });

      this.client.on("close", () => {
        console.log("MQTT disconnected");
        this.isConnected = false;
        this.callbacks.onConnectionStatus?.(false);
      });

      this.client.on("reconnect", () => {
        console.log("MQTT reconnecting...");
      });
    } catch (error) {
      console.error("Failed to connect to MQTT broker:", error);
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
    ];

    topics.forEach((topic) => {
      this.client?.subscribe(topic, (error) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    });
  }

  private handleMessage(topic: string, message: string) {
    try {
      console.log(`MQTT message on ${topic}:`, message);

      if (topic.includes("/temperature/")) {
        const sensorType = topic.split("/").pop();
        const temperature = parseFloat(message);

        if (!isNaN(temperature) && sensorType) {
          this.callbacks.onTemperatureUpdate?.(sensorType, temperature);
        }
      } else if (topic.includes("/heaterStatus")) {
        const status = message.toLowerCase() === "true" || message === "1";
        this.callbacks.onHeaterStatusUpdate?.(status);
      }
    } catch (error) {
      console.error("Error parsing MQTT message:", error);
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
}

export default MQTTManager;
