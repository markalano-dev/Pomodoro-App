import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export default function PreloaderScreen() {
  const { themeMode, activeFocusColor } = useSettings();
  const isDark = themeMode === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8f9fa' }]}>
      <View style={styles.brandContainer}>
        <View style={[styles.iconCircle, { backgroundColor: activeFocusColor || '#e74c3c' }]}>
          <Ionicons name="timer" size={48} color="#ffffff" />
        </View>
        <Text style={[styles.appName, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
          Pomodoro Focus
        </Text>
        <Text style={[styles.tagline, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
          Preparing your workspace... ⚡
        </Text>
      </View>

      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={activeFocusColor || '#e74c3c'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  loaderContainer: {
    marginTop: 20,
  },
});