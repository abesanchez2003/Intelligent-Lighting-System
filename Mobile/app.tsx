import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';

// apply polyfills required by mqtt.js in Expo
global.Buffer = global.Buffer ?? Buffer;
global.process = global.process ?? process;

// ensure the mqtt client module initializes on app start
import './app/(commands)/mqttclient';

// re-export expo-router entry (keeps your existing app/ routing)
export { default } from 'expo-router';