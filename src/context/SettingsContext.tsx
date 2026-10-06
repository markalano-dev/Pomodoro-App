import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export type ThemeMode = 'light' | 'dark';

interface SettingsContextType {
  username: string;
  profileImage: string | null;
  updateUserProfile: (name: string, imageUri: string | null) => Promise<void>;
  
  // Timer Defaults
  defaultFocusDuration: string;
  defaultBreakDuration: string;
  defaultSessions: string;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  
  // Ringtone & Alerts
  ringtoneEnabled: boolean;
  selectedRingtone: string;
  vibrationEnabled: boolean;
  loopingAlarm: boolean;
  
  // Theme & Accents
  themeMode: ThemeMode;
  lightFocusColor: string;
  lightBreakColor: string;
  darkFocusColor: string;
  darkBreakColor: string;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setLightFocusColor: (color: string) => void;
  setLightBreakColor: (color: string) => void;
  setDarkFocusColor: (color: string) => void;
  setDarkBreakColor: (color: string) => void;
  setAutoStartBreaks: (val: boolean) => void;
  setAutoStartFocus: (val: boolean) => void;
  setRingtoneEnabled: (val: boolean) => void;
  setSelectedRingtone: (soundId: string) => void;
  setVibrationEnabled: (val: boolean) => void;
  setLoopingAlarm: (val: boolean) => void;
  saveTimerDefaults: (focus: string, breakDur: string, sessions: string) => Promise<void>;
  resetToFactoryDefaults: () => Promise<void>;
  
  // Computed Active Accents
  activeFocusColor: string;
  activeBreakColor: string;

  // Preloader State
  isSettingsLoaded: boolean;
}

const SETTINGS_KEY = '@pomodoro_user_settings_v4';

