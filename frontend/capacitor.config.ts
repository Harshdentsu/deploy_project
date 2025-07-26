import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.wheely',
  appName: 'Wheely',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://thankful-cliff-024e50a10.1.azurestaticapps.net/',
    cleartext: false,
  },
};

export default config;
