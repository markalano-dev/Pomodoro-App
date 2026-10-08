import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export type TimeUnit = 'sec' | 'min' | 'hr';
export type TimerPhase = 'FOCUS' | 'BREAK';

export interface CompletedSession {
  goal: string;
  sessionNumber: number;
  totalSessions: number;
  duration: string;
  unit: TimeUnit;
  breakDuration: string;
  breakUnit: TimeUnit;
  completedAt: string;
  notes?: string;
  isFavorite?: boolean;
}

interface TimerContextType {
  goal: string;
  setGoal: (goal: string) => void;
  activeGoal: string;
  workDuration: string;
  workUnit: TimeUnit;
  breakDuration: string;
  breakUnit: TimeUnit;
  setBreakUnit: (unit: TimeUnit) => void;
  totalSessions: string;
  currentSession: number;
  phase: TimerPhase;
  secondsLeft: number;
  isRunning: boolean;
  history: CompletedSession[];
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  handleWorkDurationChange: (val: string) => void;
  handleWorkUnitChange: (unit: TimeUnit) => void;
  handleBreakDurationChange: (val: string) => void;
  handleSessionsChange: (val: string) => void;
  clearHistory: () => Promise<void>;
  updateGoalNotes: (goalName: string, notes: string) => Promise<void>;
  toggleGoalFavorite: (goalName: string) => Promise<void>;
  reactivateGoal: (params: {
    goal: string;
    workDuration: string;
    workUnit: TimeUnit;
    breakDuration: string;
    breakUnit: TimeUnit;
    totalSessions: string;
  }) => void;
  logIncompleteGoal: (goalName: string, totalSessionsCount: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const getDurationInSeconds = (durationStr: string, unit: TimeUnit): number => {
  const numeric = parseInt(durationStr, 10);
  if (isNaN(numeric) || numeric <= 0) return 0;
  if (unit === 'sec') return numeric;
  if (unit === 'hr') return numeric * 3600;
  return numeric * 60; // 'min'
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goal, setGoal] = useState('');
  const [activeGoal, setActiveGoal] = useState('');
  const [workDuration, setWorkDuration] = useState('');
  const [workUnit, setWorkUnit] = useState<TimeUnit>('min');
  const [breakDuration, setBreakDuration] = useState('');
  const [breakUnit, setBreakUnit] = useState<TimeUnit>('min');
  const [totalSessions, setTotalSessions] = useState('');
  const [currentSession, setCurrentSession] = useState(1);
  const [phase, setPhase] = useState<TimerPhase>('FOCUS');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<CompletedSession[]>([]);

  const getHistoryKey = (uid: string | null) => {
    return uid ? `@pomodoro_app_history_${uid}` : '@pomodoro_app_history_guest';
  };

  // Load user-scoped history
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const key = getHistoryKey(user.uid);
          const savedHistory = await AsyncStorage.getItem(key);
          if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
          } else {
            setHistory([]);
          }
        } catch (e) {
          console.warn('Failed to load user timer history', e);
        }
      } else {
        setHistory([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const saveHistoryToStorage = async (updatedHistory: CompletedSession[]) => {
    try {
      const uid = auth.currentUser?.uid || null;
      const key = getHistoryKey(uid);
      await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn('Failed to save timer history', e);
    }
  };

  const handleWorkDurationChange = (val: string) => {
    setWorkDuration(val);
    if (!isRunning && phase === 'FOCUS') {
      const secs = getDurationInSeconds(val, workUnit);
      setSecondsLeft(secs);
    }
  };

  const handleWorkUnitChange = (unit: TimeUnit) => {
    setWorkUnit(unit);
    if (!isRunning && phase === 'FOCUS') {
      const secs = getDurationInSeconds(workDuration, unit);
      setSecondsLeft(secs);
    }
  };

  const handleBreakDurationChange = (val: string) => {
    setBreakDuration(val);
    if (!isRunning && phase === 'BREAK') {
      const secs = getDurationInSeconds(val, breakUnit);
      setSecondsLeft(secs);
    }
  };

  const handleSessionsChange = (val: string) => setTotalSessions(val);

  // Active Countdown Interval Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handlePhaseCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, phase, currentSession, workDuration, workUnit, breakDuration, breakUnit, totalSessions, activeGoal, goal]);

  const handlePhaseCompletion = async () => {
    setIsRunning(false);

    const parsedTotal = Math.max(1, parseInt(totalSessions || '4', 10));
    const currentTargetGoal = (activeGoal || goal || 'Focus Session').trim();

    if (phase === 'FOCUS') {
      // Record completed focus session in history
      const newEntry: CompletedSession = {
        goal: currentTargetGoal,
        sessionNumber: currentSession,
        totalSessions: parsedTotal,
        duration: workDuration || '25',
        unit: workUnit,
        breakDuration: breakDuration || '5',
        breakUnit: breakUnit,
        completedAt: new Date().toISOString(),
        notes: '',
        isFavorite: false,
      };

      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      await saveHistoryToStorage(updatedHistory);

      // Transition to BREAK phase
      setPhase('BREAK');
      const breakSecs = getDurationInSeconds(breakDuration, breakUnit);
      setSecondsLeft(breakSecs);
    } else {
      // BREAK phase completed -> transition to next FOCUS session
      const nextSession = currentSession + 1;
      setCurrentSession(nextSession);
      setPhase('FOCUS');
      const focusSecs = getDurationInSeconds(workDuration, workUnit);
      setSecondsLeft(focusSecs);
    }
  };

  const startTimer = () => {
    if (!activeGoal) {
      setActiveGoal(goal || 'Focus Session');
    }

    // Initialize secondsLeft if currently uninitialized or 0
    if (secondsLeft <= 0) {
      const dur = phase === 'FOCUS'
        ? getDurationInSeconds(workDuration, workUnit)
        : getDurationInSeconds(breakDuration, breakUnit);
      setSecondsLeft(dur);
    }

    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setActiveGoal('');
    setGoal('');
    setWorkDuration('');
    setBreakDuration('');
    setTotalSessions('');
    setCurrentSession(1);
    setPhase('FOCUS');
    setSecondsLeft(0);
  };

  const clearHistory = async () => {
    try {
      const preservedFavorites = history.filter((item) => item.isFavorite === true);
      setHistory(preservedFavorites);
      await saveHistoryToStorage(preservedFavorites);
    } catch (error) {
      console.warn('Failed to clear history:', error);
    }
  };

  const updateGoalNotes = async (goalName: string, notes: string) => {
    const updated = history.map((item) => {
      if ((item.goal || '').trim() === goalName.trim()) {
        return { ...item, notes };
      }
      return item;
    });
    setHistory(updated);
    await saveHistoryToStorage(updated);
  };

  const toggleGoalFavorite = async (goalName: string) => {
    const targetKey = goalName.trim();
    const isCurrentlyFav = history.some(
      (item) => (item.goal || '').trim() === targetKey && item.isFavorite
    );

    const updated = history.map((item) => {
      if ((item.goal || '').trim() === targetKey) {
        return { ...item, isFavorite: !isCurrentlyFav };
      }
      return item;
    });

    setHistory(updated);
    await saveHistoryToStorage(updated);
  };

  const reactivateGoal = (params: {
    goal: string;
    workDuration: string;
    workUnit: TimeUnit;
    breakDuration: string;
    breakUnit: TimeUnit;
    totalSessions: string;
  }) => {
    setIsRunning(false);
    setGoal(params.goal);
    setActiveGoal(params.goal);
    setWorkDuration(params.workDuration);
    setWorkUnit(params.workUnit);
    setBreakDuration(params.breakDuration);
    setBreakUnit(params.breakUnit);
    setTotalSessions(params.totalSessions);
    setCurrentSession(1);
    setPhase('FOCUS');
    const initialSecs = getDurationInSeconds(params.workDuration, params.workUnit);
    setSecondsLeft(initialSecs);
  };

  const logIncompleteGoal = async (goalName: string, totalSessionsCount: number) => {
    const newEntry: CompletedSession = {
      goal: goalName,
      sessionNumber: 0,
      totalSessions: totalSessionsCount,
      duration: '0',
      unit: workUnit,
      breakDuration: breakDuration || '5',
      breakUnit: breakUnit,
      completedAt: new Date().toISOString(),
      notes: '',
      isFavorite: false,
    };

    const updated = [newEntry, ...history];
    setHistory(updated);
    await saveHistoryToStorage(updated);
  };

  return (
    <TimerContext.Provider
      value={{
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
        history,
        startTimer,
        pauseTimer,
        resetTimer,
        handleWorkDurationChange,
        handleWorkUnitChange,
        handleBreakDurationChange,
        handleSessionsChange,
        clearHistory,
        updateGoalNotes,
        toggleGoalFavorite,
        reactivateGoal,
        logIncompleteGoal,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};