import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TimerProvider } from '../context/TimerContext';
import { SettingsProvider } from '../context/SettingsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <TimerProvider>
          <StatusBar style="auto" />
          <Slot />
        </TimerProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}