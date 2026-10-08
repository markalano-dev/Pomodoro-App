import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, UIManager, LayoutAnimation, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MainScreen from '../screens/MainScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PreloaderScreen from '../screens/PreloaderScreen';
import { useSettings } from '../context/SettingsContext';
import { getThemeColors } from '../config/theme';

let Haptics: typeof import('expo-haptics') | null = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Fallback if expo-haptics isn't installed
}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(globalThis as any).nativeFabricUIManager
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SMOOTH_EASE_CONFIG = {
  duration: 280,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

type TabType = 'Home' | 'Archive' | 'Favorites' | 'Settings';

interface TabMeta {
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIG: Record<TabType, TabMeta> = {
  Home: { label: 'Timer', activeIcon: 'timer', inactiveIcon: 'timer-outline' },
  Archive: { label: 'Archive', activeIcon: 'archive', inactiveIcon: 'archive-outline' },
  Favorites: { label: 'Favorites', activeIcon: 'heart', inactiveIcon: 'heart-outline' },
  Settings: { label: 'Settings', activeIcon: 'settings', inactiveIcon: 'settings-outline' },
};

export default function MainTabNavigator() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  const insets = useSafeAreaInsets();
  const settingsContext = useSettings() as any;

  const { themeMode, activeFocusColor } = settingsContext;
  const isLoaded = settingsContext.isLoaded ?? true;

  const isDark = themeMode === 'dark';
  const colors = getThemeColors(isDark);
  const activeAccent = activeFocusColor || colors.accentFocus || '#FF7E67';
  const activePillBg = isDark ? `${activeAccent}33` : `${activeAccent}18`;

  const bottomMargin = Math.max(insets.bottom, 12) + 8;

  if (!isLoaded) {
    return <PreloaderScreen />;
  }

  const triggerHaptic = () => {
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(10);
    }
  };

  const handleTabChange = (tab: TabType) => {
    triggerHaptic();
    LayoutAnimation.configureNext(SMOOTH_EASE_CONFIG);
    setActiveTab(tab);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <MainScreen />;
      case 'Archive':
        return <ArchiveScreen onNavigateHome={() => handleTabChange('Home')} />;
      case 'Favorites':
        return <FavoritesScreen onNavigateHome={() => handleTabChange('Home')} />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <MainScreen />;
    }
  };

  const tabs: TabType[] = ['Home', 'Archive', 'Favorites', 'Settings'];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>{renderScreen()}</View>

      <View style={[styles.floatingContainer, { bottom: bottomMargin }]} pointerEvents="box-none">
        <View
          style={[
            styles.tabBarCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {tabs.map((tab) => {
            const isFocused = activeTab === tab;
            const meta = TAB_CONFIG[tab];

            return (
              <TouchableOpacity
                key={tab}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.75}
                style={[
                  styles.tabItem,
                  isFocused && [styles.activeTabPill, { backgroundColor: activePillBg }],
                ]}
              >
                <Ionicons
                  name={isFocused ? meta.activeIcon : meta.inactiveIcon}
                  size={20}
                  color={isFocused ? activeAccent : colors.textSecondary}
                />

                {isFocused && (
                  <Text style={[styles.activeTabText, { color: activeAccent }]} numberOfLines={1}>
                    {meta.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  floatingContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  tabBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    width: '100%',
    borderRadius: 999,
    paddingHorizontal: 10,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  activeTabPill: {
    paddingHorizontal: 18,
    gap: 8,
  },
  activeTabText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});