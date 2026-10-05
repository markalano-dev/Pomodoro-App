import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Vibration,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

type TimeUnit = 'sec' | 'min' | 'hr';

export default function MainScreen() {
  const [goal, setGoal] = useState('');
  const [activeGoal, setActiveGoal] = useState('');

  // Configuration Inputs
  const [workDuration, setWorkDuration] = useState('15');
  const [workUnit, setWorkUnit] = useState<TimeUnit>('min');

  const [breakDuration, setBreakDuration] = useState('5');
  const [breakUnit, setBreakUnit] = useState<TimeUnit>('min');

  const [totalSessions, setTotalSessions] = useState('3');

  // Active Timer State
  const [currentSession, setCurrentSession] = useState(1);
  const [phase, setPhase] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Convert duration and unit into total seconds
  const convertToSeconds = (val: string, unit: TimeUnit): number => {
    const num = parseInt(val, 10) || 0;
    if (unit === 'sec') return num;
    if (unit === 'hr') return num * 3600;
    return num * 60; // min
  };

  // Handler for integer-only focus duration
  const handleWorkDurationChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setWorkDuration(sanitized);
    const secs = convertToSeconds(sanitized, workUnit);
    if (secs > 0) setSecondsLeft(secs);
  };

  // Handler for focus unit toggle
  const handleWorkUnitChange = (unit: TimeUnit) => {
    setWorkUnit(unit);
    const secs = convertToSeconds(workDuration, unit);
    if (secs > 0) setSecondsLeft(secs);
  };

  // Handler for integer-only break duration
  const handleBreakDurationChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setBreakDuration(sanitized);
  };

  // Handler for 3-digit max whole number session input
  const handleSessionsChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 3);
    setTotalSessions(sanitized);
  };

  // Timer countdown and phase transition logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      const parsedTotalSessions = parseInt(totalSessions, 10) || 1;
      const parsedFocusSecs = convertToSeconds(workDuration, workUnit);
      const parsedBreakSecs = convertToSeconds(breakDuration, breakUnit);

      setIsRunning(false);

      if (phase === 'FOCUS') {
        Vibration.vibrate([500, 1000, 500, 1000], true);
        setPhase('BREAK');
        setSecondsLeft(parsedBreakSecs);

        Alert.alert(
          'Focus Session Finished!',
          `Great job! Ready for your ${breakDuration} ${breakUnit} break?`,
          [
            {
              text: 'Start Break',
              onPress: () => {
                Vibration.cancel();
                setIsRunning(true);
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        if (currentSession < parsedTotalSessions) {
          const nextSession = currentSession + 1;
          Vibration.vibrate([500, 1000, 500, 1000], true);

          setCurrentSession(nextSession);
          setPhase('FOCUS');
          setSecondsLeft(parsedFocusSecs);

          Alert.alert(
            'Break Finished!',
            `Ready for Session ${nextSession} of ${parsedTotalSessions}?`,
            [
              {
                text: 'Start Focus',
                onPress: () => {
                  Vibration.cancel();
                  setIsRunning(true);
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          Vibration.vibrate([500, 1000, 500, 1000], true);

          Alert.alert(
            'Task Completed! 🎉',
            `Congratulations! You completed all ${parsedTotalSessions} session(s) for: ${
              activeGoal || 'your goal'
            }`,
            [
              {
                text: 'Awesome!',
                onPress: () => {
                  Vibration.cancel();
                },
              },
            ],
            { cancelable: false }
          );
          resetTimer();
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    secondsLeft,
    phase,
    currentSession,
    totalSessions,
    workDuration,
    workUnit,
    breakDuration,
    breakUnit,
    activeGoal,
  ]);

  const startTimer = () => {
    if (!goal.trim() && !activeGoal) {
      Alert.alert('Goal Required', 'Please enter a goal before starting the timer.');
      return;
    }

    const focusSecs = convertToSeconds(workDuration, workUnit);
    const breakSecs = convertToSeconds(breakDuration, breakUnit);
    const sessions = parseInt(totalSessions, 10);

    if (focusSecs <= 0) {
      Alert.alert('Invalid Focus Duration', 'Please enter a valid whole number for focus duration.');
      return;
    }
    if (breakSecs < 0 || isNaN(breakSecs)) {
      Alert.alert('Invalid Break Duration', 'Please enter a valid whole number for break duration.');
      return;
    }
    if (isNaN(sessions) || sessions <= 0) {
      Alert.alert('Invalid Sessions', 'Please enter a valid number of total sessions (1-999).');
      return;
    }

    if (!activeGoal) {
      setActiveGoal(goal.trim());
      setCurrentSession(1);
      setPhase('FOCUS');
      setSecondsLeft(focusSecs);
    }

    Vibration.cancel();
    setIsRunning(true);
    Keyboard.dismiss();
  };

  const pauseTimer = () => {
    Vibration.cancel();
    setIsRunning(false);
  };

  const resetTimer = () => {
    Vibration.cancel();
    setIsRunning(false);
    const focusSecs = convertToSeconds(workDuration, workUnit) || 15 * 60;
    setSecondsLeft(focusSecs);
    setPhase('FOCUS');
    setCurrentSession(1);
    setActiveGoal('');
    setGoal('');
  };

  const handleLogout = async () => {
    Vibration.cancel();
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Logout Error', error.message);
    }
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.userText}>{auth.currentUser?.email}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Goal Input Section */}
        <View style={styles.card}>
          <Text style={styles.label}>Goal / Objective:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Finish reading Chapter 3"
            value={goal}
            onChangeText={setGoal}
            editable={!isRunning && !activeGoal}
          />
        </View>

        {/* Session Configuration Panel */}
        {!isRunning && !activeGoal && (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Session Configuration</Text>

            {/* Focus Duration Input & Unit Picker */}
            <View style={styles.configBlock}>
              <Text style={styles.rowLabel}>Focus Duration:</Text>
              <View style={styles.inputUnitRow}>
                <TextInput
                  style={styles.numInput}
                  keyboardType="number-pad"
                  value={workDuration}
                  onChangeText={handleWorkDurationChange}
                />
                <View style={styles.unitToggleGroup}>
                  {(['sec', 'min', 'hr'] as TimeUnit[]).map((unit) => (
                    <TouchableOpacity
                      key={`work-${unit}`}
                      style={[styles.unitButton, workUnit === unit && styles.unitButtonActive]}
                      onPress={() => handleWorkUnitChange(unit)}
                    >
                      <Text style={[styles.unitText, workUnit === unit && styles.unitTextActive]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Break Duration Input & Unit Picker */}
            <View style={styles.configBlock}>
              <Text style={styles.rowLabel}>Allowed Break:</Text>
              <View style={styles.inputUnitRow}>
                <TextInput
                  style={styles.numInput}
                  keyboardType="number-pad"
                  value={breakDuration}
                  onChangeText={handleBreakDurationChange}
                />
                <View style={styles.unitToggleGroup}>
                  {(['sec', 'min', 'hr'] as TimeUnit[]).map((unit) => (
                    <TouchableOpacity
                      key={`break-${unit}`}
                      style={[styles.unitButton, breakUnit === unit && styles.unitButtonActive]}
                      onPress={() => setBreakUnit(unit)}
                    >
                      <Text style={[styles.unitText, breakUnit === unit && styles.unitTextActive]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Total Sessions Input (Max 3 digits, integers only) */}
            <View style={styles.configBlock}>
              <Text style={styles.rowLabel}>Total Sessions (Max 999):</Text>
              <TextInput
                style={[styles.numInput, { width: 80 }]}
                keyboardType="number-pad"
                maxLength={3}
                value={totalSessions}
                onChangeText={handleSessionsChange}
              />
            </View>
          </View>
        )}

        {/* Active Session Info Card */}
        {activeGoal ? (
          <View style={styles.activeGoalCard}>
            <Text style={styles.activeGoalLabel}>CURRENT FOCUS:</Text>
            <Text style={styles.activeGoalText}>{activeGoal}</Text>
            <Text style={styles.sessionBadge}>
              Session {currentSession} of {totalSessions}
            </Text>
          </View>
        ) : null}

        {/* Timer Display Ring */}
        <View style={[styles.timerCircle, { borderColor: isFocusPhase ? '#e74c3c' : '#2ecc71' }]}>
          <Text style={[styles.phaseBadge, { color: isFocusPhase ? '#e74c3c' : '#2ecc71' }]}>
            {isFocusPhase ? 'FOCUS TIME' : 'BREAK TIME'}
          </Text>
          <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsRow}>
          {!isRunning ? (
            <TouchableOpacity style={styles.startButton} onPress={startTimer}>
              <Text style={styles.buttonText}>
                {activeGoal ? (isFocusPhase ? 'Start Focus' : 'Start Break') : 'Start'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.pauseButton} onPress={pauseTimer}>
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  logoutText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 6,
  },
  card: {
    backgroundColor: '#fff',
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
    color: '#2c3e50',
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#bdc3c7',
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
    color: '#34495e',
    marginBottom: 6,
  },
  inputUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numInput: {
    height: 42,
    width: 65,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 3,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#34495e',
  },
  unitText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  unitTextActive: {
    color: '#fff',
  },
  activeGoalCard: {
    backgroundColor: '#eaf2f8',
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
    color: '#2c3e50',
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
    backgroundColor: '#fff',
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
    color: '#2c3e50',
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
    backgroundColor: '#2ecc71',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    height: 50,
    width: 130,
    backgroundColor: '#f39c12',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    height: 50,
    width: 100,
    backgroundColor: '#ecf0f1',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
});