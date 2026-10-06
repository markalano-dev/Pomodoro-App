import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import AuthNavigator from '../navigation/AuthNavigator';
import MainTabNavigator from '../navigation/MainTabNavigator';
import { getIsSigningUp } from '../services/authService';

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Suppress state updates during account creation to prevent home screen flickering
      if (getIsSigningUp()) {
        setLoading(false);
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return user ? <MainTabNavigator /> : <AuthNavigator />;
}