import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { setSigningUp } from '../services/authService';

interface SignUpScreenProps {
  onNavigateToLogin: () => void;
}

export default function SignUpScreen({ onNavigateToLogin }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePasswordStrength = (pass: string): { isValid: boolean; error?: string } => {
    if (pass.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(pass)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
    }
    if (!/[a-z]/.test(pass)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter (a-z).' };
    }
    if (!/[0-9]/.test(pass)) {
      return { isValid: false, error: 'Password must contain at least one digit (0-9).' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&*).' };
    }
    return { isValid: true };
  };

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Missing Fields ⚠️', 'Please fill in all registration fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch ❌', 'Passwords do not match. Please recheck.');
      return;
    }

    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      Alert.alert('Weak Password 🔒', validation.error);
      return;
    }

    setLoading(true);
    setSigningUp(true); // 1. Flag active signup session

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }

      await signOut(auth); // 2. Perform sign out

      Alert.alert(
        'Account Created! 📧✨',
        `A verification link has been sent to ${trimmedEmail}. Please check your inbox and sign in with your credentials.`,
        [
          {
            text: 'Go to Sign In',
            onPress: () => onNavigateToLogin(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed ❌', error.message);
    } finally {
      setSigningUp(false); // 3. Reset flag after sign-out completes
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account 🚀</Text>
        <Text style={styles.subtitle}>Sign up to track & sync your focus sessions</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={18} color="#7f8c8d" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={18} color="#7f8c8d" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password (Min 8 chars, 1 Upper, 1 Special)"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#7f8c8d"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#7f8c8d" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#7f8c8d"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Register Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={onNavigateToLogin}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#7f8c8d',
    fontSize: 13,
  },
  linkBold: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});