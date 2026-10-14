import React from 'react';
import { StyleSheet, View, Image, ImageSourcePropType } from 'react-native';
import { useTimer } from '../context/TimerContext';
import { MASCOT_HERO_ASSETS, MASCOT_SUB_ASSETS } from '../config/mascotAssets';

interface MascotViewProps {
  size?: number;
  overrideAsset?: ImageSourcePropType;
}

export default function MascotView({ size = 110, overrideAsset }: MascotViewProps) {
  const { phase, isRunning, activeGoal, secondsLeft, breakDuration, breakUnit } = useTimer();

  const getMascotImage = (): ImageSourcePropType => {
    if (overrideAsset) return overrideAsset;

    // 1. Pre-start / Idle state
    if (!isRunning && !activeGoal) {
      return MASCOT_HERO_ASSETS.IDLE;
    }
    // 2. Paused during active session
    if (!isRunning && activeGoal && secondsLeft > 0) {
      return MASCOT_HERO_ASSETS.PAUSED;
    }
    // 3. Active Focus session
    if (isRunning && phase === 'FOCUS') {
      return MASCOT_HERO_ASSETS.ACTIVE_FOCUS;
    }
    // 4. Break session (Long vs Short break based on configured break duration)
    if (phase === 'BREAK') {
      const isLongBreak =
        breakUnit === 'hr' ||
        (breakUnit === 'min' && parseInt(breakDuration || '5', 10) > 10);
      return isLongBreak ? MASCOT_SUB_ASSETS.SLEEPING : MASCOT_HERO_ASSETS.SHORT_BREAK;
    }
    // 5. Completed session
    if (!isRunning && activeGoal && secondsLeft === 0) {
      return MASCOT_SUB_ASSETS.STAR_EYES;
    }
    return MASCOT_HERO_ASSETS.IDLE;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image source={getMascotImage()} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});