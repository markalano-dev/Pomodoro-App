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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { useSettings } from '../context/SettingsContext';
import { getThemeColors } from '../config/theme';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
}

export default function LoginScreen({ onNavigateToRegister }: LoginScreenProps) {
  const settingsContext = useSettings() as any;
  const { themeMode, activeFocusColor } = settingsContext;

  const isDark = themeMode === 'dark';
  const colors = getThemeColors(isDark);
  const currentAccent = activeFocusColor || colors.accentFocus || '#FF7E67';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Custom Brand Modal State
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('Sign In Failed');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoToRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorTitle('Missing Information');
      setErrorMessage('Please enter both your email address and password to sign in.');
      setShowErrorModal(true);
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      setErrorTitle('Sign In Failed');
      
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        setErrorMessage('The email or password you entered is incorrect. Please check your details and try again.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please try again later or reset your password.');
      } else {
        setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
      }

      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
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
            Welcome Back 👋
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to access your custom Pomodoro timers
          </Text>
        </View>

        {/* Input Form Card */}
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
              placeholder="••••••••"
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

          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: currentAccent }]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={handleGoToRegister} activeOpacity={0.7}>
            <Text style={[styles.registerLink, { color: currentAccent }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BRAND-ALIGNED ERROR POP-UP MODAL */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowErrorModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.iconGlowBadge,
                    { backgroundColor: isDark ? '#3D1C1C' : '#FDE8E8' },
                  ]}
                >
                  <Ionicons name="close-circle-outline" size={42} color="#FF5252" />
                </View>

                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {errorTitle}
                </Text>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  {errorMessage}
                </Text>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: currentAccent }]}
                  onPress={() => setShowErrorModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalButtonText}>Try Again</Text>
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
  signInButton: {
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
  signInButtonText: {
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
  registerLink: {
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