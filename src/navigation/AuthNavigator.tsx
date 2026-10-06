import React, { useState } from 'react';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';

export default function AuthNavigator() {
  const [screen, setScreen] = useState<'login' | 'signup'>('login');

  if (screen === 'signup') {
    return <SignUpScreen onNavigateToLogin={() => setScreen('login')} />;
  }

  return <LoginScreen onNavigateToSignUp={() => setScreen('signup')} />;
}