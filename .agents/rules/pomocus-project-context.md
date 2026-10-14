---
trigger: always_on
---

# Project Context & Technical Architecture: Pomocus

This document serves as the official, unified technical context and source specification for **Pomocus**, detailing its core metadata, brand identity, key architectural traits, common standalone build failure modes, and operational precautions.

---

## 1. Project Overview & Core Metadata

* **App Name**: Pomocus.
* **Primary Function**: A customizable Pomodoro productivity application featuring session management, custom visual styling, and user account synchronization.
* **Tech Stack**: React Native, Expo Framework (SDK 57.0.0), TypeScript, Firebase (Authentication & Firestore).


* **Deployment Toolchain**: Expo Application Services (EAS Build CLI) configured for Android standalone APK generation (`eas build -p android --profile preview`) under account `markalano-dev-main` without requiring upfront Apple Developer account registration.



---

## 2. Brand Identity & Visual Design Language

* **Brand Aesthetic**:
* **Visual Tone**: Modern, minimal, and immersive dark-mode productivity design engineered to reduce eye strain during extended focus sessions.
* **Brand Mascot / Logo**: Features a stylized cat silhouette with vibrant violet/cyan gradient accents against a dark backdrop.




* **Theme & Color Palette**:
* **Primary Surface / Canvas Background**: `#12131C` (Deep Charcoal/Midnight Blue).
* **Accent & Gradient Palette**: Electric Cyan, Soft Magenta/Violet, and Warm Coral highlight active timer states, control buttons, and status indicators.
* **UI Components**: Low-contrast dark cards with rounded corners ($12\text{px}–16\text{px}$ radius), sleek floating action controls, and clear typographic hierarchy.


* **User Experience & Micro-Interactions**:
* **Preloader & Splash Sequence**: Seamless transition from a branded boot screen (`#12131C` background with centered logo icon) into an animated preloader screen (`PreloaderScreen.tsx`) before mounting the main application dashboard (`AppNavigator`).
* **Feedback**: Tactile haptic/vibration feedback (`VIBRATE` permission) paired with audio queues (`expo-av`) to notify users of Pomodoro phase transitions (Focus, Short Break, Long Break).





---

## 3. Key Architectural Aspects & Notable Traits

* **Native Startup & Polyfill Sequence**:
* Standalone React Native binaries lack native Web Crypto implementations required by Firebase Auth.
* The entry point (`index.tsx`) imports `react-native-get-random-values` at **Line 1** prior to any React, Firebase, or navigation initialization to prevent instant runtime crashes.


* **Persistence & Authentication Pipeline**:
* Firebase Auth initializes via `initializeAuth` using `@react-native-async-storage/async-storage` persistence to maintain user sessions across app terminations.




* **Configuration Schema & Asset Management**:
* Configured via `app.json` using explicit package identification (`com.rsene.pomocus`).
* Utilizes the `expo-splash-screen` plugin mapped to centered root asset `./assets/icon.png` on background `#12131C` to comply with native Android splash screen requirements without redundant asset files.
* Includes explicit URL deep-linking configuration (`"scheme": "pomocus"`).





---

## 4. Standalone APK Publishing Traps (Failure Modes & Root Causes)

When compiling and executing standalone `.apk` files, several subtle configuration bugs can cause the application to crash immediately upon launch ("Pomocus keeps stopping").

### A. Missing Native Crypto Polyfill

* **Symptom**: App opens momentarily and immediately force-closes without showing the UI ("Pomocus keeps stopping").


* **Root Cause**: Firebase Auth invokes `crypto.getRandomValues()`. While Expo Go injects this polyfill automatically, standalone binaries do not include it unless imported at the entry point.
* **Resolution**:
1. Install `react-native-get-random-values` via `npx expo install`.
2. Place `import 'react-native-get-random-values';` as the **first line** of `index.tsx`.



### B. Missing `scheme` Configuration

* **Symptom**: App crashes on launch or outputs `Linking requires a build-time setting 'scheme'` warnings.


* **Root Cause**: Navigation and Expo linking packages throw unhandled native exceptions in standalone builds if `"scheme"` is absent from `app.json`.


* **Resolution**: Add `"scheme": "pomocus"` under the `"expo"` block in `app.json`.



### C. Asset Path & Prebuild ENOENT Errors

* **Symptom**: Cloud builds fail during the `npx expo prebuild` phase with `ENOENT: no such file or directory`.


* **Root Cause**: Deprecated top-level `"splash"` configurations or pointing to non-existent image assets (e.g., missing `icon.png`, `adaptive-icon.png`, or `favicon.png`).
* **Resolution**: Remove deprecated top-level `"splash"` keys, clean up unused `"web"` configurations, and ensure all asset references in `app.json` point to existing files in `./assets/`.



### D. Unlinked Native Dependencies & Type Resolution

* **Symptom**: TypeScript errors in `firebaseConfig.ts` on `AsyncStorage` imports or runtime `getReactNativePersistence` failures.


* **Root Cause**: Package present in code without native installation via Expo CLI.


* **Resolution**: Install dependencies using `npx expo install @react-native-async-storage/async-storage` and apply explicit type casting (`AsyncStorage as any`) inside `getReactNativePersistence()` if strict TypeScript interface conflicts occur.



---

## 5. Necessary Precautions, Workflow Rules & Constraints

1. **Pre-Build Local Verification**:
* Always run `npx expo prebuild --clean` locally before initiating an EAS cloud build. This instantly validates asset paths, `app.json` schema rules, and native dependency trees without consuming cloud build queue time.




2. **Environment Variable Security & Prefixing**:
* Client-side environment variables must use the `EXPO_PUBLIC_` prefix (e.g., `EXPO_PUBLIC_FIREBASE_API_KEY`) to ensure they are baked into the standalone JavaScript bundle during cloud compilation.




3. **Concurrent Dev Server Execution**:
* It is safe to leave `npx expo start` running locally while executing `eas build -p android --profile preview`. EAS snapshots local saved files and uploads them independently to Expo Cloud.




4. **Native Crash Diagnostic Workflow**:
* If an APK closes unexpectedly on physical hardware, connect the phone via USB with Debugging enabled and run `adb logcat *:E` in the terminal to inspect the `FATAL EXCEPTION` stack trace.




5. **Future Migration Considerations (`expo-av`)**:
* `expo-doctor` flags `expo-av` as unmaintained in favor of `expo-audio` for React Native New Architecture compatibility. While `expo-av` remains fully functional for current standalone builds, plan to migrate audio handling during future major Expo SDK updates.