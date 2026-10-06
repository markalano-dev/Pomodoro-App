import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MainScreen from '../screens/MainScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { TimerProvider } from '../context/TimerContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

type TabType = 'Home' | 'Archive' | 'Settings';

function MainTabNavigatorContent() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  const { themeMode } = useSettings();
  const isDark = themeMode === 'dark';
  const insets = useSafeAreaInsets();

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <MainScreen />;
      case 'Archive':
        return <ArchiveScreen onNavigateHome={() => setActiveTab('Home')} />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <MainScreen />;
    }
  };

  const dynamicBottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8f9fa' }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.content}>{renderScreen()}</View>

      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            borderTopColor: isDark ? '#2c2c2c' : '#ecf0f1',
            paddingBottom: dynamicBottomPadding,
            height: 60 + dynamicBottomPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'Home' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'Home' ? '#e74c3c' : '#95a5a6'}
          />
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.activeTabLabel]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Archive')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'Archive' ? 'archive' : 'archive-outline'}
            size={24}
            color={activeTab === 'Archive' ? '#e74c3c' : '#95a5a6'}
          />
          <Text style={[styles.tabLabel, activeTab === 'Archive' && styles.activeTabLabel]}>
            Archive
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'Settings' ? 'settings' : 'settings-outline'}
            size={24}
            color={activeTab === 'Settings' ? '#e74c3c' : '#95a5a6'}
          />
          <Text style={[styles.tabLabel, activeTab === 'Settings' && styles.activeTabLabel]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function MainTabNavigator() {
  return (
    <SettingsProvider>
      <TimerProvider>
        <MainTabNavigatorContent />
      </TimerProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#95a5a6',
    marginTop: 3,
  },
  activeTabLabel: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});