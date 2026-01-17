import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2ea52af943fe4cc4ab0c632b81db0cd5',
  appName: 'aibuddyassistant',
  webDir: 'dist',
  server: {
    url: 'https://2ea52af9-43fe-4cc4-ab0c-632b81db0cd5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  }
};

export default config;
