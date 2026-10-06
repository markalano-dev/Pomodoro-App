import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getLogs,
  deleteLog,
  clearAllLogs,
  updateLog,
  touchLogLastUsed,
  LogItem,
} from '../services/storageService';
import { useTimer } from '../context/TimerContext';
import { useSettings } from '../context/SettingsContext';

interface ArchiveScreenProps {
  onNavigateHome?: () => void;
}

export default function ArchiveScreen({ onNavigateHome }: ArchiveScreenProps) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FAVORITES'>('ALL');

  // Modal State
  const [selectedTask, setSelectedTask] = useState<LogItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const { themeMode } = useSettings();
  const isDark = themeMode === 'dark';

  const {
    setGoal,
    handleWorkDurationChange,
    handleWorkUnitChange,
    handleBreakDurationChange,
    handleBreakUnitChange,
    handleSessionsChange,
    isRunning,
    activeGoal,
  } = useTimer();

  const fetchLogs = async () => {
    const data = await getLogs();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const openTaskDetails = (task: LogItem) => {
    setSelectedTask(task);
    setEditDescription(task.description || '');
    setIsFavorite(task.isFavorite || false);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
  };

  const handleToggleFavorite = () => {
    setIsFavorite((prev) => !prev);
  };

  const handleSaveNotesOnly = async () => {
    if (!selectedTask) return;

    const updated: LogItem = {
      ...selectedTask,
      description: editDescription.trim(),
      isFavorite,
    };

    await updateLog(updated);
    await fetchLogs();
    closeModal();
  };

  const handleReactivateTask = async () => {
    if (!selectedTask) return;

    if (isRunning || activeGoal) {
      Alert.alert(
        'Session In Progress',
        'Please complete or reset your active focus session before reactivating a task.'
      );
      return;
    }

    const taskTitle = selectedTask.goal;

    const updated: LogItem = {
      ...selectedTask,
      description: editDescription.trim(),
      isFavorite,
    };
    await updateLog(updated);
    await fetchLogs();

    await touchLogLastUsed(selectedTask.id);

    setGoal(selectedTask.goal);
    handleWorkDurationChange(selectedTask.workDuration);
    handleWorkUnitChange(selectedTask.workUnit);
    if (selectedTask.breakDuration) handleBreakDurationChange(selectedTask.breakDuration);
    if (selectedTask.breakUnit) handleBreakUnitChange(selectedTask.breakUnit);
    handleSessionsChange(selectedTask.totalSessions.toString());

    closeModal();

    if (onNavigateHome) {
      onNavigateHome();
      setTimeout(() => {
        Alert.alert(
          'Task Loaded & Ready! 🚀',
          `"${taskTitle}" values have been successfully set as your new timer configuration. Press Start whenever you are ready!`
        );
      }, 200);
    } else {
      Alert.alert(
        'Task Reactivated 🚀',
        `"${taskTitle}" values are ready on your Home screen!`
      );
    }
  };

  const handleDelete = (id: string, goalTitle: string) => {
    Alert.alert(
      'Delete Log Entry',
      `Are you sure you want to delete "${goalTitle}" from your archive?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteLog(id);
            if (selectedTask?.id === id) closeModal();
            await fetchLogs();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    const nonFavoritesCount = logs.filter((l) => !l.isFavorite).length;
    if (nonFavoritesCount === 0) {
      Alert.alert('No Standard Logs', 'All remaining logs are saved in Favorites and cannot be cleared automatically.');
      return;
    }

    Alert.alert(
      'Clear Non-Favorite History',
      'This will remove all standard archived tasks. Favorited tasks will remain saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Standard Tasks',
          style: 'destructive',
          onPress: async () => {
            await clearAllLogs();
            closeModal();
            await fetchLogs();
          },
        },
      ]
    );
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'FAVORITES') return log.isFavorite;
    return true;
  });

  const hasNonFavorites = logs.some((l) => !l.isFavorite);

  const renderLogCard = ({ item }: { item: LogItem }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          borderColor: isDark ? '#333333' : '#f0f3f6',
        },
      ]}
      onPress={() => openTaskDetails(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {item.isFavorite && (
            <Ionicons name="star" size={16} color="#f1c40f" style={{ marginRight: 4 }} />
          )}
          <Text
            style={[styles.goalTitle, { color: isDark ? '#ffffff' : '#2c3e50' }]}
            numberOfLines={1}
          >
            {item.goal}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isDark ? '#1e3a29' : '#d4efdf' }]}>
          <Text style={[styles.badgeText, { color: isDark ? '#2ecc71' : '#27ae60' }]}>
            COMPLETED 🎉
          </Text>
        </View>
      </View>

      <Text style={[styles.dateText, { color: isDark ? '#a0a0a0' : '#95a5a6' }]}>
        📅 {formatDate(item.completedAt)}
      </Text>

      {item.description ? (
        <Text
          style={[
            styles.descriptionSnippet,
            {
              backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
              color: isDark ? '#e0e0e0' : '#34495e',
            },
          ]}
          numberOfLines={2}
        >
          📝 {item.description}
        </Text>
      ) : null}

      <View style={[styles.statsRow, { backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa' }]}>
        <View style={styles.statBox}>
          <Ionicons name="checkmark-done-circle-outline" size={15} color="#27ae60" />
          <Text style={[styles.statDetail, { color: isDark ? '#e0e0e0' : '#34495e' }]}>
            {item.completedSessions} / {item.totalSessions} Sessions
          </Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={15} color="#2980b9" />
          <Text style={[styles.statDetail, { color: isDark ? '#e0e0e0' : '#34495e' }]}>
            {item.workDuration} {item.workUnit}/session
          </Text>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: isDark ? '#2c2c2c' : '#f8f9fa' }]}>
        <TouchableOpacity style={styles.reactivateButton} onPress={() => openTaskDetails(item)}>
          <Ionicons name="play-circle-outline" size={16} color="#2ecc71" />
          <Text style={styles.reactivateText}>View & Reactivate</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id, item.goal)}>
          <Ionicons name="trash-outline" size={15} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8f9fa' }]}>
      {/* Top Bar */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#2c3e50' }]}>Task Archive</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
            Reusable goal templates & history (3-day auto-clear)
          </Text>
        </View>
        {hasNonFavorites && (
          <TouchableOpacity
            style={[styles.clearAllButton, { backgroundColor: isDark ? '#4a151b' : '#fadbd8' }]}
            onPress={handleClearAll}
          >
            <Text style={[styles.clearAllText, { color: isDark ? '#ff6b6b' : '#e74c3c' }]}>
              Clear Non-Favorites
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: isDark ? '#2c2c2c' : '#ecf0f1' }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'ALL' && [
              styles.filterTabActive,
              { backgroundColor: isDark ? '#3e5062' : '#34495e' },
            ],
          ]}
          onPress={() => setActiveFilter('ALL')}
        >
          <Text
            style={[
              styles.filterText,
              { color: isDark ? '#a0a0a0' : '#7f8c8d' },
              activeFilter === 'ALL' && styles.filterTextActive,
            ]}
          >
            All Tasks ({logs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'FAVORITES' && [
              styles.filterTabActive,
              { backgroundColor: isDark ? '#3e5062' : '#34495e' },
            ],
          ]}
          onPress={() => setActiveFilter('FAVORITES')}
        >
          <Ionicons
            name="star"
            size={13}
            color={activeFilter === 'FAVORITES' ? '#ffffff' : '#f1c40f'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterText,
              { color: isDark ? '#a0a0a0' : '#7f8c8d' },
              activeFilter === 'FAVORITES' && styles.filterTextActive,
            ]}
          >
            Favorites ({logs.filter((l) => l.isFavorite).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List or Empty State */}
      {filteredLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={60} color={isDark ? '#444444' : '#bdc3c7'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
            {activeFilter === 'FAVORITES' ? 'No Favorite Tasks Yet' : 'No Archived Tasks'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#666666' : '#bdc3c7' }]}>
            {activeFilter === 'FAVORITES'
              ? 'Tap a task card and press the star icon to save it as a favorite template.'
              : 'Complete sessions in Home to automatically store reusable task logs here. Standard logs auto-expire after 3 days.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e74c3c']} />
          }
        />
      )}

      {/* Task Details & Reactivation Modal Container */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
                    Task Details
                  </Text>
                  <View style={styles.modalHeaderActions}>
                    <TouchableOpacity onPress={handleToggleFavorite} style={styles.starToggle}>
                      <Ionicons
                        name={isFavorite ? 'star' : 'star-outline'}
                        size={24}
                        color={isFavorite ? '#f1c40f' : '#95a5a6'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={24} color={isDark ? '#aaa' : '#7f8c8d'} />
                    </TouchableOpacity>
                  </View>
                </View>

                {selectedTask && (
                  <>
                    <View style={styles.detailBlock}>
                      <Text style={[styles.detailLabel, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
                        Goal Title
                      </Text>
                      <Text style={[styles.goalValue, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
                        {selectedTask.goal}
                      </Text>
                    </View>

                    <View style={[styles.detailGrid, { backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa' }]}>
                      <View style={styles.gridBox}>
                        <Text style={[styles.gridLabel, { color: isDark ? '#a0a0a0' : '#95a5a6' }]}>
                          Sessions
                        </Text>
                        <Text style={[styles.gridValue, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
                          {selectedTask.completedSessions} of {selectedTask.totalSessions}
                        </Text>
                      </View>
                      <View style={styles.gridBox}>
                        <Text style={[styles.gridLabel, { color: isDark ? '#a0a0a0' : '#95a5a6' }]}>
                          Focus Time
                        </Text>
                        <Text style={[styles.gridValue, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
                          {selectedTask.workDuration} {selectedTask.workUnit}
                        </Text>
                      </View>
                      <View style={styles.gridBox}>
                        <Text style={[styles.gridLabel, { color: isDark ? '#a0a0a0' : '#95a5a6' }]}>
                          Break Time
                        </Text>
                        <Text style={[styles.gridValue, { color: isDark ? '#ffffff' : '#2c3e50' }]}>
                          {selectedTask.breakDuration || '5'} {selectedTask.breakUnit || 'min'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailBlock}>
                      <Text style={[styles.detailLabel, { color: isDark ? '#a0a0a0' : '#7f8c8d' }]}>
                        Description / Favorite Focus Notes (Optional):
                      </Text>
                      <TextInput
                        style={[
                          styles.descriptionInput,
                          {
                            backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                            borderColor: isDark ? '#444444' : '#bdc3c7',
                            color: isDark ? '#ffffff' : '#2c3e50',
                          },
                        ]}
                        placeholder="Add notes, key links, or instructions to save with this favorite template..."
                        placeholderTextColor={isDark ? '#777777' : '#a0a0a0'}
                        multiline
                        numberOfLines={3}
                        value={editDescription}
                        onChangeText={setEditDescription}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={handleReactivateTask}
                    >
                      <Ionicons name="play-sharp" size={18} color="#ffffff" />
                      <Text style={styles.primaryActionText}>Save & Reactivate Task</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.secondaryActionButton,
                        { backgroundColor: isDark ? '#2c2c2c' : '#ecf0f1' },
                      ]}
                      onPress={handleSaveNotesOnly}
                    >
                      <Ionicons name="save-outline" size={16} color={isDark ? '#e0e0e0' : '#34495e'} />
                      <Text
                        style={[
                          styles.secondaryActionText,
                          { color: isDark ? '#e0e0e0' : '#34495e' },
                        ]}
                      >
                        Save Notes Only
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterTabActive: {},
  filterText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingBottom: 30,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 11,
    marginBottom: 6,
  },
  descriptionSnippet: {
    fontSize: 12,
    fontStyle: 'italic',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDetail: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
  },
  reactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactivateText: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starToggle: {
    padding: 2,
  },
  detailBlock: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  goalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  gridBox: {
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  primaryActionButton: {
    flexDirection: 'row',
    backgroundColor: '#2ecc71',
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});