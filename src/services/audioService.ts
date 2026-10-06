import { NativeModules, Alert } from 'react-native';

export interface StockSound {
  id: string;
  name: string;
  uri: string;
}

export const STOCK_RINGTONES: StockSound[] = [
  {
    id: 'chime',
    name: 'Gentle Chime 🔔',
    uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  },
  {
    id: 'digital',
    name: 'Digital Beep ⏰',
    uri: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm.ogg',
  },
  {
    id: 'bell',
    name: 'Classic Bell 🔔',
    uri: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
  },
  {
    id: 'marimba',
    name: 'Marimba Pulse 🎶',
    uri: 'https://actions.google.com/sounds/v1/alarms/medium_bell_ringing.ogg',
  },
];

let soundInstance: any = null;

// Inspect if native ExponentAV bridge exists in current app build before requiring
const isAudioNativeModuleAvailable = (): boolean => {
  const hasLegacy = !!NativeModules.ExponentAV;
  const hasExpoModule = !!(globalThis as any)?.expo?.modules?.ExponentAV;
  return hasLegacy || hasExpoModule;
};

const getAudioModule = () => {
  if (!isAudioNativeModuleAvailable()) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expoAv = require('expo-av');
    return expoAv?.Audio || null;
  } catch (error) {
    console.warn('Unable to load expo-av module:', error);
    return null;
  }
};

export const playRingtone = async (ringtoneId: string, shouldLoop: boolean = false) => {
  try {
    await stopRingtone();

    const Audio = getAudioModule();
    if (!Audio || !Audio.Sound) {
      Alert.alert(
        'Rebuild App for Sound 🔔',
        'Native audio support (expo-av) requires rebuilding your app native binary. Please stop Metro and run "npx expo run:android" (or "npx expo start -c" for Expo Go) to link audio support.'
      );
      return;
    }

    const selected = STOCK_RINGTONES.find((item) => item.id === ringtoneId) || STOCK_RINGTONES[0];

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: selected.uri },
      { shouldPlay: true, isLooping: shouldLoop }
    );

    soundInstance = sound;
  } catch (error) {
    console.error('Error playing ringtone sound:', error);
  }
};

export const stopRingtone = async () => {
  if (soundInstance) {
    try {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
    } catch (error) {
      // Catch cleanup errors
    } finally {
      soundInstance = null;
    }
  }
};