const defaultSettings = {
  username: '',
  profileImage: null,
  defaultFocusDuration: '',
  defaultBreakDuration: '',
  defaultSessions: '',
  autoStartBreaks: false,
  autoStartFocus: false,
  ringtoneEnabled: false,
  selectedRingtone: 'chime',
  vibrationEnabled: true,
  loopingAlarm: true,
  themeMode: 'light' as ThemeMode,
  lightFocusColor: '#e74c3c',
  lightBreakColor: '#2ecc71',
  darkFocusColor: '#ff6b6b',
  darkBreakColor: '#51cf66',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [username, setUsername] = useState(defaultSettings.username);
  const [profileImage, setProfileImage] = useState<string | null>(defaultSettings.profileImage);
  const [defaultFocusDuration, setDefaultFocusDuration] = useState(defaultSettings.defaultFocusDuration);
  const [defaultBreakDuration, setDefaultBreakDuration] = useState(defaultSettings.defaultBreakDuration);
  const [defaultSessions, setDefaultSessions] = useState(defaultSettings.defaultSessions);
  const [autoStartBreaks, setAutoStartBreaks] = useState(defaultSettings.autoStartBreaks);
  const [autoStartFocus, setAutoStartFocus] = useState(defaultSettings.autoStartFocus);
  const [ringtoneEnabled, setRingtoneEnabledState] = useState(defaultSettings.ringtoneEnabled);
  const [selectedRingtone, setSelectedRingtoneState] = useState(defaultSettings.selectedRingtone);
  const [vibrationEnabled, setVibrationEnabled] = useState(defaultSettings.vibrationEnabled);
  const [loopingAlarm, setLoopingAlarm] = useState(defaultSettings.loopingAlarm);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultSettings.themeMode);
  
  const [lightFocusColor, setLightFocusColorState] = useState(defaultSettings.lightFocusColor);
  const [lightBreakColor, setLightBreakColorState] = useState(defaultSettings.lightBreakColor);
  const [darkFocusColor, setDarkFocusColorState] = useState(defaultSettings.darkFocusColor);
  const [darkBreakColor, setDarkBreakColorState] = useState(defaultSettings.darkBreakColor);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Guarantees preloader stays on screen for at least 1.2s for a smooth transition
    const minPreloaderDelay = new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.username !== undefined) setUsername(data.username);
        if (data.profileImage !== undefined) setProfileImage(data.profileImage);
        if (data.defaultFocusDuration !== undefined) setDefaultFocusDuration(data.defaultFocusDuration);
        if (data.defaultBreakDuration !== undefined) setDefaultBreakDuration(data.defaultBreakDuration);
        if (data.defaultSessions !== undefined) setDefaultSessions(data.defaultSessions);
        if (data.autoStartBreaks !== undefined) setAutoStartBreaks(data.autoStartBreaks);
        if (data.autoStartFocus !== undefined) setAutoStartFocus(data.autoStartFocus);
        if (data.ringtoneEnabled !== undefined) setRingtoneEnabledState(data.ringtoneEnabled);
        if (data.selectedRingtone) setSelectedRingtoneState(data.selectedRingtone);
        if (data.vibrationEnabled !== undefined) setVibrationEnabled(data.vibrationEnabled);
        if (data.loopingAlarm !== undefined) setLoopingAlarm(data.loopingAlarm);
        if (data.themeMode) setThemeModeState(data.themeMode);
        if (data.lightFocusColor) setLightFocusColorState(data.lightFocusColor);
        if (data.lightBreakColor) setLightBreakColorState(data.lightBreakColor);
        if (data.darkFocusColor) setDarkFocusColorState(data.darkFocusColor);
        if (data.darkBreakColor) setDarkBreakColorState(data.darkBreakColor);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      await minPreloaderDelay;
      setIsSettingsLoaded(true);
    }
  };

  const persistSettings = async (overrides = {}) => {
    try {
      const payload = {
        username,
        profileImage,
        defaultFocusDuration,
        defaultBreakDuration,
        defaultSessions,
        autoStartBreaks,
        autoStartFocus,
        ringtoneEnabled,
        selectedRingtone,
        vibrationEnabled,
        loopingAlarm,
        themeMode,
        lightFocusColor,
        lightBreakColor,
        darkFocusColor,
        darkBreakColor,
        ...overrides,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
  };

  const updateUserProfile = async (name: string, imageUri: string | null) => {
    setUsername(name);
    setProfileImage(imageUri);
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: imageUri || undefined,
        });
      } catch (err) {
        console.error('Error updating auth profile:', err);
      }
    }
    await persistSettings({ username: name, profileImage: imageUri });
  };

  const saveTimerDefaults = async (focus: string, breakDur: string, sessions: string) => {
    setDefaultFocusDuration(focus);
    setDefaultBreakDuration(breakDur);
    setDefaultSessions(sessions);
    await persistSettings({
      defaultFocusDuration: focus,
      defaultBreakDuration: breakDur,
      defaultSessions: sessions,
    });
  };

  const setRingtoneEnabled = (val: boolean) => {
    setRingtoneEnabledState(val);
    persistSettings({ ringtoneEnabled: val });
  };

  const setSelectedRingtone = (soundId: string) => {
    setSelectedRingtoneState(soundId);
    persistSettings({ selectedRingtone: soundId });
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    persistSettings({ themeMode: mode });
  };

  const setLightFocusColor = (color: string) => {
    setLightFocusColorState(color);
    persistSettings({ lightFocusColor: color });
  };

  const setLightBreakColor = (color: string) => {
    setLightBreakColorState(color);
    persistSettings({ lightBreakColor: color });
  };

  const setDarkFocusColor = (color: string) => {
    setDarkFocusColorState(color);
    persistSettings({ darkFocusColor: color });
  };

  const setDarkBreakColor = (color: string) => {
    setDarkBreakColorState(color);
    persistSettings({ darkBreakColor: color });
  };

  const resetToFactoryDefaults = async () => {
    setUsername(defaultSettings.username);
    setProfileImage(defaultSettings.profileImage);
    setDefaultFocusDuration(defaultSettings.defaultFocusDuration);
    setDefaultBreakDuration(defaultSettings.defaultBreakDuration);
    setDefaultSessions(defaultSettings.defaultSessions);
    setAutoStartBreaks(defaultSettings.autoStartBreaks);
    setAutoStartFocus(defaultSettings.autoStartFocus);
    setRingtoneEnabledState(defaultSettings.ringtoneEnabled);
    setSelectedRingtoneState(defaultSettings.selectedRingtone);
    setVibrationEnabled(defaultSettings.vibrationEnabled);
    setLoopingAlarm(defaultSettings.loopingAlarm);
    setThemeModeState(defaultSettings.themeMode);
    setLightFocusColorState(defaultSettings.lightFocusColor);
    setLightBreakColorState(defaultSettings.lightBreakColor);
    setDarkFocusColorState(defaultSettings.darkFocusColor);
    setDarkBreakColorState(defaultSettings.darkBreakColor);
    await AsyncStorage.removeItem(SETTINGS_KEY);
  };

  const isDark = themeMode === 'dark';
  const activeFocusColor = isDark ? darkFocusColor : lightFocusColor;
  const activeBreakColor = isDark ? darkBreakColor : lightBreakColor;

  return (
    <SettingsContext.Provider
      value={{
        isSettingsLoaded,
        username,
        profileImage,
        updateUserProfile,
        defaultFocusDuration,
        defaultBreakDuration,
        defaultSessions,
        autoStartBreaks,
        autoStartFocus,
        ringtoneEnabled,
        selectedRingtone,
        vibrationEnabled,
        loopingAlarm,
        themeMode,
        lightFocusColor,
        lightBreakColor,
        darkFocusColor,
        darkBreakColor,
        setThemeMode,
        setLightFocusColor,
        setLightBreakColor,
        setDarkFocusColor,
        setDarkBreakColor,
        setAutoStartBreaks: (val) => { setAutoStartBreaks(val); persistSettings({ autoStartBreaks: val }); },
        setAutoStartFocus: (val) => { setAutoStartFocus(val); persistSettings({ autoStartFocus: val }); },
        setRingtoneEnabled,
        setSelectedRingtone,
        setVibrationEnabled: (val) => { setVibrationEnabled(val); persistSettings({ vibrationEnabled: val }); },
        setLoopingAlarm: (val) => { setLoopingAlarm(val); persistSettings({ loopingAlarm: val }); },
        saveTimerDefaults,
        resetToFactoryDefaults,
        activeFocusColor,
        activeBreakColor,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};