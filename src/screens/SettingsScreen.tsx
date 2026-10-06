import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ColorPicker from 'react-native-wheel-color-picker';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { useSettings } from '../context/SettingsContext';
import { requestDndPermission } from '../services/dndService';
import { STOCK_RINGTONES, playRingtone, stopRingtone } from '../services/audioService';

export default function SettingsScreen() {
  const {
    username,
    profileImage,
    updateUserProfile,
    defaultFocusDuration,
    defaultBreakDuration,
    defaultSessions,
    saveTimerDefaults,
    autoStartBreaks,
    setAutoStartBreaks,
    autoStartFocus,
    setAutoStartFocus,
    ringtoneEnabled,
    setRingtoneEnabled,
    selectedRingtone,
    setSelectedRingtone,
    vibrationEnabled,
    setVibrationEnabled,
    loopingAlarm,
    setLoopingAlarm,
    themeMode,
    setThemeMode,
    lightFocusColor,
    setLightFocusColor,
    lightBreakColor,
    setLightBreakColor,
    darkFocusColor,
    setDarkFocusColor,
    darkBreakColor,
    setDarkBreakColor,
    resetToFactoryDefaults,
  } = useSettings();

  const isDark = themeMode === 'dark';

  const [editUsername, setEditUsername] = useState(username);
  const [focusInput, setFocusInput] = useState(defaultFocusDuration);
  const [breakInput, setBreakInput] = useState(defaultBreakDuration);
  const [sessionsInput, setSessionsInput] = useState(defaultSessions);

  const [ringtoneModalVisible, setRingtoneModalVisible] = useState(false);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);

  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [targetColorKey, setTargetColorKey] = useState<
    'lightFocus' | 'lightBreak' | 'darkFocus' | 'darkBreak' | null
  >(null);
  const [tempColor, setTempColor] = useState('#e74c3c');

  const showSettingInfo = (title: string, description: string) => {
    Alert.alert(`💡 ${title}`, description, [{ text: 'Got it 👍' }]);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied 🚫', 'Permission to access your image gallery is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      await updateUserProfile(editUsername, result.assets[0].uri);
      Alert.alert('Profile Photo Updated! 📸✨');
    }
  };

  const handleSaveProfile = async () => {
    await updateUserProfile(editUsername.trim(), profileImage);
    Alert.alert('Profile Saved! 👤✨', 'Your display name has been updated successfully.');
  };

  const handleSaveDefaults = async () => {
    await saveTimerDefaults(focusInput, breakInput, sessionsInput);
    Alert.alert('Presets Saved! ⚙️🚀', 'Your default timer parameters are now saved and active.');
  };

  const handlePasswordReset = async () => {
    if (!auth.currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      Alert.alert(
        'Password Reset Sent! 🔑📧',
        `A secure reset link has been dispatched to ${auth.currentUser.email}`
      );
    } catch (err: any) {
      Alert.alert('Reset Failed ❌', err.message);
    }
  };

  const handleFactoryResetConfirm = () => {
    Alert.alert(
      '⚠️ Restore Factory Defaults?',
      'Are you sure you want to reset all app settings?\n\nThis will revert your display name, profile photo, timer presets, sound alarms, and color themes back to default.\n\nNote: Your completed task archive and favorites will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Settings',
          style: 'destructive',
          onPress: async () => {
            await resetToFactoryDefaults();
            setEditUsername('');
            setFocusInput('');
            setBreakInput('');
            setSessionsInput('');
            Alert.alert('App Reset Complete! 🔄✨', 'All app settings have been restored to factory defaults.');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out 👋', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error: any) {
            Alert.alert('Logout Error ❌', error.message);
          }
        },
      },
    ]);
  };

  const handlePreviewSound = async (id: string) => {
    if (previewPlayingId === id) {
      await stopRingtone();
      setPreviewPlayingId(null);
    } else {
      setPreviewPlayingId(id);
      await playRingtone(id, false);
    }
  };

  const handleSelectRingtone = async (id: string) => {
    await stopRingtone();
    setPreviewPlayingId(null);
    setSelectedRingtone(id);
    setRingtoneModalVisible(false);
  };

  const closeRingtoneModal = async () => {
    await stopRingtone();
    setPreviewPlayingId(null);
    setRingtoneModalVisible(false);
  };

  const openColorPicker = (
    key: 'lightFocus' | 'lightBreak' | 'darkFocus' | 'darkBreak',
    currentColor: string
  ) => {
    setTargetColorKey(key);
    setTempColor(currentColor);
    setColorModalVisible(true);
  };

  const handleApplyColor = () => {
    if (targetColorKey === 'lightFocus') setLightFocusColor(tempColor);
    if (targetColorKey === 'lightBreak') setLightBreakColor(tempColor);
    if (targetColorKey === 'darkFocus') setDarkFocusColor(tempColor);
    if (targetColorKey === 'darkBreak') setDarkBreakColor(tempColor);

    setColorModalVisible(false);
    setTargetColorKey(null);
  };

  const currentRingtoneObj =
    STOCK_RINGTONES.find((r) => r.id === selectedRingtone) || STOCK_RINGTONES[0];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8f9fa' }]}>
      <Text style={[styles.title, { color: isDark ? '#ffffff' : '#2c3e50' }]}>Settings ⚙️</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
        Customize profile, audio ringtones, and color accents
      </Text>

      {/* User Profile Card */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
        <Text style={styles.sectionHeader}>User Profile 👤</Text>

        <View style={styles.profileRow}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatarFallback, { backgroundColor: isDark ? '#2c2c2c' : '#34495e' }]}>
                <Ionicons name="camera" size={20} color="#ffffff" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="pencil" size={10} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <View style={styles.labelWithInfo}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#bbb' : '#7f8c8d' }]}>Display Name</Text>
              <TouchableOpacity
                onPress={() =>
                  showSettingInfo(
                    'Display Name',
                    'This name will be displayed at the top of your Home tab instead of your registered email address.'
                  )
                }
              >
                <Ionicons name="information-circle-outline" size={15} color={isDark ? '#aaa' : '#7f8c8d'} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#bdc3c7',
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
                },
              ]}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="e.g. Focus Champ ⚡"
              placeholderTextColor={isDark ? '#666' : '#a0a0a0'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile}>
          <Text style={styles.saveProfileBtnText}>Update Display Name</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#ecf0f1' }]} />

        <TouchableOpacity style={styles.rowBetween} onPress={handlePasswordReset}>
          <View style={styles.rowLeft}>
            <Ionicons name="key-outline" size={18} color={isDark ? '#aaa' : '#34495e'} />
            <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>Send Password Reset Link</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Default Timer Settings */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
        <Text style={styles.sectionHeader}>Default Timer Presets ⏱️</Text>

        <View style={styles.inlineInputsRow}>
          <View style={styles.inputBox}>
            <View style={styles.labelWithInfo}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#bbb' : '#7f8c8d' }]}>Focus (min)</Text>
              <TouchableOpacity
                onPress={() =>
                  showSettingInfo(
                    'Default Focus Duration',
                    'Sets the initial focus session time in minutes whenever you open or reset the app.'
                  )
                }
              >
                <Ionicons name="information-circle-outline" size={14} color={isDark ? '#aaa' : '#7f8c8d'} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.smallInput,
                {
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#bdc3c7',
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
                },
              ]}
              keyboardType="number-pad"
              value={focusInput}
              placeholder="e.g. 25"
              placeholderTextColor={isDark ? '#666' : '#a0a0a0'}
              onChangeText={setFocusInput}
            />
          </View>

          <View style={styles.inputBox}>
            <View style={styles.labelWithInfo}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#bbb' : '#7f8c8d' }]}>Break (min)</Text>
              <TouchableOpacity
                onPress={() =>
                  showSettingInfo(
                    'Default Break Duration',
                    'Sets the initial break duration in minutes whenever a session configuration is loaded.'
                  )
                }
              >
                <Ionicons name="information-circle-outline" size={14} color={isDark ? '#aaa' : '#7f8c8d'} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.smallInput,
                {
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#bdc3c7',
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
                },
              ]}
              keyboardType="number-pad"
              value={breakInput}
              placeholder="e.g. 5"
              placeholderTextColor={isDark ? '#666' : '#a0a0a0'}
              onChangeText={setBreakInput}
            />
          </View>

          <View style={styles.inputBox}>
            <View style={styles.labelWithInfo}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#bbb' : '#7f8c8d' }]}>Sessions</Text>
              <TouchableOpacity
                onPress={() =>
                  showSettingInfo(
                    'Default Sessions Count',
                    'Sets the default total number of sessions for new focus goals.'
                  )
                }
              >
                <Ionicons name="information-circle-outline" size={14} color={isDark ? '#aaa' : '#7f8c8d'} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.smallInput,
                {
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#bdc3c7',
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
                },
              ]}
              keyboardType="number-pad"
              value={sessionsInput}
              placeholder="e.g. 4"
              placeholderTextColor={isDark ? '#666' : '#a0a0a0'}
              onChangeText={setSessionsInput}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveDefaults}>
          <Text style={styles.saveProfileBtnText}>Save Default Presets</Text>
        </TouchableOpacity>
      </View>

      {/* Ringtone & Audio Section */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
        <Text style={styles.sectionHeader}>Ringtone & Audio Alerts 🔔</Text>

        <View style={styles.rowBetween}>
          <View style={styles.labelWithInfo}>
            <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>Ringtone Alerts</Text>
            <TouchableOpacity
              onPress={() =>
                showSettingInfo(
                  'Ringtone Alerts',
                  'When enabled, plays an audio ringtone sound when a focus or break period completes.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={16} color={isDark ? '#aaa' : '#7f8c8d'} />
            </TouchableOpacity>
          </View>
          <Switch value={ringtoneEnabled} onValueChange={setRingtoneEnabled} />
        </View>

        {ringtoneEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#ecf0f1' }]} />
            <TouchableOpacity
              style={styles.rowBetween}
              onPress={() => setRingtoneModalVisible(true)}
            >
              <View style={styles.labelWithInfo}>
                <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>
                  Stock Ringtone Sound
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    showSettingInfo(
                      'Stock Ringtone Sound',
                      'Select from a list of pre-installed stock audio tones for your completion alarms.'
                    )
                  }
                >
                  <Ionicons name="information-circle-outline" size={16} color={isDark ? '#aaa' : '#7f8c8d'} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, color: '#e74c3c', fontWeight: 'bold' }}>
                  {currentRingtoneObj.name}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Tactile & System Alerts */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
        <Text style={styles.sectionHeader}>Tactile & System Alerts 📳</Text>

        <View style={styles.rowBetween}>
          <View style={styles.labelWithInfo}>
            <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>Vibration Alerts</Text>
            <TouchableOpacity
              onPress={() =>
                showSettingInfo(
                  'Vibration Alerts',
                  'Triggers device vibration patterns when focus or break sessions complete.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={16} color={isDark ? '#aaa' : '#7f8c8d'} />
            </TouchableOpacity>
          </View>
          <Switch value={vibrationEnabled} onValueChange={setVibrationEnabled} />
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#ecf0f1' }]} />

        <View style={styles.rowBetween}>
          <View style={styles.labelWithInfo}>
            <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>Looping Alert Alarm</Text>
            <TouchableOpacity
              onPress={() =>
                showSettingInfo(
                  'Looping Alert Alarm',
                  'Repeats vibration & ringtone pulses continuously until you acknowledge the completion alert pop-up.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={16} color={isDark ? '#aaa' : '#7f8c8d'} />
            </TouchableOpacity>
          </View>
          <Switch value={loopingAlarm} onValueChange={setLoopingAlarm} />
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#ecf0f1' }]} />

        <TouchableOpacity style={styles.rowBetween} onPress={requestDndPermission}>
          <View style={styles.labelWithInfo}>
            <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>Do Not Disturb Permission</Text>
            <TouchableOpacity
              onPress={() =>
                showSettingInfo(
                  'Do Not Disturb Permission',
                  'Opens system settings to allow the app to silence incoming notifications during active focus periods.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={16} color={isDark ? '#aaa' : '#7f8c8d'} />
            </TouchableOpacity>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Timer Automation */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
        <Text style={styles.sectionHeader}>Timer Automation 🤖</Text>

        <View style={styles.rowBetween}>
          <View style={styles.labelWithInfo}>
            <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>Auto-start Breaks</Text>
            <TouchableOpacity
              onPress={() =>
                showSettingInfo(
                  'Auto-start Breaks',
                  'When enabled, your break countdown will start automatically as soon as a focus session reaches 0, without needing a manual tap.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={16} color={isDark ? '#aaa' : '#7f8c8d'} />
            </TouchableOpacity>
          </View>
          <Switch value={autoStartBreaks} onValueChange={setAutoStartBreaks} />
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#ecf0f1' }]} />

        <View style={styles.rowBetween}>
          <View style={styles.labelWithInfo}>
            <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>Auto-start Focus Sessions</Text>
            <TouchableOpacity
              onPress={() =>
                showSettingInfo(
                  'Auto-start Focus Sessions',
                  'When enabled, the next focus session timer begins automatically when a break ends.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={16} color={isDark ? '#aaa' : '#7f8c8d'} />
            </TouchableOpacity>
          </View>
          <Switch value={autoStartFocus} onValueChange={setAutoStartFocus} />
        </View>
      </View>

      {/* Theme & Color Wheel Accents */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
        <Text style={styles.sectionHeader}>Theme & Color Wheel Accents 🎨</Text>

        <View style={styles.rowBetween}>
          <View style={styles.labelWithInfo}>
            <Text style={[styles.rowText, { color: isDark ? '#eee' : '#2c3e50' }]}>Dark Mode</Text>
            <TouchableOpacity
              onPress={() =>
                showSettingInfo(
                  'Dark Mode',
                  'Toggles between Light and Dark interface themes for optimal viewing in low-light environments.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={16} color={isDark ? '#aaa' : '#7f8c8d'} />
            </TouchableOpacity>
          </View>
          <Switch
            value={isDark}
            onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
          />
        </View>

        <View style={styles.labelWithInfo}>
          <Text style={[styles.subHeaderLabel, { color: isDark ? '#aaa' : '#7f8c8d' }]}>LIGHT MODE ACCENTS</Text>
          <TouchableOpacity
            onPress={() =>
              showSettingInfo(
                'Light Mode Accents',
                'Drag the color wheel to customize the primary timer ring colors while using Light Mode.'
              )
            }
          >
            <Ionicons name="information-circle-outline" size={14} color={isDark ? '#aaa' : '#7f8c8d'} />
          </TouchableOpacity>
        </View>
        <View style={styles.colorRow}>
          <TouchableOpacity
            style={[
              styles.colorTile,
              {
                backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                borderColor: isDark ? '#444444' : '#e0e0e0',
              },
            ]}
            onPress={() => openColorPicker('lightFocus', lightFocusColor)}
          >
            <View style={[styles.colorBubble, { backgroundColor: lightFocusColor }]} />
            <Text style={[styles.colorTileText, { color: isDark ? '#ffffff' : '#34495e' }]}>
              Focus Accent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.colorTile,
              {
                backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                borderColor: isDark ? '#444444' : '#e0e0e0',
              },
            ]}
            onPress={() => openColorPicker('lightBreak', lightBreakColor)}
          >
            <View style={[styles.colorBubble, { backgroundColor: lightBreakColor }]} />
            <Text style={[styles.colorTileText, { color: isDark ? '#ffffff' : '#34495e' }]}>
              Break Accent
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.labelWithInfo}>
          <Text style={[styles.subHeaderLabel, { color: isDark ? '#aaa' : '#7f8c8d' }]}>DARK MODE ACCENTS</Text>
          <TouchableOpacity
            onPress={() =>
              showSettingInfo(
                'Dark Mode Accents',
                'Drag the color wheel to customize the primary timer ring colors while using Dark Mode.'
              )
            }
          >
            <Ionicons name="information-circle-outline" size={14} color={isDark ? '#aaa' : '#7f8c8d'} />
          </TouchableOpacity>
        </View>
        <View style={styles.colorRow}>
          <TouchableOpacity
            style={[
              styles.colorTile,
              {
                backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                borderColor: isDark ? '#444444' : '#e0e0e0',
              },
            ]}
            onPress={() => openColorPicker('darkFocus', darkFocusColor)}
          >
            <View style={[styles.colorBubble, { backgroundColor: darkFocusColor }]} />
            <Text style={[styles.colorTileText, { color: isDark ? '#ffffff' : '#34495e' }]}>
              Focus Accent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.colorTile,
              {
                backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                borderColor: isDark ? '#444444' : '#e0e0e0',
              },
            ]}
            onPress={() => openColorPicker('darkBreak', darkBreakColor)}
          >
            <View style={[styles.colorBubble, { backgroundColor: darkBreakColor }]} />
            <Text style={[styles.colorTileText, { color: isDark ? '#ffffff' : '#34495e' }]}>
              Break Accent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reset & Account Actions */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
        <TouchableOpacity style={styles.resetAppBtn} onPress={handleFactoryResetConfirm}>
          <Ionicons name="refresh" size={16} color={isDark ? '#a0a0a0' : '#7f8c8d'} />
          <Text style={[styles.resetAppText, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
            Reset All Settings to Factory Defaults
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderTopColor: isDark ? '#333333' : '#ecf0f1' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
          <Text style={styles.logoutText}>Log Out ({auth.currentUser?.email})</Text>
        </TouchableOpacity>
      </View>

      {/* Stock Ringtone Selection Modal */}
      <Modal visible={ringtoneModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#2c3e50', marginBottom: 0 }]}>
                Select Stock Ringtone 🎵
              </Text>
              <TouchableOpacity onPress={closeRingtoneModal}>
                <Ionicons name="close" size={22} color={isDark ? '#aaa' : '#7f8c8d'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%', marginVertical: 14 }}>
              {STOCK_RINGTONES.map((item) => {
                const isSelected = selectedRingtone === item.id;
                const isPlaying = previewPlayingId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.ringtoneOptionRow,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#2c3e50'
                            : '#eaf2f8'
                          : isDark
                          ? '#2c2c2c'
                          : '#f8f9fa',
                      },
                    ]}
                    onPress={() => handleSelectRingtone(item.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isSelected ? '#2ecc71' : '#95a5a6'}
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: 'bold',
                          color: isDark ? '#fff' : '#2c3e50',
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.playPreviewBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePreviewSound(item.id);
                      }}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={26}
                        color="#e74c3c"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.saveProfileBtn} onPress={closeRingtoneModal}>
              <Text style={styles.saveProfileBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Color Wheel Selector Modal */}
      <Modal visible={colorModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#2c3e50' }]}>
              Drag Wheel to Choose Accent Color 🎨
            </Text>

            <View style={styles.wheelWrapper}>
              <ColorPicker
                color={tempColor}
                onColorChangeComplete={(color) => setTempColor(color)}
                thumbSize={28}
                sliderSize={20}
                noSnap={true}
                row={false}
                swatches={false}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.cancelModalBtn, { backgroundColor: isDark ? '#2c2c2c' : '#ecf0f1' }]}
                onPress={() => setColorModalVisible(false)}
              >
                <Text style={[styles.cancelModalText, { color: isDark ? '#aaa' : '#7f8c8d' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.applyModalBtn, { backgroundColor: tempColor }]} onPress={handleApplyColor}>
                <Text style={styles.applyModalText}>Apply Accent Color</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#95a5a6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveProfileBtn: {
    backgroundColor: '#34495e',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  saveProfileBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inlineInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  inputBox: {
    flex: 1,
  },
  smallInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
  subHeaderLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  colorTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  colorBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  colorTileText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  resetAppText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  logoutText: {
    fontSize: 13,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ringtoneOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  playPreviewBtn: {
    padding: 2,
  },
  wheelWrapper: {
    width: '100%',
    height: 280,
    marginBottom: 20,
    justifyContent: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalText: {
    fontWeight: 'bold',
  },
  applyModalBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyModalText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});