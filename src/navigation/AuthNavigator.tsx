import React, { useState } from 'react';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';

export default function AuthNavigator() {
  const [isRegistering, setIsRegistering] = useState(false);

  if (isRegistering) {
    return <SignUpScreen onNavigateToLogin={() => setIsRegistering(false)} />;
  }

  return <LoginScreen onNavigateToRegister={() => setIsRegistering(true)} />;
}