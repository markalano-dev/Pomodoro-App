import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// Import getReactNativePersistence directly from the core @firebase/auth package
import { getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOVNvgwQPmNcGbbNMYCLBlFsbtcY5uQP8",
  authDomain: "pomodoro-app-3e92e.firebaseapp.com",
  projectId: "pomodoro-app-3e92e",
  storageBucket: "pomodoro-app-3e92e.firebasestorage.app",
  messagingSenderId: "1027076193107",
  appId: "1:1027076193107:web:e5d8a49017f9f324baffa6"
};

let app;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };