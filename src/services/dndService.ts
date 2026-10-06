import { Platform, Alert, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

export const requestDndPermission = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    Alert.alert(
      'Do Not Disturb Access',
      'To enable automatic Do Not Disturb during focus sessions, please grant DND permission in your settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: async () => {
            try {
              await IntentLauncher.startActivityAsync(
                IntentLauncher.ActivityAction.NOTIFICATION_POLICY_ACCESS_SETTINGS
              );
            } catch (error) {
              // Fallback to general app settings
              Linking.openSettings();
            }
          },
        },
      ]
    );
  } else if (Platform.OS === 'ios') {
    Alert.alert(
      'Focus Mode Reminder',
      'iOS restricts third-party apps from toggling Do Not Disturb directly. Please turn on Focus Mode from your Control Center during focus sessions.',
      [{ text: 'Got it' }]
    );
  }
};