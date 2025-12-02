import mqtt from 'mqtt'
import type { IClientPublishOptions } from 'mqtt'

const BROKER_WS = process.env.MQTT_WS_URL || 'wss://lightingsys-f32f9e74.a02.usw2.aws.hivemq.cloud:8884/mqtt';
const USER = process.env.MQTT_USER || 'austingo';
const PASS = process.env.MQTT_PASS || 'All0fthelights';
const CLIENT_ID = `expo-${Math.random().toString(16).slice(2, 10)}`;

export const mqttClient = mqtt.connect(BROKER_WS, {
  clientId: CLIENT_ID,
  username: USER,
  password: PASS,
  protocol: 'wss',      // MUST be wss for Expo
  reconnectPeriod: 2000,
  connectTimeout: 30_000,
});

let isConnected = false;
const publishQueue: Array<{
  topic: string;
  msg: string;
  opts: IClientPublishOptions;
  resolve: (v?: any) => void;
  reject: (e?: any) => void;
}> = [];

function flushQueue() {
  while (publishQueue.length && isConnected) {
    const item = publishQueue.shift()!;
    mqttClient.publish(item.topic, item.msg, item.opts as any, (err) => {
      if (err) item.reject(err);
      else item.resolve(true);
    });
  }
}

mqttClient.on('connect', () => {
  isConnected = true;
  console.log('MQTT connected');
  mqttClient.subscribe('lighting/+/status', { qos: 1 }, (err, granted) => {
    if (err) {
      console.warn('MQTT subscribe error', err);
    } else {
      console.log('MQTT subscribed', granted);
    }
  });
  flushQueue();
});
mqttClient.on('close', () => { isConnected = false; console.log('MQTT closed'); });
mqttClient.on('offline', () => { isConnected = false; console.log('MQTT offline'); });
mqttClient.on('reconnect', () => console.log('MQTT reconnecting'));
mqttClient.on('error', (err) => console.warn('MQTT error', err));
mqttClient.on('message', (topic, payload) => console.log('MQTT message', topic, payload?.toString()));

export function publishCommand(
  topic: string,
  payload: any, // allow number/string as well as objects
  opts: IClientPublishOptions = { qos: 1, retain: false }
): Promise<void> {
  const msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    if (isConnected && mqttClient && mqttClient.connected) {
      mqttClient.publish(topic, msg, opts as any, (err) => (err ? reject(err) : resolve()));
    } else {
      publishQueue.push({ topic, msg, opts, resolve, reject } as any);
      console.log('MQTT not connected yet — queued publish for', topic);
    }
  });
}