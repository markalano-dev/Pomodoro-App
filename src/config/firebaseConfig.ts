import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// Import getReactNativePersistence directly from the core @firebase/auth package
// @ts-ignore - getReactNativePersistence is provided by @firebase/auth in React Native runtime
import { getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration (reads from environment variables with fallback)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAOVNvgwQPmNcGbbNMYCLBlFsbtcY5uQP8",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "pomodoro-app-3e92e.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "pomodoro-app-3e92e",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "pomodoro-app-3e92e.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1027076193107",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1027076193107:web:e5d8a49017f9f324baffa6",
};

let app;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage as any),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };