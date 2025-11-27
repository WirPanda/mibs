import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, courses as defaultCourses, availableDates } from '@/constants/courses';
import { RegistrationData } from './RegistrationContext';
import { createRemoteSnapshotPoller, pushRemoteMutation, clearServerUrlCache } from '@/utils/remoteSync';
import type { RemoteMutationPayload } from '@/utils/remoteSync';
import type { UserDirectoryEntry } from '@/types/userDirectory';

export interface Registration extends RegistrationData {
  id: string;
  registeredAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  courseResult?: 'passed' | 'failed';
  courseNotes?: string;
}

export type ManagedUser = UserDirectoryEntry;

export interface AdminSession {
  isAuthenticated: boolean;
  lastActivity: number;
  deviceId: string;
}

const ADMIN_PIN = '123456';
const SESSION_TIMEOUT = 15 * 60 * 1000;
const STORAGE_KEYS = {
  courses: 'admin_courses',
  registrations: 'admin_registrations',
  availableDates: 'admin_available_dates',
  activityLog: 'admin_activity_log',
  users: 'admin_user_directory',
  serverUrl: 'admin_server_url',
};

const generateTempPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < 8; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length);
    password += alphabet[index];
  }
  return password;
};

export interface ActivityLogEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminId: string;
}

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [coursesList, setCoursesList] = useState<Course[]>(defaultCourses);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [dates, setDates] = useState<string[]>(availableDates);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [remoteSyncEnabled, setRemoteSyncEnabled] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState('');

  useEffect(() => {
    const loadServerUrl = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.serverUrl);
      const url = stored || '';
      setServerUrl(url);
      setRemoteSyncEnabled(Boolean(url));
      setSyncStatusMessage(url ? 'Онлайн-синхронизация активна' : 'Локальный режим хранения данных (без онлайн-синхронизации)');
    };
    loadServerUrl();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        setIsAuthenticated(false);
        console.log('Session expired due to inactivity');
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity]);

  useEffect(() => {
    if (!remoteSyncEnabled) {
      return undefined;
    }
    const stopPolling = createRemoteSnapshotPoller(snapshot => {
      setCoursesList(snapshot.courses);
      setRegistrations(snapshot.registrations);
      setDates(snapshot.dates);
      if (snapshot.users) {
        setManagedUsers(snapshot.users);
      }
      setLastSyncedAt(snapshot.updatedAt);
    });
    return stopPolling;
  }, [remoteSyncEnabled]);

  const loadData = async () => {
    try {
      const [storedCourses, storedRegistrations, storedDates, storedLog, storedUsers] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.courses),
        AsyncStorage.getItem(STORAGE_KEYS.registrations),
        AsyncStorage.getItem(STORAGE_KEYS.availableDates),
        AsyncStorage.getItem(STORAGE_KEYS.activityLog),
        AsyncStorage.getItem(STORAGE_KEYS.users),
      ]);

      if (storedCourses) setCoursesList(JSON.parse(storedCourses));
      if (storedRegistrations) setRegistrations(JSON.parse(storedRegistrations));
      if (storedDates) setDates(JSON.parse(storedDates));
      if (storedLog) setActivityLog(JSON.parse(storedLog));
      if (storedUsers) setManagedUsers(JSON.parse(storedUsers));
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (key: string, data: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const syncRemote = useCallback(async (payload: RemoteMutationPayload) => {
    if (!remoteSyncEnabled) {
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    const success = await pushRemoteMutation({
      ...payload,
      source: 'admin',
    });
    setIsSyncing(false);
    if (!success) {
      setSyncError('Не удалось синхронизировать данные. Проверьте подключение.');
      return;
    }
    const syncedAt = new Date().toISOString();
    setLastSyncedAt(syncedAt);
  }, [remoteSyncEnabled]);

  const updateUsersState = useCallback((mutator: (users: ManagedUser[]) => ManagedUser[]) => {
    setManagedUsers(prev => {
      const updated = mutator(prev);
      saveData(STORAGE_KEYS.users, updated);
      void syncRemote({ users: updated, reason: 'USER_DIRECTORY' });
      return updated;
    });
  }, [syncRemote]);

  const logActivity = useCallback((action: string, details: string) => {
    const entry: ActivityLogEntry = {
      id: Date.now().toString(),
      action,
      details,
      timestamp: new Date().toISOString(),
      adminId: 'admin',
    };
    setActivityLog(prev => {
      const updated = [entry, ...prev].slice(0, 100);
      saveData(STORAGE_KEYS.activityLog, updated);
      return updated;
    });
  }, []);

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const verifyPin = useCallback((pin: string): boolean => {
    const isValid = pin === ADMIN_PIN;
    if (isValid) {
      setIsAuthenticated(true);
      setLastActivity(Date.now());
      logActivity('LOGIN', 'Admin logged in');
    } else {
      logActivity('LOGIN_FAILED', 'Failed login attempt');
    }
    return isValid;
  }, [logActivity]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const addCourse = useCallback((course: Omit<Course, 'id'>) => {
    updateActivity();
    const newCourse: Course = {
      ...course,
      id: Date.now().toString(),
    };
    setCoursesList(prev => {
      const updated = [...prev, newCourse];
      saveData(STORAGE_KEYS.courses, updated);
      void syncRemote({ courses: updated, reason: 'COURSE_ADDED' });
      return updated;
    });
    logActivity('COURSE_ADDED', `Added course: ${course.name}`);
  }, [logActivity, syncRemote, updateActivity]);

  const updateCourse = useCallback((id: string, updates: Partial<Course>) => {
    updateActivity();
    setCoursesList(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      saveData(STORAGE_KEYS.courses, updated);
      void syncRemote({ courses: updated, reason: 'COURSE_UPDATED' });
      return updated;
    });
    logActivity('COURSE_UPDATED', `Updated course ID: ${id}`);
  }, [logActivity, syncRemote, updateActivity]);

  const deleteCourse = useCallback((id: string) => {
    updateActivity();
    setCoursesList(prev => {
      const course = prev.find(c => c.id === id);
      const updated = prev.filter(c => c.id !== id);
      saveData(STORAGE_KEYS.courses, updated);
      void syncRemote({ courses: updated, reason: 'COURSE_DELETED' });
      logActivity('COURSE_DELETED', `Deleted course: ${course?.name || id}`);
      return updated;
    });
  }, [logActivity, syncRemote, updateActivity]);

  const addRegistration = useCallback((data: RegistrationData) => {
    const registration: Registration = {
      ...data,
      id: Date.now().toString(),
      registeredAt: new Date().toISOString(),
      status: 'confirmed',
    };
    setRegistrations(prev => {
      const updated = [...prev, registration];
      saveData(STORAGE_KEYS.registrations, updated);
      void syncRemote({ registrations: updated, reason: 'REGISTRATION_ADDED' });
      return updated;
    });
  }, [syncRemote]);

  const updateRegistrationStatus = useCallback((id: string, status: Registration['status']) => {
    updateActivity();
    setRegistrations(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status } : r);
      saveData(STORAGE_KEYS.registrations, updated);
      void syncRemote({ registrations: updated, reason: 'REGISTRATION_STATUS' });
      return updated;
    });
    logActivity('REGISTRATION_STATUS_CHANGED', `Registration ${id} status changed to ${status}`);
  }, [logActivity, syncRemote, updateActivity]);

  const updateRegistrationResult = useCallback((id: string, result: 'passed' | 'failed', notes?: string) => {
    updateActivity();
    setRegistrations(prev => {
      const updated = prev.map(r =>
        r.id === id
          ? { ...r, courseResult: result, courseNotes: notes, status: 'confirmed' as const }
          : r
      );
      saveData(STORAGE_KEYS.registrations, updated);
      void syncRemote({ registrations: updated, reason: 'REGISTRATION_RESULT' });
      return updated;
    });
    logActivity('REGISTRATION_RESULT_UPDATED', `Registration ${id} result: ${result}`);
  }, [logActivity, syncRemote, updateActivity]);

  const deleteRegistration = useCallback((id: string) => {
    updateActivity();
    setRegistrations(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveData(STORAGE_KEYS.registrations, updated);
      void syncRemote({ registrations: updated, reason: 'REGISTRATION_DELETED' });
      return updated;
    });
    logActivity('REGISTRATION_DELETED', `Deleted registration: ${id}`);
  }, [logActivity, syncRemote, updateActivity]);

  const addAvailableDate = useCallback((date: string) => {
    updateActivity();
    setDates(prev => {
      if (prev.includes(date)) return prev;
      const updated = [...prev, date].sort();
      saveData(STORAGE_KEYS.availableDates, updated);
      void syncRemote({ dates: updated, reason: 'DATE_ADDED' });
      return updated;
    });
    logActivity('DATE_ADDED', `Added available date: ${date}`);
  }, [logActivity, syncRemote, updateActivity]);

  const removeAvailableDate = useCallback((date: string) => {
    updateActivity();
    setDates(prev => {
      const updated = prev.filter(d => d !== date);
      saveData(STORAGE_KEYS.availableDates, updated);
      void syncRemote({ dates: updated, reason: 'DATE_REMOVED' });
      return updated;
    });
    logActivity('DATE_REMOVED', `Removed available date: ${date}`);
  }, [logActivity, syncRemote, updateActivity]);

  const updateManagedUser = useCallback((id: string, updates: Partial<ManagedUser>) => {
    updateUsersState(prev => prev.map(user =>
      user.id === id || user.email === updates.email
        ? { ...user, ...updates, updatedAt: new Date().toISOString() }
        : user
    ));
    logActivity('USER_UPDATED', `User ${id} updated`);
  }, [logActivity, updateUsersState]);

  const toggleUserAccess = useCallback((id: string, isActive: boolean, note?: string) => {
    updateUsersState(prev => prev.map(user =>
      user.id === id
        ? {
            ...user,
            isActive,
            blockedAt: isActive ? undefined : new Date().toISOString(),
            notes: note ?? user.notes,
            updatedAt: new Date().toISOString(),
          }
        : user
    ));
    logActivity(isActive ? 'USER_UNBLOCKED' : 'USER_BLOCKED', `User ${id} access ${isActive ? 'enabled' : 'disabled'}`);
  }, [logActivity, updateUsersState]);

  const deleteManagedUser = useCallback((id: string) => {
    updateUsersState(prev => prev.filter(user => user.id !== id));
    logActivity('USER_REMOVED', `User ${id} removed from directory`);
  }, [logActivity, updateUsersState]);

  const resetUserPassword = useCallback((id: string) => {
    const tempPassword = generateTempPassword();
    updateUsersState(prev => prev.map(user =>
      user.id === id
        ? { ...user, temporaryPassword: tempPassword, updatedAt: new Date().toISOString() }
        : user
    ));
    logActivity('USER_PASSWORD_RESET', `Temporary password issued for ${id}`);
    return tempPassword;
  }, [logActivity, updateUsersState]);

  const getRegistrationsByCourse = useCallback((courseId: string) => {
    return registrations.filter(r => r.courseId === courseId);
  }, [registrations]);

  const getRegistrationsByDate = useCallback((date: string) => {
    return registrations.filter(r => r.selectedDate === date);
  }, [registrations]);

  const updateServerUrl = useCallback(async (newUrl: string) => {
    const trimmedUrl = newUrl.trim();
    await AsyncStorage.setItem(STORAGE_KEYS.serverUrl, trimmedUrl);
    clearServerUrlCache();
    setServerUrl(trimmedUrl);
    setRemoteSyncEnabled(Boolean(trimmedUrl));
    setSyncStatusMessage(trimmedUrl ? 'Онлайн-синхронизация активна' : 'Локальный режим хранения данных (без онлайн-синхронизации)');
    logActivity('SERVER_URL_UPDATED', `Server URL ${trimmedUrl ? 'set' : 'cleared'}`);
  }, [logActivity]);

  const testServerConnection = useCallback(async (testUrl: string): Promise<{ success: boolean; message: string }> => {
    try {
      const normalizedBase = testUrl.endsWith('/') ? testUrl.slice(0, -1) : testUrl;
      const endpoint = `${normalizedBase}/snapshot`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Соединение успешно установлено',
        };
      }
      
      return {
        success: false,
        message: `Ошибка сервера: ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Не удалось подключиться к серверу',
      };
    }
  }, []);

  const exportRegistrationsData = useCallback(() => {
    return registrations.map(r => ({
      ФИО: r.fullName,
      Возраст: r.age,
      Телефон: r.phone,
      Email: r.email,
      Курс: r.courseName,
      Дата: r.selectedDate,
      Статус: r.status === 'confirmed' ? 'Подтверждено' : r.status === 'pending' ? 'Ожидание' : 'Отменено',
      'Дата регистрации': new Date(r.registeredAt).toLocaleString('ru-RU'),
    }));
  }, [registrations]);

  const stats = useMemo(() => ({
    totalCourses: coursesList.length,
    totalRegistrations: registrations.length,
    confirmedRegistrations: registrations.filter(r => r.status === 'confirmed').length,
    pendingRegistrations: registrations.filter(r => r.status === 'pending').length,
    cancelledRegistrations: registrations.filter(r => r.status === 'cancelled').length,
    availableDates: dates.length,
    totalUsers: managedUsers.length,
    blockedUsers: managedUsers.filter(user => !user.isActive).length,
  }), [coursesList.length, registrations, dates.length, managedUsers]);

  return {
    isAuthenticated,
    isLoading,
    coursesList,
    registrations,
    availableDates: dates,
    activityLog,
    managedUsers,
    stats,
    verifyPin,
    logout,
    updateActivity,
    addCourse,
    updateCourse,
    deleteCourse,
    addRegistration,
    updateRegistrationStatus,
    updateRegistrationResult,
    deleteRegistration,
    addAvailableDate,
    removeAvailableDate,
    getRegistrationsByCourse,
    getRegistrationsByDate,
    exportRegistrationsData,
    remoteSyncInfo: {
      enabled: remoteSyncEnabled,
      isSyncing,
      lastSyncedAt,
      error: syncError,
      message: syncStatusMessage,
    },
    updateManagedUser,
    toggleUserAccess,
    deleteManagedUser,
    resetUserPassword,
    serverUrl,
    updateServerUrl,
    testServerConnection,
  };
});
