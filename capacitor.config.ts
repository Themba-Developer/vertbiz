import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vertbiz.app',
  appName: 'VertBiz',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
  ios: {
    backgroundColor: '#ffffff',
    contentInset: 'automatic',
  },
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'www.payfast.co.za',
      'sandbox.payfast.co.za',
      'vertbiz.online',
      'www.vertbiz.online',
    ],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidScaleType: 'CENTER_INSIDE',
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
