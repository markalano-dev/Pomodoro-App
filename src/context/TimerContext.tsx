import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vibration } from 'react-native';
import { addLog, LogItem } from '../services/storageService';
import { useSettings } from './SettingsContext';

export type TimeUnit = 'sec' | 'min' | 'hr';
export type TimerPhase = 'FOCUS' | 'BREAK';

interface TimerContextType {
  goal: string;
  setGoal: (goal: string) => void;
  activeGoal: string;
  workDuration: string;
  workUnit: TimeUnit;
  breakDuration: string;
  breakUnit: TimeUnit;
  totalSessions: string;
  currentSession: number;
  phase: TimerPhase;
  secondsLeft: number;
  isRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  handleWorkDurationChange: (text: string) => void;
  handleWorkUnitChange: (unit: TimeUnit) => void;
  handleBreakDurationChange: (text: string) => void;
  handleBreakUnitChange: (unit: TimeUnit) => void;
  handleSessionsChange: (text: string) => void;
  setBreakUnit: (unit: TimeUnit) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { defaultFocusDuration, defaultBreakDuration, defaultSessions } = useSettings();

  const [goal, setGoal] = useState('');
  const [activeGoal, setActiveGoal] = useState('');
  const [workDuration, setWorkDuration] = useState(defaultFocusDuration);
  const [workUnit, setWorkUnit] = useState<TimeUnit>('min');
  const [breakDuration, setBreakDuration] = useState(defaultBreakDuration);
  const [breakUnit, setBreakUnit] = useState<TimeUnit>('min');
  const [totalSessions, setTotalSessions] = useState(defaultSessions);

  const [currentSession, setCurrentSession] = useState(1);
  const [phase, setPhase] = useState<TimerPhase>('FOCUS');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Helper function to enforce unit max values
  const clampDurationByUnit = (valStr: string, unit: TimeUnit): string => {
    const sanitized = valStr.replace(/[^0-9]/g, '');
    if (!sanitized) return '';
    const num = parseInt(sanitized, 10);
    if (unit === 'hr') return Math.min(num, 24).toString();
    if (unit === 'min') return Math.min(num, 60).toString();
    if (unit === 'sec') return Math.min(num, 60).toString();
    return sanitized;
  };

  useEffect(() => {
    if (!isRunning && !activeGoal) {
      setWorkDuration(defaultFocusDuration);
      setBreakDuration(defaultBreakDuration);
      setTotalSessions(defaultSessions);
    }
  }, [defaultFocusDuration, defaultBreakDuration, defaultSessions, isRunning, activeGoal]);

  const convertToSeconds = (valStr: string, unit: TimeUnit, fallbackDefault: number): number => {
    const num = parseInt(valStr, 10);
    let effectiveNum = isNaN(num) || num <= 0 ? fallbackDefault : num;
    if (unit === 'hr') effectiveNum = Math.min(effectiveNum, 24);
    if (unit === 'min') effectiveNum = Math.min(effectiveNum, 60);
    if (unit === 'sec') effectiveNum = Math.min(effectiveNum, 60);

    if (unit === 'sec') return effectiveNum;
    if (unit === 'min') return effectiveNum * 60;
    if (unit === 'hr') return effectiveNum * 3600;
    return effectiveNum * 60;
  };

  useEffect(() => {
    if (!isRunning && !activeGoal) {
      const initialSecs = convertToSeconds(workDuration, workUnit, 25);
      setSecondsLeft(initialSecs);
    }
  }, [workDuration, workUnit, isRunning, activeGoal]);

  const handleWorkDurationChange = (text: string) => {
    setWorkDuration(clampDurationByUnit(text, workUnit));
  };

  const handleWorkUnitChange = (unit: TimeUnit) => {
    setWorkUnit(unit);
    if (workDuration) {
      setWorkDuration(clampDurationByUnit(workDuration, unit));
    }
  };

  const handleBreakDurationChange = (text: string) => {
    setBreakDuration(clampDurationByUnit(text, breakUnit));
  };

  const handleBreakUnitChange = (unit: TimeUnit) => {
    setBreakUnit(unit);
    if (breakDuration) {
      setBreakDuration(clampDurationByUnit(breakDuration, unit));
    }
  };

  const handleSessionsChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 2);
    setTotalSessions(sanitized);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      const parsedTotalSessions = parseInt(totalSessions, 10) || 4;
      const parsedFocusSecs = convertToSeconds(workDuration, workUnit, 25);
      const parsedBreakSecs = convertToSeconds(breakDuration, breakUnit, 5);

      setIsRunning(false);

      if (phase === 'FOCUS') {
        Vibration.vibrate([500, 1000, 500, 1000], true);
        setPhase('BREAK');
        setSecondsLeft(parsedBreakSecs);
      } else {
        Vibration.vibrate([500, 1000, 500, 1000], true);
        if (currentSession < parsedTotalSessions) {
          setCurrentSession((prev) => prev + 1);
          setPhase('FOCUS');
          setSecondsLeft(parsedFocusSecs);
        } else {
          const completedItem: LogItem = {
            id: Date.now().toString(),
            goal: activeGoal || goal || 'Focus Session',
            completedSessions: parsedTotalSessions,
            totalSessions: parsedTotalSessions,
            workDuration: workDuration || '25',
            workUnit,
            breakDuration: breakDuration || '5',
            breakUnit,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            isFavorite: false,
            description: '',
          };
          addLog(completedItem);

          setActiveGoal('');
          setCurrentSession(1);
          setPhase('FOCUS');
          setSecondsLeft(parsedFocusSecs);
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
    goal,
  ]);

  const startTimer = () => {
    if (!activeGoal) {
      const trimmed = goal.trim() || 'Focus Session';
      setActiveGoal(trimmed);
      setGoal(trimmed);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    Vibration.cancel();
    setIsRunning(false);
    setActiveGoal('');
    setCurrentSession(1);
    setPhase('FOCUS');
    const resetSecs = convertToSeconds(workDuration, workUnit, 25);
    setSecondsLeft(resetSecs);
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
        handleBreakUnitChange: (unit) => handleBreakUnitChange(unit),
        handleSessionsChange,
        setBreakUnit: (unit) => handleBreakUnitChange(unit),
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within TimerProvider');
  return context;
};