import AsyncStorage from '@react-native-async-storage/async-storage';

export type TimeUnit = 'sec' | 'min' | 'hr';

export interface LogItem {
  id: string;
  goal: string;
  completedAt: string; // ISO date when task was completed
  lastUsedAt?: string;  // ISO date when task was last reactivated/reused
  totalSessions: number;
  completedSessions: number;
  workDuration: string;
  workUnit: TimeUnit;
  breakDuration?: string;
  breakUnit?: TimeUnit;
  status: 'COMPLETED' | 'PARTIAL';
  description?: string;
  isFavorite?: boolean;
}

const ARCHIVE_STORAGE_KEY = '@pomodoro_archive_logs';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const getLogs = async (): Promise<LogItem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!jsonValue) return [];

    const parsedLogs: LogItem[] = JSON.parse(jsonValue);
    const now = Date.now();

    // Prune non-favorite tasks older than 3 days since last completion/reuse
    const validLogs = parsedLogs.filter((item) => {
      if (item.isFavorite) return true; // Favorites never expire automatically
      const referenceTime = new Date(item.lastUsedAt || item.completedAt).getTime();
      return now - referenceTime <= THREE_DAYS_MS;
    });

    // If any items expired, sync pruned list back to storage
    if (validLogs.length !== parsedLogs.length) {
      await AsyncStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(validLogs));
    }

    return validLogs;
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
};

export const saveLog = async (logData: Omit<LogItem, 'id' | 'completedAt'>): Promise<void> => {
  try {
    const existingLogs = await getLogs();
    const nowIso = new Date().toISOString();
    const newLog: LogItem = {
      ...logData,
      id: Date.now().toString(),
      completedAt: nowIso,
      lastUsedAt: nowIso,
      isFavorite: logData.isFavorite || false,
      description: logData.description || '',
    };
    const updatedLogs = [newLog, ...existingLogs];
    await AsyncStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error saving log:', error);
  }
};

export const updateLog = async (updatedLog: LogItem): Promise<void> => {
  try {
    const existingLogs = await getLogs();
    const updatedLogs = existingLogs.map((item) =>
      item.id === updatedLog.id ? updatedLog : item
    );
    await AsyncStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error updating log:', error);
  }
};

export const touchLogLastUsed = async (id: string): Promise<void> => {
  try {
    const existingLogs = await getLogs();
    const nowIso = new Date().toISOString();
    const updatedLogs = existingLogs.map((item) =>
      item.id === id ? { ...item, lastUsedAt: nowIso } : item
    );
    await AsyncStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error updating last used timestamp:', error);
  }
};

export const deleteLog = async (id: string): Promise<void> => {
  try {
    const existingLogs = await getLogs();
    const updatedLogs = existingLogs.filter((item) => item.id !== id);
    await AsyncStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error deleting log:', error);
  }
};

export const clearAllLogs = async (): Promise<void> => {
  try {
    // Only remove non-favorite logs; keep favorites intact
    const existingLogs = await getLogs();
    const favoriteLogs = existingLogs.filter((item) => item.isFavorite === true);
    await AsyncStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(favoriteLogs));
  } catch (error) {
    console.error('Error clearing non-favorite logs:', error);
  }
};

export const addLog = async (newLog: LogItem): Promise<void> => {
  try {
    const currentLogs = await getLogs();
    const updated = [newLog, ...currentLogs];
    await AsyncStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save log item:', e);
  }
};