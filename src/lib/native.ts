import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

// Check if running on native platform
export const isNative = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

// Initialize native capabilities
export const initNative = async () => {
  if (!isNative()) return;

  // Request notification permissions
  const permResult = await LocalNotifications.requestPermissions();
  console.log('Notification permission:', permResult.display);

  // Listen for app state changes
  App.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active?', isActive);
  });

  // Listen for deep links
  App.addListener('appUrlOpen', ({ url }) => {
    console.log('App opened with URL:', url);
  });
};

// Schedule a local notification for timer
export const scheduleTimerNotification = async (
  id: number,
  title: string,
  body: string,
  delaySeconds: number
) => {
  if (!isNative()) {
    // Web fallback using Notification API
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setTimeout(() => {
          new Notification(title, { body, icon: '/favicon.ico' });
        }, delaySeconds * 1000);
      }
    }
    return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: { at: new Date(Date.now() + delaySeconds * 1000) },
        sound: 'beep.wav',
        attachments: undefined,
        actionTypeId: '',
        extra: null
      }
    ]
  });
};

// Cancel a scheduled notification
export const cancelNotification = async (id: number) => {
  if (!isNative()) return;
  
  await LocalNotifications.cancel({ notifications: [{ id }] });
};

// Show immediate notification
export const showNotification = async (title: string, body: string) => {
  const id = Math.floor(Math.random() * 100000);
  
  if (!isNative()) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: { at: new Date(Date.now() + 100) }, // Immediate
        sound: 'beep.wav',
        attachments: undefined,
        actionTypeId: '',
        extra: null
      }
    ]
  });
};

// Open app by package name / URL scheme
const APP_SCHEMES: Record<string, { android: string; ios: string; web: string }> = {
  spotify: {
    android: 'spotify://',
    ios: 'spotify://',
    web: 'https://open.spotify.com'
  },
  youtube: {
    android: 'vnd.youtube://',
    ios: 'youtube://',
    web: 'https://youtube.com'
  },
  google: {
    android: 'googlechrome://',
    ios: 'googlechrome://',
    web: 'https://google.com'
  },
  maps: {
    android: 'geo:0,0?q=',
    ios: 'maps://',
    web: 'https://maps.google.com'
  },
  twitter: {
    android: 'twitter://',
    ios: 'twitter://',
    web: 'https://twitter.com'
  },
  x: {
    android: 'twitter://',
    ios: 'twitter://',
    web: 'https://x.com'
  },
  gmail: {
    android: 'googlegmail://',
    ios: 'googlegmail://',
    web: 'https://mail.google.com'
  },
  whatsapp: {
    android: 'whatsapp://',
    ios: 'whatsapp://',
    web: 'https://web.whatsapp.com'
  }
};

export const openApp = async (appName: string): Promise<boolean> => {
  const app = APP_SCHEMES[appName.toLowerCase()];
  
  if (!app) {
    // Try generic web search
    await Browser.open({ url: `https://www.google.com/search?q=${encodeURIComponent(appName)}` });
    return true;
  }

  const platform = getPlatform();

  if (platform === 'android' || platform === 'ios') {
    const scheme = platform === 'android' ? app.android : app.ios;
    try {
      await Browser.open({ url: scheme });
      return true;
    } catch {
      // Fallback to web
      await Browser.open({ url: app.web });
      return true;
    }
  }

  // Web fallback
  window.open(app.web, '_blank');
  return true;
};

// Vibrate device
export const vibrate = (pattern: number[] = [100, 50, 100]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};
