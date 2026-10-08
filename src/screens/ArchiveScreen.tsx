import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimer, CompletedSession, TimeUnit } from '../context/TimerContext';
import { useSettings } from '../context/SettingsContext';
import { MASCOT_HERO_ASSETS, MASCOT_SUB_ASSETS } from '../config/mascotAssets';
import { getThemeColors } from '../config/theme';

interface ArchiveScreenProps {
  onNavigateHome?: () => void;
}

interface GroupedGoalHistory {
  goal: string;
  completedSessionsCount: number;
  totalSessionsCount: number;
  remainingSessionsCount: number;
  isCompleted: boolean;
  lastCompletedAt: string;
  durationsSummary: string;
  notes: string;
  isFavorite: boolean;
  workDuration: string;
  workUnit: TimeUnit;
  breakDuration: string;
  breakUnit: TimeUnit;
}

export default function ArchiveScreen({ onNavigateHome }: ArchiveScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    history,
    clearHistory,
    updateGoalNotes,
    toggleGoalFavorite,
    reactivateGoal,
  } = useTimer();
  const { themeMode, activeFocusColor } = useSettings() as any;
  const isDark = themeMode === 'dark';
  const colors = getThemeColors(isDark);
  const currentAccent = activeFocusColor || colors.accentFocus;

  const [selectedGoal, setSelectedGoal] = useState<GroupedGoalHistory | null>(null);
  const [modalNotes, setModalNotes] = useState('');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showNotesSavedModal, setShowNotesSavedModal] = useState(false);

  const bottomPadding = Math.max(insets.bottom, 12) + 85;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupHistoryByGoal = (logs: CompletedSession[]): GroupedGoalHistory[] => {
    const groupsMap: { [key: string]: CompletedSession[] } = {};

    logs.forEach((item) => {
      const goalKey = (item.goal || 'Focus Session').trim();
      if (!groupsMap[goalKey]) {
        groupsMap[goalKey] = [];
      }
      groupsMap[goalKey].push(item);
    });

    return Object.keys(groupsMap).map((goalName) => {
      const sessionList = groupsMap[goalName];
      
      const validCompletedSessions = sessionList.filter(
        (s) => s.sessionNumber > 0 && s.duration !== '0'
      );
      const completedCount = validCompletedSessions.length;

      const maxTotalSessions = Math.max(
        ...sessionList.map((s) => s.totalSessions || 4)
      );

      const isCompleted = completedCount >= maxTotalSessions;
      const remainingSessionsCount = Math.max(0, maxTotalSessions - completedCount);

      const sortedByDate = [...sessionList].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      const existingNotes = sessionList.find((s) => s.notes)?.notes || '';
      const isFav = sessionList.some((s) => s.isFavorite);

      const sampleWorkDuration = sessionList.find((s) => s.duration && s.duration !== '0')?.duration || '25';
      const sampleWorkUnit = sessionList.find((s) => s.unit)?.unit || 'min';
      const sampleBreakDuration = sessionList.find((s) => s.breakDuration)?.breakDuration || '5';
      const sampleBreakUnit = sessionList.find((s) => s.breakUnit)?.breakUnit || 'min';

      return {
        goal: goalName,
        completedSessionsCount: completedCount,
        totalSessionsCount: maxTotalSessions,
        remainingSessionsCount,
        isCompleted,
        lastCompletedAt: sortedByDate[0]?.completedAt || new Date().toISOString(),
        durationsSummary: `${sampleWorkDuration} ${sampleWorkUnit} / block`,
        notes: existingNotes,
        isFavorite: isFav,
        workDuration: sampleWorkDuration,
        workUnit: sampleWorkUnit,
        breakDuration: sampleBreakDuration,
        breakUnit: sampleBreakUnit,
      };
    });
  };

  const groupedHistory = groupHistoryByGoal(history);

  const handleOpenGoalModal = (item: GroupedGoalHistory) => {
    setSelectedGoal(item);
    setModalNotes(item.notes || '');
  };

  const handleSaveNotes = () => {
    if (selectedGoal) {
      updateGoalNotes(selectedGoal.goal, modalNotes);
      setSelectedGoal((prev) => (prev ? { ...prev, notes: modalNotes } : null));
      setShowNotesSavedModal(true);
    }
  };

  const handleToggleFavorite = () => {
    if (selectedGoal) {
      toggleGoalFavorite(selectedGoal.goal);
      setSelectedGoal((prev) =>
        prev ? { ...prev, isFavorite: !prev.isFavorite } : null
      );
    }
  };

  const handleReactivateGoal = () => {
    if (selectedGoal) {
      reactivateGoal({
        goal: selectedGoal.goal,
        workDuration: selectedGoal.workDuration,
        workUnit: selectedGoal.workUnit,
        breakDuration: selectedGoal.breakDuration,
        breakUnit: selectedGoal.breakUnit,
        totalSessions: selectedGoal.totalSessionsCount.toString(),
      });
      setSelectedGoal(null);
      if (onNavigateHome) {
        onNavigateHome();
      }
    }
  };

  const handleConfirmClearHistory = () => {
    clearHistory();
    setShowClearConfirmModal(false);
  };

  const renderGoalCard = ({ item }: { item: GroupedGoalHistory }) => (
    <TouchableOpacity
      style={[
        styles.sessionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      activeOpacity={0.85}
      onPress={() => handleOpenGoalModal(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View style={[styles.pawBadge, { backgroundColor: isDark ? '#2A2B3D' : '#F1F0EC' }]}>
            <Image
              source={MASCOT_SUB_ASSETS.PAW_PRINTS}
              style={styles.pawIcon}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[styles.goalText, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {item.goal}
          </Text>

          {item.isFavorite && (
            <Ionicons name="star" size={18} color="#FFD700" style={{ marginLeft: 4 }} />
          )}
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDate(item.lastCompletedAt)}
          </Text>
        </View>
      </View>

      <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

      <View style={styles.cardFooter}>
        {item.isCompleted ? (
          <View style={[styles.statusBadge, { backgroundColor: isDark ? '#1C332B' : '#E8F8F5' }]}>
            <Ionicons name="checkmark-circle" size={15} color="#2ECC71" />
            <Text style={[styles.statusBadgeText, { color: '#2ECC71' }]}>
              Completed ({item.completedSessionsCount}/{item.totalSessionsCount})
            </Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: isDark ? '#3D2222' : '#FDE8E8' }]}>
            <Ionicons name="time" size={15} color={colors.danger || '#FF6B6B'} />
            <Text style={[styles.statusBadgeText, { color: colors.danger || '#FF6B6B' }]}>
              Not Finished ({item.remainingSessionsCount} remaining)
            </Text>
          </View>
        )}

        <View style={[styles.metricBadge, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="hourglass-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.metricBadgeText, { color: colors.textPrimary }]}>
            {item.durationsSummary}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.liquidHeaderContainer} pointerEvents="none">
        <Svg height="120" width="100%" viewBox="0 0 1440 320">
          <Path
            fill={currentAccent}
            fillOpacity="0.22"
            d="M0,128L48,149.3C96,171,192,213,288,213.3C384,213,480,171,576,149.3C672,128,768,128,864,149.3C960,171,1056,213,1152,202.7C1248,192,1344,128,1392,96L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,0,0Z"
          />
        </Svg>
      </View>

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              LOGS & ACHIEVEMENTS
            </Text>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
              Focus History
            </Text>
          </View>

          {history.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowClearConfirmModal(true)}
              style={[styles.clearBtn, { backgroundColor: colors.inputBg }]}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color={colors.danger || '#FF6B6B'} />
              <Text style={[styles.clearBtnText, { color: colors.danger || '#FF6B6B' }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {groupedHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.mascotGlowCircle, { backgroundColor: isDark ? '#1D1E2A' : '#FFFFFF' }]}>
              <Image
                source={MASCOT_HERO_ASSETS.ARCHIVE_LOGS}
                style={styles.emptyMascot}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Focus Logs Yet!
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Complete your first objective to start building your personal focus history.
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupedHistory}
            keyExtractor={(item, index) => `goal-group-${index}-${item.goal}`}
            renderItem={renderGoalCard}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            overScrollMode="never"
            bounces={true}
          />
        )}
      </View>

      {/* ARCHIVED GOAL DETAIL POP-UP MODAL */}
      <Modal
        visible={!!selectedGoal}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedGoal(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedGoal(null)}>
          <View style={styles.modalOverlayBottom}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                
                {/* Modal Top Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalHeaderTitleGroup}>
                    <Text style={[styles.modalSubLabel, { color: colors.textSecondary }]}>
                      ARCHIVED OBJECTIVE
                    </Text>
                    <Text style={[styles.modalGoalTitle, { color: colors.textPrimary }]}>
                      {selectedGoal?.goal}
                    </Text>
                  </View>

                  <View style={styles.modalHeaderActions}>
                    <TouchableOpacity
                      style={[styles.iconCircleBtn, { backgroundColor: colors.inputBg }]}
                      onPress={handleToggleFavorite}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={selectedGoal?.isFavorite ? 'star' : 'star-outline'}
                        size={20}
                        color={selectedGoal?.isFavorite ? '#FFD700' : colors.textSecondary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.iconCircleBtn, { backgroundColor: colors.inputBg }]}
                      onPress={() => setSelectedGoal(null)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                  overScrollMode="never"
                  bounces={true}
                  style={{ width: '100%' }}
                >
                  
                  {/* Status & Info Badges */}
                  <View style={styles.infoGrid}>
                    <View style={[styles.infoGridBox, { backgroundColor: colors.inputBg }]}>
                      <Text style={[styles.infoGridLabel, { color: colors.textSecondary }]}>STATUS</Text>
                      <Text style={[
                        styles.infoGridValue,
                        { color: selectedGoal?.isCompleted ? '#2ECC71' : (colors.danger || '#FF6B6B') }
                      ]}>
                        {selectedGoal?.isCompleted ? 'Completed' : 'Not Finished'}
                      </Text>
                    </View>

                    <View style={[styles.infoGridBox, { backgroundColor: colors.inputBg }]}>
                      <Text style={[styles.infoGridLabel, { color: colors.textSecondary }]}>SESSIONS</Text>
                      <Text style={[styles.infoGridValue, { color: colors.textPrimary }]}>
                        {selectedGoal?.completedSessionsCount} / {selectedGoal?.totalSessionsCount} Blocks
                      </Text>
                    </View>

                    <View style={[styles.infoGridBox, { backgroundColor: colors.inputBg }]}>
                      <Text style={[styles.infoGridLabel, { color: colors.textSecondary }]}>FOCUS / BREAK</Text>
                      <Text style={[styles.infoGridValue, { color: colors.textPrimary }]}>
                        {selectedGoal?.workDuration} {selectedGoal?.workUnit} / {selectedGoal?.breakDuration} {selectedGoal?.breakUnit}
                      </Text>
                    </View>

                    <View style={[styles.infoGridBox, { backgroundColor: colors.inputBg }]}>
                      <Text style={[styles.infoGridLabel, { color: colors.textSecondary }]}>LAST ACTIVE</Text>
                      <Text style={[styles.infoGridValue, { color: colors.textPrimary }]}>
                        {selectedGoal ? formatDate(selectedGoal.lastCompletedAt) : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Notes & Save Notes Button */}
                  <View style={styles.notesSection}>
                    <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
                      NOTES & DESCRIPTION
                    </Text>
                    <TextInput
                      style={[
                        styles.notesInput,
                        {
                          backgroundColor: colors.inputBg,
                          color: colors.textPrimary,
                          borderColor: colors.border,
                        },
                      ]}
                      multiline
                      numberOfLines={4}
                      placeholder="Add notes, reminders, or insights for this objective..."
                      placeholderTextColor={colors.textSecondary}
                      value={modalNotes}
                      onChangeText={setModalNotes}
                      textAlignVertical="top"
                    />

                    {/* Explicit Save Notes Button */}
                    <TouchableOpacity
                      style={[styles.saveNotesBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                      onPress={handleSaveNotes}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-done" size={16} color={currentAccent} />
                      <Text style={[styles.saveNotesBtnText, { color: colors.textPrimary }]}>Save Notes</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Reactivate / Reuse Goal Action Button */}
                  <TouchableOpacity
                    style={[styles.reactivateBtn, { backgroundColor: currentAccent }]}
                    onPress={handleReactivateGoal}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="reload" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.reactivateBtnText}>Reactivate Objective</Text>
                  </TouchableOpacity>

                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* BRAND-ALIGNED NOTES SAVED POP-UP */}
      <Modal
        visible={showNotesSavedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotesSavedModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNotesSavedModal(false)}>
          <View style={styles.modalOverlayCenter}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconGlowBadge, { backgroundColor: isDark ? `${currentAccent}25` : `${currentAccent}15` }]}>
                  <Ionicons name="checkmark-circle" size={42} color={currentAccent} />
                </View>

                <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                  Notes Saved
                </Text>
                <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                  Your description for this objective has been saved.
                </Text>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: currentAccent }]}
                  onPress={() => setShowNotesSavedModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* BRAND-ALIGNED CLEAR HISTORY CONFIRMATION POP-UP */}
      <Modal
        visible={showClearConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearConfirmModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowClearConfirmModal(false)}>
          <View style={styles.modalOverlayCenter}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.warningBadge, { backgroundColor: isDark ? '#3D1C1C' : '#FDE8E8' }]}>
                  <Ionicons name="trash-bin-outline" size={36} color="#FF5252" />
                </View>

                <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                  Clear Focus History?
                </Text>
                <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                  All archived focus logs will be permanently removed, <Text style={{ fontWeight: '800', color: currentAccent }}>except for logs tagged as Favorites</Text>.
                </Text>

                <View style={styles.confirmActionRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: colors.inputBg }]}
                    onPress={() => setShowClearConfirmModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.proceedClearBtn, { backgroundColor: '#FF5252' }]}
                    onPress={handleConfirmClearHistory}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.proceedClearBtnText}>Proceed</Text>
                  </TouchableOpacity>
                </View>
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
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 22,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  listContent: {
    gap: 14,
  },
  sessionCard: {
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  pawBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pawIcon: {
    width: 16,
    height: 16,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 42,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
    opacity: 0.6,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  metricBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  mascotGlowCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyMascot: {
    width: 130,
    height: 130,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 270,
    lineHeight: 19,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalHeaderTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  modalSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalGoalTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  infoGridBox: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
  },
  infoGridLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoGridValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  notesInput: {
    borderRadius: 18,
    padding: 14,
    fontSize: 14,
    fontWeight: '600',
    minHeight: 100,
    borderWidth: 1,
  },
  saveNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 999,
    marginTop: 10,
    borderWidth: 1,
  },
  saveNotesBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  reactivateBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  reactivateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  /* Center Confirmation Modal Styles */
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  confirmContainer: {
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
  },
  iconGlowBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
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
  confirmActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  proceedClearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedClearBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});