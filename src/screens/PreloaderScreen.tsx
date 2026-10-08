import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Image } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { MASCOT_HERO_ASSETS } from '../config/mascotAssets';

export default function PreloaderScreen() {
  const { themeMode, activeFocusColor } = useSettings();
  const isDark = themeMode === 'dark';

  const colors = {
    bg: isDark ? '#12131C' : '#F9F8F6',
    card: isDark ? '#1D1E2A' : '#FFFFFF',
    textPrimary: isDark ? '#FFFFFF' : '#1D1E2A',
    textSecondary: isDark ? '#8A8C9E' : '#7F8C8D',
    accent: activeFocusColor || '#FFA07A',
    border: isDark ? '#2A2B3C' : '#E8E6E1',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image
          source={MASCOT_HERO_ASSETS.PRELOADER}
          style={styles.mascotImage}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: colors.textPrimary }]}>
          Pomodoro Focus
        </Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Preparing your workspace... ⚡
        </Text>
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.loader}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  mascotImage: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
  },
  loader: {
    marginTop: 8,
  },
});