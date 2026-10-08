import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebaseConfig';
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';
import PreloaderScreen from '../screens/PreloaderScreen';

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const startTime = Date.now();
      setIsLoading(true);

      if (currentUser) {
        try {
          // Force server re-validation check to verify active user status
          await currentUser.reload();
          setUser(auth.currentUser);
        } catch (error: any) {
          if (
            error.code === 'auth/user-not-found' ||
            error.code === 'auth/user-disabled' ||
            error.code === 'auth/invalid-user-token'
          ) {
            console.warn('Account no longer exists in Firebase. Logging out...');
            await AsyncStorage.clear();
            await signOut(auth);
            setUser(null);
          } else {
            setUser(currentUser);
          }
        }
      } else {
        setUser(null);
      }

      // Calculate remaining time to guarantee at least 2000ms (2 seconds) display
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      timer = setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Display PreloaderScreen during app initialization, sign-in, or registration
  if (isLoading) {
    return <PreloaderScreen />;
  }

  return user ? <MainTabNavigator /> : <AuthNavigator />;
}