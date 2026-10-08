import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  Vibration,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { MASCOT_SUB_ASSETS } from '../config/mascotAssets';

interface SessionCompleteModalProps {
  visible: boolean;
  onClose: () => void;
  totalSessions: number | string;
}

export default function SessionCompleteModal({
  visible,
  onClose,
  totalSessions,
}: SessionCompleteModalProps) {
  const { themeMode } = useSettings();
  const isDark = themeMode === 'dark';

  const colors = {
    modalBg: isDark ? '#1D1E2A' : '#FFFFFF',
    overlayBg: 'rgba(18, 19, 28, 0.8)',
    textPrimary: isDark ? '#FFFFFF' : '#1D1E2A',
    textSecondary: isDark ? '#8A8C9E' : '#7F8C8D',
    accentFocus: '#FFA07A',
    buttonBg: isDark ? '#2A2B3D' : '#F1F0EC',
    border: isDark ? '#2A2B3C' : '#E8E6E1',
  };

  // Guarantee vibration stops as soon as the modal is visible
  useEffect(() => {
    if (visible) {
      // Small safety delay before cancelling to allow the initial alert pulse
      const timer = setTimeout(() => Vibration.cancel(), 1500);
      return () => {
        clearTimeout(timer);
        Vibration.cancel();
      };
    }
  }, [visible]);

  const handleDismiss = () => {
    Vibration.cancel();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={[styles.overlay, { backgroundColor: colors.overlayBg }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.modalBg, borderColor: colors.border },
              ]}
            >
              {/* Badge */}
              <View style={[styles.badgePill, { backgroundColor: colors.accentFocus }]}>
                <Text style={styles.badgeText}>GOAL ACHIEVED! 🎉</Text>
              </View>

              {/* Victory Mascot */}
              <View style={styles.mascotContainer}>
                <Image
                  source={MASCOT_SUB_ASSETS.STAR_EYES}
                  style={styles.mascotImage}
                  resizeMode="contain"
                />
              </View>

              {/* Copy */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                All Sessions Complete!
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Amazing work! You successfully completed all {totalSessions} focus blocks. Time to give yourself a big high five!
              </Text>

              {/* Action */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.accentFocus }]}
                onPress={handleDismiss}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Finish & Wrap Up</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  badgePill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mascotContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});