// src/components/ObjectiveAlertModal.tsx

import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { MASCOT_HERO_ASSETS } from '../config/mascotAssets';
import { getThemeColors } from '../config/theme';

interface ObjectiveAlertModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ObjectiveAlertModal({ visible, onClose }: ObjectiveAlertModalProps) {
  const { themeMode, activeFocusColor } = useSettings();
  const isDark = themeMode === 'dark';
  const colors = getThemeColors(isDark);
  const accent = activeFocusColor || colors.accentFocus;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              
              {/* Badge Header Pill */}
              <View style={[styles.badgePill, { backgroundColor: accent }]}>
                <Ionicons name="flag-outline" size={13} color="#FFFFFF" />
                <Text style={styles.badgeText}>OBJECTIVE REQUIRED</Text>
              </View>

              {/* Mascot Illustration */}
              <Image
                source={MASCOT_HERO_ASSETS.PRELOADER}
                style={styles.mascotImage}
                resizeMode="contain"
              />

              {/* Title & Body Text */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Set Your Focus Goal!
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Please enter a current objective before starting your timer so your progress can be logged in your history.
              </Text>

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: accent }]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Set Objective</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  mascotImage: {
    width: 110,
    height: 110,
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: '100%',
    borderRadius: 999,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});