import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export type ThemeMode = 'light' | 'dark';

export interface SettingsState {
  username: string;
  profileImage: string | null;
  themeMode: ThemeMode;
  vibrationEnabled: boolean;
  activeFocusColor: string;
}

interface SettingsContextType extends SettingsState {
  setUsername: (name: string) => void;
  setProfileImage: (imageUri: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setVibrationEnabled: (enabled: boolean) => void;
  toggleVibration: () => void;
  setActiveFocusColor: (color: string) => void;
  saveSettings: (newSettings?: Partial<SettingsState>) => Promise<void>;
  resetAppSettings: () => Promise<void>;
  isLoaded: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  username: '',
  profileImage: null,
  themeMode: 'light',
  vibrationEnabled: true,
  activeFocusColor: '#FF7E67',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>(DEFAULT_SETTINGS.username);
  const [profileImage, setProfileImage] = useState<string | null>(DEFAULT_SETTINGS.profileImage);
  const [themeMode, setThemeMode] = useState<ThemeMode>(DEFAULT_SETTINGS.themeMode);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(DEFAULT_SETTINGS.vibrationEnabled);
  const [activeFocusColor, setActiveFocusColor] = useState<string>(DEFAULT_SETTINGS.activeFocusColor);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Helper function to build user-scoped storage key
  const getStorageKey = (uid: string | null) => {
    return uid ? `@pomodoro_app_settings_${uid}` : '@pomodoro_app_settings_guest';
  };

  useEffect(() => {
    // Listen for authentication state changes and load user-specific settings
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoaded(false);

      if (currentUser) {
        try {
          const userKey = getStorageKey(currentUser.uid);
          const savedSettings = await AsyncStorage.getItem(userKey);

          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setUsername(parsed.username ?? '');
            setProfileImage(parsed.profileImage ?? null);
            setThemeMode(parsed.themeMode ?? DEFAULT_SETTINGS.themeMode);
            setVibrationEnabled(parsed.vibrationEnabled ?? DEFAULT_SETTINGS.vibrationEnabled);
            setActiveFocusColor(parsed.activeFocusColor ?? DEFAULT_SETTINGS.activeFocusColor);
          } else {
            // Fresh account with no prior saved settings: set clean defaults
            setUsername('');
            setProfileImage(null);
            setThemeMode(DEFAULT_SETTINGS.themeMode);
            setVibrationEnabled(DEFAULT_SETTINGS.vibrationEnabled);
            setActiveFocusColor(DEFAULT_SETTINGS.activeFocusColor);
          }
        } catch (error) {
          console.warn('Failed to load user settings:', error);
        }
      } else {
        // Logged out: reset to default state
        setUsername(DEFAULT_SETTINGS.username);
        setProfileImage(DEFAULT_SETTINGS.profileImage);
        setThemeMode(DEFAULT_SETTINGS.themeMode);
        setVibrationEnabled(DEFAULT_SETTINGS.vibrationEnabled);
        setActiveFocusColor(DEFAULT_SETTINGS.activeFocusColor);
      }

      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleVibration = () => {
    setVibrationEnabled((prev) => !prev);
  };

  const saveSettings = async (overrides?: Partial<SettingsState>) => {
    try {
      const uid = auth.currentUser?.uid || null;
      const userKey = getStorageKey(uid);

      const dataToSave: SettingsState = {
        username: overrides?.username ?? username,
        profileImage: overrides?.profileImage !== undefined ? overrides.profileImage : profileImage,
        themeMode: overrides?.themeMode ?? themeMode,
        vibrationEnabled: overrides?.vibrationEnabled ?? vibrationEnabled,
        activeFocusColor: overrides?.activeFocusColor ?? activeFocusColor,
      };

      await AsyncStorage.setItem(userKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save user settings:', error);
      throw error;
    }
  };

  const resetAppSettings = async () => {
    try {
      const uid = auth.currentUser?.uid || null;
      const userKey = getStorageKey(uid);
      await AsyncStorage.removeItem(userKey);
    } catch (error) {
      console.warn('Failed to clear user settings storage:', error);
    }

    setUsername(DEFAULT_SETTINGS.username);
    setProfileImage(DEFAULT_SETTINGS.profileImage);
    setThemeMode(DEFAULT_SETTINGS.themeMode);
    setVibrationEnabled(DEFAULT_SETTINGS.vibrationEnabled);
    setActiveFocusColor(DEFAULT_SETTINGS.activeFocusColor);
  };

  return (
    <SettingsContext.Provider
      value={{
        username,
        setUsername,
        profileImage,
        setProfileImage,
        themeMode,
        setThemeMode,
        toggleThemeMode,
        vibrationEnabled,
        setVibrationEnabled,
        toggleVibration,
        activeFocusColor,
        setActiveFocusColor,
        saveSettings,
        resetAppSettings,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};