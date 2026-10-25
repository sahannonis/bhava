import type { CapacitorConfig } from '@capacitor/cli';

// The appId can never change once the app is on Google Play.
const config: CapacitorConfig = {
  appId: 'com.twelfthhouseprotocol.bhava',
  appName: 'Bhava',
  webDir: 'dist',
  backgroundColor: '#d6c28c',
  android: {
    allowMixedContent: false,
  },
};

export default config;
