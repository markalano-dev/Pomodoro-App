import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { useSettings, ThemeMode } from '../context/SettingsContext';
import { getThemeColors } from '../config/theme';
import { auth } from '../config/firebaseConfig';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settingsContext = useSettings();

  const {
    username,
    setUsername,
    profileImage,
    setProfileImage,
    themeMode,
    setThemeMode,
    vibrationEnabled,
    setVibrationEnabled,
    activeFocusColor,
    setActiveFocusColor,
    saveSettings,
    resetAppSettings,
  } = settingsContext;

  const [draftUsername, setDraftUsername] = useState(username);
  const [draftProfileImage, setDraftProfileImage] = useState<string | null>(profileImage);
  const [draftThemeMode, setDraftThemeMode] = useState<ThemeMode>(themeMode);
  const [draftVibration, setDraftVibration] = useState(vibrationEnabled);
  const [draftFocusColor, setDraftFocusColor] = useState(activeFocusColor);
  const [isSaving, setIsSaving] = useState(false);

  // Custom Modal States
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);

  useEffect(() => {
    setDraftUsername(username);
    setDraftProfileImage(profileImage);
    setDraftThemeMode(themeMode);
    setDraftVibration(vibrationEnabled);
    setDraftFocusColor(activeFocusColor);
  }, [username, profileImage, themeMode, vibrationEnabled, activeFocusColor]);

  const isDark = draftThemeMode === 'dark';
  const colors = getThemeColors(isDark);
  const currentAccent = draftFocusColor || colors.accentFocus || '#FF7E67';

  const bottomPadding = Math.max(insets.bottom, 12) + 85;
  const userEmail = auth?.currentUser?.email || 'mark@sample.com';

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Permission to access your photo library is required to select a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setDraftProfileImage(result.assets[0].uri);
    }
  };

  const handleAvatarPress = () => {
    if (draftProfileImage) {
      Alert.alert('Profile Picture', 'Choose an option', [
        { text: 'Choose New Photo', onPress: handlePickImage },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => setDraftProfileImage(null),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      handlePickImage();
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      setUsername(draftUsername);
      setProfileImage(draftProfileImage);
      setThemeMode(draftThemeMode);
      setVibrationEnabled(draftVibration);
      setActiveFocusColor(draftFocusColor);

      await saveSettings({
        username: draftUsername,
        profileImage: draftProfileImage,
        themeMode: draftThemeMode,
        vibrationEnabled: draftVibration,
        activeFocusColor: draftFocusColor,
      });

      setShowSavedModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      await signOut(auth);
    } catch (error) {
      Alert.alert('Log Out Failed', 'Unable to terminate active session. Please check your network connection.');
    }
  };

  const handleConfirmFactoryReset = async () => {
    try {
      setShowResetConfirmModal(false);
      await resetAppSettings();
      setShowResetSuccessModal(true);
    } catch (error) {
      Alert.alert('Reset Failed', 'Unable to reset settings. Please try again.');
    }
  };

  const THEME_COLORS = ['#FF7E67', '#4ECDC4', '#A8DADC', '#FFD166', '#9B51E0'];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        bounces={true}
      >
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Settings</Text>

        {/* Profile Preferences Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>Profile Preferences</Text>

          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              style={[styles.avatarCircle, { backgroundColor: currentAccent }]}
              onPress={handleAvatarPress}
              activeOpacity={0.8}
            >
              {draftProfileImage ? (
                <Image source={{ uri: draftProfileImage }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="paw" size={24} color="#FFFFFF" />
              )}
              <View style={[styles.cameraBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="camera" size={12} color={colors.textPrimary} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfoGroup}>
              <Text style={[styles.profileSubLabel, { color: colors.textSecondary }]}>ACCOUNT EMAIL</Text>
              <Text style={[styles.emailText, { color: colors.textPrimary }]} numberOfLines={1}>
                {userEmail}
              </Text>
              <Text style={[styles.tapHintText, { color: currentAccent }]}>Tap avatar to edit picture</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.subLabel, { color: colors.textSecondary }]}>DISPLAY NAME / USERNAME</Text>
          <TextInput
            style={[
              styles.usernameInput,
              { backgroundColor: colors.inputBg || (isDark ? '#2A2B3D' : '#F1F0EC'), color: colors.textPrimary },
            ]}
            placeholder="e.g. Focus Buddy"
            placeholderTextColor={colors.textSecondary}
            value={draftUsername}
            onChangeText={setDraftUsername}
          />

          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#FF5252" />
            <Text style={styles.logoutBtnText}>Log Out Session</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>Appearance & Theme</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="moon-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => setDraftThemeMode(val ? 'dark' : 'light')}
              trackColor={{ false: '#E8E6E1', true: currentAccent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <Text style={[styles.subLabel, { color: colors.textSecondary }]}>ACCENT FOCUS COLOR</Text>
          <View style={styles.colorPaletteRow}>
            {THEME_COLORS.map((colorHex) => (
              <TouchableOpacity
                key={colorHex}
                style={[
                  styles.colorBubble,
                  { backgroundColor: colorHex },
                  currentAccent === colorHex && styles.activeColorBubble,
                ]}
                onPress={() => setDraftFocusColor(colorHex)}
                activeOpacity={0.8}
              />
            ))}
          </View>
        </View>

        {/* Haptics & Feedback */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>Haptics & Vibration</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>Vibration Feedback</Text>
            </View>
            <Switch
              value={draftVibration}
              onValueChange={setDraftVibration}
              trackColor={{ false: '#E8E6E1', true: currentAccent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: currentAccent }]}
          onPress={handleSaveAll}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>

        {/* System & Reset */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
          <Text style={[styles.cardSectionTitle, { color: '#FF5252' }]}>Data & System</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Restore all app settings, timer configurations, and clear focus log archives.
          </Text>

          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: '#FF5252' }]}
            onPress={() => setShowResetConfirmModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-circle-outline" size={20} color="#FF5252" />
            <Text style={styles.resetBtnText}>Factory Reset App</Text>
          </TouchableOpacity>
        </View>

        {/* About App */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>About App</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingText, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.versionText, { color: colors.textPrimary }]}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* BRAND-ALIGNED SETTINGS SAVED MODAL */}
      <Modal
        visible={showSavedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSavedModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSavedModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconGlowBadge, { backgroundColor: isDark ? `${currentAccent}25` : `${currentAccent}15` }]}>
                  <Ionicons name="checkmark-circle" size={42} color={currentAccent} />
                </View>

                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Settings Saved</Text>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  Your preferences have been successfully updated!
                </Text>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: currentAccent }]}
                  onPress={() => setShowSavedModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* BRAND-ALIGNED LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconGlowBadge, { backgroundColor: isDark ? '#3D1C1C' : '#FDE8E8' }]}>
                  <Ionicons name="log-out-outline" size={38} color="#FF5252" />
                </View>

                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Out Session?</Text>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  Are you sure you want to log out? You will need to sign back in to access your saved goals and sync history.
                </Text>

                <View style={styles.confirmActionRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: colors.inputBg }]}
                    onPress={() => setShowLogoutModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.proceedDangerBtn, { backgroundColor: '#FF5252' }]}
                    onPress={handleConfirmLogout}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.proceedDangerBtnText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* BRAND-ALIGNED FACTORY RESET CONFIRMATION MODAL */}
      <Modal
        visible={showResetConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetConfirmModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowResetConfirmModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconGlowBadge, { backgroundColor: isDark ? '#3D1C1C' : '#FDE8E8' }]}>
                  <Ionicons name="refresh-circle-outline" size={42} color="#FF5252" />
                </View>

                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Factory Reset App?</Text>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  Are you sure you want to restore default settings and clear timer configurations? Your goal log history will remain intact.
                </Text>

                <View style={styles.confirmActionRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: colors.inputBg }]}
                    onPress={() => setShowResetConfirmModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.proceedDangerBtn, { backgroundColor: '#FF5252' }]}
                    onPress={handleConfirmFactoryReset}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.proceedDangerBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* BRAND-ALIGNED RESET COMPLETE MODAL */}
      <Modal
        visible={showResetSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetSuccessModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowResetSuccessModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconGlowBadge, { backgroundColor: isDark ? `${currentAccent}25` : `${currentAccent}15` }]}>
                  <Ionicons name="checkmark-circle" size={42} color={currentAccent} />
                </View>

                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reset Complete</Text>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  Default app settings and interval configurations have been restored.
                </Text>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: currentAccent }]}
                  onPress={() => setShowResetSuccessModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 14,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  profileInfoGroup: {
    flex: 1,
  },
  profileSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tapHintText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  usernameInput: {
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    marginTop: 14,
  },
  logoutBtnText: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E6E1',
    marginVertical: 14,
    opacity: 0.5,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  activeColorBubble: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resetBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  resetBtnText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  iconGlowBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  proceedDangerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedDangerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});