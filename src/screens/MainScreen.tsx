import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
} from 'react-native';
import { auth } from '../config/firebaseConfig';
import { useTimer, TimeUnit } from '../context/TimerContext';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function MainScreen() {
  const {
    goal,
    setGoal,
    activeGoal,
    workDuration,
    workUnit,
    breakDuration,
    breakUnit,
    setBreakUnit,
    totalSessions,
    currentSession,
    phase,
    secondsLeft,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    handleWorkDurationChange,
    handleWorkUnitChange,
    handleBreakDurationChange,
    handleSessionsChange,
  } = useTimer();

  const { username, profileImage, themeMode, activeFocusColor, activeBreakColor } = useSettings();
  const isDark = themeMode === 'dark';

  const handleStart = () => {
    Keyboard.dismiss();
    startTimer();
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isFocusPhase = phase === 'FOCUS';
  const activeAccentColor = isFocusPhase ? activeFocusColor : activeBreakColor;
  const effectiveTotalSessions = totalSessions || '4';

  const displayName = username.trim() ? username : auth.currentUser?.email || 'Focus User';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: isDark ? '#121212' : '#f8f9fa' },
        ]}
      >
        {/* Header with Avatar & Username / Email Fallback */}
        <View style={styles.header}>
          <View style={styles.userProfileRow}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: activeFocusColor }]}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            )}
            <View>
              <Text style={[styles.greetingText, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
                Welcome back, 👋
              </Text>
              <Text style={[styles.userText, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
                {displayName}
              </Text>
            </View>
          </View>
        </View>

        {/* Goal Input Section */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
          <Text style={[styles.label, { color: isDark ? '#e0e0e0' : '#34495e' }]}>
            Goal / Objective:
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                borderColor: isDark ? '#444444' : '#bdc3c7',
                color: isDark ? '#ffffff' : '#000000',
              },
            ]}
            placeholder="e.g. Finish reading Chapter 3"
            placeholderTextColor={isDark ? '#777777' : '#a0a0a0'}
            value={goal}
            onChangeText={setGoal}
            editable={!isRunning && !activeGoal}
          />
        </View>

        {/* Session Configuration Panel */}
        {!isRunning && !activeGoal && (
          <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <Text style={[styles.sectionHeader, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
              Session Configuration
            </Text>

            {/* Focus Duration Input */}
            <View style={styles.configBlock}>
              <Text style={[styles.rowLabel, { color: isDark ? '#e0e0e0' : '#34495e' }]}>
                Focus Duration:
              </Text>
              <View style={styles.inputUnitRow}>
                <TextInput
                  style={[
                    styles.numInput,
                    {
                      backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                      borderColor: isDark ? '#444444' : '#bdc3c7',
                      color: isDark ? '#ffffff' : '#000000',
                    },
                  ]}
                  keyboardType="number-pad"
                  value={workDuration}
                  placeholder="e.g. 25"
                  placeholderTextColor={isDark ? '#777777' : '#a0a0a0'}
                  onChangeText={handleWorkDurationChange}
                />
                <View style={[styles.unitToggleGroup, { backgroundColor: isDark ? '#2c2c2c' : '#ecf0f1' }]}>
                  {(['sec', 'min', 'hr'] as TimeUnit[]).map((unit) => (
                    <TouchableOpacity
                      key={`work-${unit}`}
                      style={[
                        styles.unitButton,
                        workUnit === unit && { backgroundColor: activeFocusColor },
                      ]}
                      onPress={() => handleWorkUnitChange(unit)}
                    >
                      <Text
                        style={[
                          styles.unitText,
                          { color: workUnit === unit ? '#fff' : isDark ? '#aaa' : '#7f8c8d' },
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Break Duration Input */}
            <View style={styles.configBlock}>
              <Text style={[styles.rowLabel, { color: isDark ? '#e0e0e0' : '#34495e' }]}>
                Allowed Break:
              </Text>
              <View style={styles.inputUnitRow}>
                <TextInput
                  style={[
                    styles.numInput,
                    {
                      backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                      borderColor: isDark ? '#444444' : '#bdc3c7',
                      color: isDark ? '#ffffff' : '#000000',
                    },
                  ]}
                  keyboardType="number-pad"
                  value={breakDuration}
                  placeholder="e.g. 5"
                  placeholderTextColor={isDark ? '#777777' : '#a0a0a0'}
                  onChangeText={handleBreakDurationChange}
                />
                <View style={[styles.unitToggleGroup, { backgroundColor: isDark ? '#2c2c2c' : '#ecf0f1' }]}>
                  {(['sec', 'min', 'hr'] as TimeUnit[]).map((unit) => (
                    <TouchableOpacity
                      key={`break-${unit}`}
                      style={[
                        styles.unitButton,
                        breakUnit === unit && { backgroundColor: activeBreakColor },
                      ]}
                      onPress={() => setBreakUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.unitText,
                          { color: breakUnit === unit ? '#fff' : isDark ? '#aaa' : '#7f8c8d' },
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Total Sessions Input */}
            <View style={styles.configBlock}>
              <Text style={[styles.rowLabel, { color: isDark ? '#e0e0e0' : '#34495e' }]}>
                Total Sessions (Max 99):
              </Text>
              <TextInput
                style={[
                  styles.numInput,
                  {
                    width: 75,
                    backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                    borderColor: isDark ? '#444444' : '#bdc3c7',
                    color: isDark ? '#ffffff' : '#000000',
                  },
                ]}
                keyboardType="number-pad"
                maxLength={2}
                value={totalSessions}
                placeholder="e.g. 4"
                placeholderTextColor={isDark ? '#777777' : '#a0a0a0'}
                onChangeText={handleSessionsChange}
              />
            </View>
          </View>
        )}

        {/* Active Session Info Card */}
        {activeGoal ? (
          <View style={[styles.activeGoalCard, { backgroundColor: isDark ? '#2c3e50' : '#eaf2f8' }]}>
            <Text style={styles.activeGoalLabel}>CURRENT FOCUS:</Text>
            <Text style={[styles.activeGoalText, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
              {activeGoal}
            </Text>
            <Text style={styles.sessionBadge}>
              Session {currentSession} of {effectiveTotalSessions}
            </Text>
          </View>
        ) : null}

        {/* Timer Display Ring */}
        <View
          style={[
            styles.timerCircle,
            {
              borderColor: activeAccentColor,
              backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            },
          ]}
        >
          <Text style={[styles.phaseBadge, { color: activeAccentColor }]}>
            {isFocusPhase ? 'FOCUS TIME' : 'BREAK TIME'}
          </Text>
          <Text style={[styles.timerText, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
            {formatTime(secondsLeft)}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsRow}>
          {!isRunning ? (
            <>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: activeBreakColor }]}
                onPress={handleStart}
              >
                <Text style={styles.buttonText}>
                  {activeGoal ? (isFocusPhase ? 'Start Focus' : 'Start Break') : 'Start'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: isDark ? '#2c2c2c' : '#ecf0f1' }]}
                onPress={resetTimer}
              >
                <Text style={[styles.resetButtonText, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
                  Reset
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.pauseButton} onPress={pauseTimer}>
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  configBlock: {
    marginBottom: 14,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numInput: {
    height: 42,
    width: 75,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
  unitToggleGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  unitText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeGoalCard: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  activeGoalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2980b9',
    letterSpacing: 1,
    marginBottom: 4,
  },
  activeGoalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  sessionBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  phaseBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  timerText: {
    fontSize: 44,
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  startButton: {
    height: 50,
    width: 130,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    height: 50,
    width: 140,
    backgroundColor: '#f39c12',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    height: 50,
    width: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});