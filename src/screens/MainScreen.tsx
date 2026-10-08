import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  Image,
  Vibration,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';
import { useTimer, TimeUnit } from '../context/TimerContext';
import { useSettings } from '../context/SettingsContext';
import MascotView from '../components/MascotView';
import BreakAlertModal from '../components/BreakAlertModal';
import FocusAlertModal from '../components/FocusAlertModal';
import SessionCompleteModal from '../components/SessionCompleteModal';
import ObjectiveAlertModal from '../components/ObjectiveAlertModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MainScreen() {
  const insets = useSafeAreaInsets();
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
    history,
    startTimer,
    pauseTimer,
    resetTimer,
    handleWorkDurationChange,
    handleWorkUnitChange,
    handleBreakDurationChange,
    handleSessionsChange,
    logIncompleteGoal,
  } = useTimer();

  const { username, profileImage, themeMode, activeFocusColor, vibrationEnabled } = useSettings() as any;
  
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [showIncompleteIntervalModal, setShowIncompleteIntervalModal] = useState(false);

  // Initialize input state to empty strings so placeholders act as visual cues only
  const [inputWork, setInputWork] = useState('');
  const [inputBreak, setInputBreak] = useState('');
  const [inputSessions, setInputSessions] = useState('');

  const lastVibratedKeyRef = useRef<string | null>(null);
  const breakModalShownRef = useRef<boolean>(false);
  const focusModalShownRef = useRef<boolean>(false);

  const isDark = themeMode === 'dark';

  const colors = {
    bg: isDark ? '#12131C' : '#F9F8F6',
    card: isDark ? '#1D1E2A' : '#FFFFFF',
    textPrimary: isDark ? '#FFFFFF' : '#1D1E2A',
    textSecondary: isDark ? '#8A8C9E' : '#7F8C8D',
    accentFocus: activeFocusColor || '#FF7E67',
    accentBreak: '#4ECDC4',
    inputBg: isDark ? '#2A2B3D' : '#F1F0EC',
    border: isDark ? '#2A2B3C' : '#E8E6E1',
  };

  const isFocusPhase = phase === 'FOCUS';
  const activeAccent = isFocusPhase ? colors.accentFocus : colors.accentBreak;
  const effectiveTotalSessions = totalSessions || '4';
  const parsedTotalSessions = Math.max(1, parseInt(effectiveTotalSessions, 10) || 4);

  const displayName = username?.trim()
    ? username
    : auth?.currentUser?.email || 'Focus Buddy';

  const bottomPadding = Math.max(insets.bottom, 12) + 85;

  const goToSlide = (slideIndex: 0 | 1) => {
    setActiveSlide(slideIndex);
    Animated.timing(slideAnim, {
      toValue: slideIndex === 0 ? 0 : -SCREEN_WIDTH,
      duration: 320,
      useNativeDriver: true,
    }).start();
  };

  const triggerVibration = (pattern: number[]) => {
    if (vibrationEnabled) {
      Vibration.vibrate(pattern, false);
    }
  };

  const clampValue = (valStr: string, unit: TimeUnit): string => {
    if (!valStr) return '';
    const numeric = parseInt(valStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(numeric)) return '';
    
    let maxAllowed = 60;
    if (unit === 'hr') maxAllowed = 24;
    if (unit === 'min') maxAllowed = 60;
    if (unit === 'sec') maxAllowed = 60;

    const clamped = Math.min(maxAllowed, Math.max(0, numeric));
    return clamped.toString();
  };

  useEffect(() => {
    if (activeGoal) {
      setInputWork(workDuration || '');
      setInputBreak(breakDuration || '');
      setInputSessions(totalSessions || '');
    }
  }, [activeGoal]);

  useEffect(() => {
    if (phase === 'FOCUS') {
      breakModalShownRef.current = false;
    } else if (phase === 'BREAK') {
      focusModalShownRef.current = false;
    }
  }, [phase]);

  useEffect(() => {
    if (inputWork) {
      const reclamped = clampValue(inputWork, workUnit);
      if (reclamped !== inputWork) {
        setInputWork(reclamped);
        handleWorkDurationChange(reclamped);
      }
    }
  }, [workUnit]);

  useEffect(() => {
    if (inputBreak) {
      const reclamped = clampValue(inputBreak, breakUnit);
      if (reclamped !== inputBreak) {
        setInputBreak(reclamped);
        handleBreakDurationChange(reclamped);
      }
    }
  }, [breakUnit]);

  useEffect(() => {
    if (isRunning && activeSlide === 0) {
      goToSlide(1);
    }
  }, [isRunning]);

  const onWorkChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 2);
    const validated = clampValue(sanitized, workUnit);
    setInputWork(validated);
    handleWorkDurationChange(validated);
  };

  const onBreakChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 2);
    const validated = clampValue(sanitized, breakUnit);
    setInputBreak(validated);
    handleBreakDurationChange(validated);
  };

  const onSessionsChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 2);
    const numeric = parseInt(sanitized, 10);
    const validSessions = isNaN(numeric) ? '' : Math.min(99, Math.max(1, numeric)).toString();
    setInputSessions(validSessions);
    handleSessionsChange(validSessions);
  };

  const handleReset = () => {
    Vibration.cancel();
    lastVibratedKeyRef.current = null;
    breakModalShownRef.current = false;
    focusModalShownRef.current = false;
    setInputWork('');
    setInputBreak('');
    setInputSessions('');
    resetTimer();
    goToSlide(0);
  };

  const handleExitSession = () => {
    Vibration.cancel();
    setShowBreakModal(false);
    setShowFocusModal(false);
    const activeTarget = activeGoal || goal;
    if (activeTarget.trim()) {
      const existingCompleted = history.filter(
        (h) => h.goal.trim() === activeTarget.trim() && h.sessionNumber > 0 && h.duration !== '0'
      );
      if (existingCompleted.length === 0) {
        logIncompleteGoal(activeTarget.trim(), parsedTotalSessions);
      }
    }
    handleReset();
  };

  useEffect(() => {
    if (!isRunning && activeGoal) {
      const isFinalSession = (currentSession ?? 1) >= parsedTotalSessions;

      if (isFinalSession && (secondsLeft === 0 || phase === 'BREAK')) {
        const transitionKey = `COMPLETE_${currentSession}`;
        if (lastVibratedKeyRef.current !== transitionKey) {
          lastVibratedKeyRef.current = transitionKey;
          triggerVibration([0, 500, 200, 500]);
          setShowCompleteModal(true);
          setShowBreakModal(false);
          setShowFocusModal(false);
        }
        return;
      }

      if (phase === 'BREAK' && (secondsLeft ?? 0) > 0 && !isFinalSession) {
        if (!breakModalShownRef.current) {
          breakModalShownRef.current = true;
          triggerVibration([0, 400, 200, 400]);
          setShowBreakModal(true);
          setShowFocusModal(false);
          setShowCompleteModal(false);
        }
        return;
      }

      if (
        phase === 'FOCUS' &&
        (currentSession ?? 1) > 1 &&
        (currentSession ?? 1) <= parsedTotalSessions &&
        (secondsLeft ?? 0) > 0
      ) {
        if (!focusModalShownRef.current) {
          focusModalShownRef.current = true;
          triggerVibration([0, 300, 150, 300]);
          setShowFocusModal(true);
          setShowBreakModal(false);
          setShowCompleteModal(false);
        }
        return;
      }
    }
  }, [phase, isRunning, secondsLeft, currentSession, parsedTotalSessions, activeGoal]);

  const handleStartFromSetup = () => {
    const isGoalValid = (goal || activeGoal || '').trim().length > 0;
    const isWorkValid = inputWork.trim().length > 0 && parseInt(inputWork, 10) > 0;
    const isBreakValid = inputBreak.trim().length > 0 && parseInt(inputBreak, 10) > 0;
    const isSessionsValid = inputSessions.trim().length > 0 && parseInt(inputSessions, 10) > 0;

    if (!isGoalValid) {
      setShowObjectiveModal(true);
      return;
    }

    if (!isWorkValid || !isBreakValid || !isSessionsValid) {
      setShowIncompleteIntervalModal(true);
      return;
    }

    Vibration.cancel();
    Keyboard.dismiss();
    goToSlide(1);
    startTimer();
  };

  const handleStartFromTimer = () => {
    const isGoalValid = (goal || activeGoal || '').trim().length > 0;
    if (!isGoalValid) {
      setShowObjectiveModal(true);
      return;
    }

    Vibration.cancel();
    Keyboard.dismiss();
    startTimer();
  };

  const handlePause = () => {
    Vibration.cancel();
    pauseTimer();
  };

  const handleStartBreak = () => {
    Vibration.cancel();
    setShowBreakModal(false);
    startTimer();
  };

  const handleStartNextFocus = () => {
    Vibration.cancel();
    setShowFocusModal(false);
    startTimer();
  };

  const handleCloseCompleteModal = () => {
    Vibration.cancel();
    setShowCompleteModal(false);
    handleReset();
  };

  const formatTime = (totalSeconds: number = 0) => {
    const safeSecs = Math.max(0, totalSeconds);
    const hrs = Math.floor(safeSecs / 3600);
    const mins = Math.floor((safeSecs % 3600) / 60);
    const secs = safeSecs % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.min(
    100,
    Math.max(0, (((currentSession - 1) / parsedTotalSessions) * 100))
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      
      {/* Background Liquid Wave Header */}
      <View style={styles.liquidHeaderContainer} pointerEvents="none">
        <Svg height="110" width="100%" viewBox="0 0 1440 320">
          <Path
            fill={activeAccent}
            fillOpacity="0.25"
            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,0,0Z"
          />
        </Svg>
      </View>

      {/* Top Header Row */}
      <View style={styles.topHeaderBar}>
        <View style={styles.userInfo}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: activeAccent }]}>
              <Ionicons name="paw" size={18} color="#FFFFFF" />
            </View>
          )}
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Ready to focus?</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{displayName}</Text>
          </View>
        </View>

        <View style={styles.topRightControls}>
          <View style={[styles.slidePillContainer, { backgroundColor: colors.inputBg }]}>
            <TouchableOpacity
              style={[
                styles.slideDotPill,
                activeSlide === 0 && { backgroundColor: activeAccent },
              ]}
              onPress={() => goToSlide(0)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={14}
                color={activeSlide === 0 ? '#FFFFFF' : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.slideDotPill,
                activeSlide === 1 && { backgroundColor: activeAccent },
              ]}
              onPress={() => goToSlide(1)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="timer-outline"
                size={14}
                color={activeSlide === 1 ? '#FFFFFF' : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.phasePill, { backgroundColor: activeAccent }]}>
            <Text style={styles.phasePillText}>{isFocusPhase ? 'FOCUS' : 'BREAK'}</Text>
          </View>
        </View>
      </View>

      {/* HORIZONTAL SLIDING ANIMATED CONTAINER */}
      <Animated.View
        style={[
          styles.slidesContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        
        {/* SLIDE 0: SETUP */}
        <View style={[styles.slidePage, { width: SCREEN_WIDTH }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.slideScrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            overScrollMode="never"
            bounces={true}
          >
            {/* Goal Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                CURRENT OBJECTIVE <Text style={{ color: colors.accentFocus }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.goalInput,
                  { backgroundColor: colors.inputBg, color: colors.textPrimary },
                ]}
                placeholder="e.g. Finish reading Chapter 3"
                placeholderTextColor={colors.textSecondary}
                value={goal || ''}
                onChangeText={setGoal}
                editable={!isRunning && !activeGoal}
              />
            </View>

            {/* Interval Settings */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Interval Settings</Text>

              {/* Focus Time Input */}
              <View style={styles.configRow}>
                <Text style={[styles.configLabel, { color: colors.textPrimary }]}>
                  Focus Time <Text style={styles.limitTag}>({workUnit === 'hr' ? 'Max 24' : 'Max 60'})</Text>
                </Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.numInput, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={inputWork}
                    placeholder="25"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={onWorkChange}
                    editable={!isRunning && !activeGoal}
                  />
                  <View style={[styles.unitGroup, { backgroundColor: colors.inputBg }]}>
                    {(['sec', 'min', 'hr'] as TimeUnit[]).map((unit) => (
                      <TouchableOpacity
                        key={`work-${unit}`}
                        style={[styles.unitPill, workUnit === unit && { backgroundColor: colors.accentFocus }]}
                        onPress={() => handleWorkUnitChange(unit)}
                        disabled={isRunning || !!activeGoal}
                      >
                        <Text style={[styles.unitText, { color: workUnit === unit ? '#FFFFFF' : colors.textSecondary }]}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Break Time Input */}
              <View style={styles.configRow}>
                <Text style={[styles.configLabel, { color: colors.textPrimary }]}>
                  Break Time <Text style={styles.limitTag}>({breakUnit === 'hr' ? 'Max 24' : 'Max 60'})</Text>
                </Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.numInput, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={inputBreak}
                    placeholder="5"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={onBreakChange}
                    editable={!isRunning && !activeGoal}
                  />
                  <View style={[styles.unitGroup, { backgroundColor: colors.inputBg }]}>
                    {(['sec', 'min', 'hr'] as TimeUnit[]).map((unit) => (
                      <TouchableOpacity
                        key={`break-${unit}`}
                        style={[styles.unitPill, breakUnit === unit && { backgroundColor: colors.accentBreak }]}
                        onPress={() => setBreakUnit(unit)}
                        disabled={isRunning || !!activeGoal}
                      >
                        <Text style={[styles.unitText, { color: breakUnit === unit ? '#FFFFFF' : colors.textSecondary }]}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Total Sessions Input */}
              <View style={styles.configRow}>
                <View style={styles.sessionLabelContainer}>
                  <Text style={[styles.configLabel, { color: colors.textPrimary }]}>Total Sessions</Text>
                  <View style={[styles.infoTagBadge, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name="information-circle-outline" size={12} color={colors.accentFocus} />
                    <Text style={[styles.infoTagText, { color: colors.textSecondary }]}>Max 99 sessions</Text>
                  </View>
                </View>

                <TextInput
                  style={[styles.numInput, { width: 70, backgroundColor: colors.inputBg, color: colors.textPrimary }]}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={inputSessions}
                  placeholder="4"
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={onSessionsChange}
                  editable={!isRunning && !activeGoal}
                />
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.slide0ActionRow}>
              <TouchableOpacity
                style={[styles.largeSlideBtn, { backgroundColor: activeAccent, flex: 1 }]}
                onPress={handleStartFromSetup}
                activeOpacity={0.88}
              >
                <Text style={styles.largeSlideBtnText}>
                  {activeGoal ? 'Resume Focus Session' : 'Start Focus Block'}
                </Text>
                <Ionicons name="arrow-forward-circle" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resetIconButton, { backgroundColor: colors.inputBg }]}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>

        {/* SLIDE 1: TIMER STAGE */}
        <View style={[styles.slidePage, { width: SCREEN_WIDTH }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.slideScrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            overScrollMode="never"
            bounces={true}
          >
            {/* Active Banner */}
            <View style={[styles.activeBanner, { backgroundColor: isDark ? '#2A2B3D' : '#EFECE6' }]}>
              <Text style={[styles.activeBannerLabel, { color: activeAccent }]}>CURRENT FOCUS TARGET</Text>
              <Text style={[styles.activeBannerText, { color: colors.textPrimary }]} numberOfLines={2}>
                {activeGoal || goal || 'Ready to Focus'}
              </Text>
            </View>

            {/* Stage Timer Card */}
            <View style={[styles.fullStageTimerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              
              <View style={[styles.largeTimerCircle, { borderColor: activeAccent }]}>
                <MascotView size={130} />
                <Text style={[styles.largeTimerText, { color: colors.textPrimary }]}>
                  {formatTime(secondsLeft)}
                </Text>
              </View>

              <View style={styles.sessionTracker}>
                <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
                  SESSION {currentSession ?? 1} OF {parsedTotalSessions}
                </Text>

                {parsedTotalSessions <= 5 ? (
                  <View style={styles.blockMeterRow}>
                    {Array.from({ length: parsedTotalSessions }).map((_, idx) => (
                      <View
                        key={`block-${idx}`}
                        style={[
                          styles.meterBlock,
                          {
                            backgroundColor:
                              idx < (currentSession ?? 1)
                                ? activeAccent
                                : isDark
                                ? '#2A2B3D'
                                : '#E8E6E1',
                          },
                        ]}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={[styles.progressTrack, { backgroundColor: colors.inputBg }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progressPercentage}%`,
                          backgroundColor: activeAccent,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>

              <View style={styles.controlsRow}>
                {!isRunning ? (
                  <>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: activeAccent }]}
                      onPress={handleStartFromTimer}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="play" size={22} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryBtnText}>
                        {activeGoal ? (isFocusPhase ? 'Focus' : 'Break') : 'Start Focus'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.secondaryBtn, { backgroundColor: colors.inputBg }]}
                      onPress={handleReset}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Reset</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.pauseBtn, { backgroundColor: '#FFA000', flex: 1 }]}
                      onPress={handlePause}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="pause" size={22} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryBtnText}>Pause Timer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.secondaryBtn, { backgroundColor: colors.inputBg }]}
                      onPress={handleReset}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Reset</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.backToSettingsBtn, { backgroundColor: colors.inputBg }]}
                onPress={() => goToSlide(0)}
                activeOpacity={0.8}
              >
                <Ionicons name="options-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.backToSettingsText, { color: colors.textSecondary }]}>
                  Edit Interval Settings
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </View>

      </Animated.View>

      {/* Modals */}
      <BreakAlertModal
        visible={showBreakModal}
        onClose={() => {
          Vibration.cancel();
          setShowBreakModal(false);
        }}
        onStartBreak={handleStartBreak}
        onExitSession={handleExitSession}
        breakDuration={breakDuration}
        breakUnit={breakUnit}
        isLongBreak={breakUnit === 'min' && parseInt(breakDuration || '5', 10) > 10}
      />

      <FocusAlertModal
        visible={showFocusModal}
        onClose={() => {
          Vibration.cancel();
          setShowFocusModal(false);
        }}
        onStartFocus={handleStartNextFocus}
        onExitSession={handleExitSession}
        currentSession={currentSession ?? 1}
        totalSessions={parsedTotalSessions}
      />

      <SessionCompleteModal
        visible={showCompleteModal}
        onClose={handleCloseCompleteModal}
        totalSessions={parsedTotalSessions}
      />

      <ObjectiveAlertModal
        visible={showObjectiveModal}
        onClose={() => setShowObjectiveModal(false)}
      />

      {/* BRAND-ALIGNED INCOMPLETE INTERVAL SETTINGS MODAL */}
      <Modal
        visible={showIncompleteIntervalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIncompleteIntervalModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowIncompleteIntervalModal(false)}>
          <View style={styles.modalOverlayCenter}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCardCenter, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconGlowBadge, { backgroundColor: isDark ? '#3D2222' : '#FDE8E8' }]}>
                  <Ionicons name="time-outline" size={38} color="#FF5252" />
                </View>

                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Incomplete Interval Settings
                </Text>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  Please enter values for Focus Time, Break Time, and Total Sessions before starting your timer.
                </Text>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: activeAccent }]}
                  onPress={() => setShowIncompleteIntervalModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  liquidHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 10,
    fontWeight: '600',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slidePillContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 999,
  },
  slideDotPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phasePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  phasePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  slidesContainer: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 2,
  },
  slidePage: {
    flex: 1,
  },
  slideScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  goalInput: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  limitTag: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  sessionLabelContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  infoTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  infoTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numInput: {
    height: 42,
    width: 65,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
  unitGroup: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
  },
  unitPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  unitText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  slide0ActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  largeSlideBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  largeSlideBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resetIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBanner: {
    padding: 14,
    borderRadius: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  activeBannerLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  activeBannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fullStageTimerCard: {
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  largeTimerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  largeTimerText: {
    fontSize: 44,
    fontWeight: '900',
    marginTop: 4,
  },
  sessionTracker: {
    alignItems: 'center',
    marginBottom: 22,
    width: '100%',
  },
  sessionText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  blockMeterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  meterBlock: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  progressTrack: {
    width: '85%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 54,
    paddingHorizontal: 30,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtn: {
    flexDirection: 'row',
    height: 54,
    paddingHorizontal: 22,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  backToSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 4,
  },
  backToSettingsText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Custom Center Modal Styles */
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCardCenter: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  iconGlowBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});