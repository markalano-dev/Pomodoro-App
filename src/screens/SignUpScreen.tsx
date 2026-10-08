import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { useSettings } from '../context/SettingsContext';
import { getThemeColors } from '../config/theme';

interface SignUpScreenProps {
  onNavigateToLogin?: () => void;
}

export default function SignUpScreen({ onNavigateToLogin }: SignUpScreenProps) {
  const settingsContext = useSettings() as any;
  const { themeMode, activeFocusColor } = settingsContext;

  const isDark = themeMode === 'dark';
  const colors = getThemeColors(isDark);
  const currentAccent = activeFocusColor || colors.accentFocus || '#FF7E67';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Custom Brand Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !confirmPassword) {
      setModalType('error');
      setModalTitle('Missing Information');
      setModalMessage('Please fill in all fields to create your account.');
      setShowModal(true);
      return;
    }

    if (password !== confirmPassword) {
      setModalType('error');
      setModalTitle('Password Mismatch');
      setModalMessage('The passwords you entered do not match. Please check and try again.');
      setShowModal(true);
      return;
    }

    if (password.length < 6) {
      setModalType('error');
      setModalTitle('Weak Password');
      setModalMessage('Password should be at least 6 characters long.');
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Create account
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      // 2. Send email verification
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }

      // 3. Immediately sign out to prevent Firebase auto-login
      await signOut(auth);

      setModalType('success');
      setModalTitle('Account Created! ✉️✨');
      setModalMessage(
        `A verification link has been sent to ${trimmedEmail}. Please check your inbox and sign in with your credentials.`
      );
      setShowModal(true);
    } catch (error: any) {
      setModalType('error');
      setModalTitle('Registration Failed');

      if (error.code === 'auth/email-already-in-use') {
        setModalMessage('An account with this email address already exists. Try logging in instead.');
      } else if (error.code === 'auth/invalid-email') {
        setModalMessage('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        setModalMessage('Your password is too weak. Please choose a stronger password.');
      } else {
        setModalMessage(error.message || 'An unexpected error occurred during sign up.');
      }

      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalDismiss = () => {
    setShowModal(false);
    if (modalType === 'success' && onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Create Account 🚀
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Start organizing your study blocks and focus goals
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBg, color: colors.textPrimary },
            ]}
            placeholder="sample@email.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            PASSWORD
          </Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                { backgroundColor: colors.inputBg, color: colors.textPrimary },
              ]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            CONFIRM PASSWORD
          </Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                { backgroundColor: colors.inputBg, color: colors.textPrimary },
              ]}
              placeholder="Re-enter password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, { backgroundColor: currentAccent }]}
            onPress={handleSignUp}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
            <Text style={[styles.loginLink, { color: currentAccent }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BRAND-ALIGNED SUCCESS / ERROR MODAL */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleModalDismiss}
      >
        <TouchableWithoutFeedback onPress={handleModalDismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {/* Glow Badge Icon */}
                <View
                  style={[
                    styles.iconGlowBadge,
                    {
                      backgroundColor:
                        modalType === 'success'
                          ? isDark
                            ? `${currentAccent}25`
                            : `${currentAccent}15`
                          : isDark
                          ? '#3D1C1C'
                          : '#FDE8E8',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      modalType === 'success'
                        ? 'mail-unread-outline'
                        : 'close-circle-outline'
                    }
                    size={38}
                    color={modalType === 'success' ? currentAccent : '#FF5252'}
                  />
                </View>

                {/* Title & Message */}
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {modalTitle}
                </Text>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  {modalMessage}
                </Text>

                {/* Brand Pill Action Button */}
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor:
                        modalType === 'success' ? currentAccent : '#FF5252',
                    },
                  ]}
                  onPress={handleModalDismiss}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalButtonText}>
                    {modalType === 'success' ? 'Go to Sign In' : 'Try Again'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButton: {
    height: 50,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loginLink: {
    fontSize: 13,
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
    lineHeight: 19,
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
});