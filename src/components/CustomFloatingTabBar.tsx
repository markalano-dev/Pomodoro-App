import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
  Vibration,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { getThemeColors } from '../config/theme';

let Haptics: typeof import('expo-haptics') | null = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Graceful fallback if expo-haptics isn't installed
}

// Enable LayoutAnimation on Android for Old Architecture
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

interface TabMeta {
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIG: Record<string, TabMeta> = {
  Home: { label: 'Timer', activeIcon: 'timer', inactiveIcon: 'timer-outline' },
  Main: { label: 'Timer', activeIcon: 'timer', inactiveIcon: 'timer-outline' },
  Archive: { label: 'Archive', activeIcon: 'archive', inactiveIcon: 'archive-outline' },
  Favorites: { label: 'Favorites', activeIcon: 'heart', inactiveIcon: 'heart-outline' },
  Settings: { label: 'Settings', activeIcon: 'settings', inactiveIcon: 'settings-outline' },
};

export default function CustomFloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { themeMode, activeFocusColor } = useSettings() as any;
  const isDark = themeMode === 'dark';
  const colors = getThemeColors(isDark);

  const activeAccent = activeFocusColor || colors.accentFocus || '#FF7E67';
  const activePillBg = isDark ? `${activeAccent}33` : `${activeAccent}18`;

  const bottomMargin = Math.max(insets.bottom, 12) + 8;

  const triggerHaptic = () => {
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(10);
    }
  };

  const handleTabPress = (route: any, isFocused: boolean) => {
    triggerHaptic();

    // Trigger dynamic layout morphing with smooth easing
    LayoutAnimation.configureNext(SMOOTH_EASE_CONFIG);

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
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
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const meta = TAB_CONFIG[route.name] || {
            label: route.name,
            activeIcon: 'square',
            inactiveIcon: 'square-outline',
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={() => handleTabPress(route, isFocused)}
              onLongPress={() => {
                triggerHaptic();
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              }}
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
                <Text numberOfLines={1} style={[styles.activeTabText, { color: activeAccent }]}>
                  {meta.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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