import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendDomainVerificationCode } from '@/utils/emailService';
import type { UserDirectoryEntry } from '@/types/userDirectory';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  registeredAt: string;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  courseDate: string;
  enrolledAt: string;
  status: 'registered' | 'completed' | 'failed' | 'cancelled';
  result?: 'passed' | 'failed';
  notes?: string;
}

interface DomainVerificationState {
  email: string;
  code: string;
  expiresAt: number;
  fullName?: string;
  phone?: string;
}

const STORAGE_KEYS = {
  user: 'user_profile',
  enrollments: 'user_enrollments',
  isLoggedIn: 'user_is_logged_in',
  pendingVerification: 'user_pending_verification',
  directory: 'admin_user_directory',
};

const DOMAIN_SUFFIX = '@ldc.ru';
const CODE_LENGTH = 6;
const CODE_TTL = 10 * 60 * 1000;

const generateVerificationCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length);
    code += alphabet[index];
  }
  return code;
};

const useUserProviderValue = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [pendingVerification, setPendingVerification] = useState<DomainVerificationState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveUserData = useCallback(async (key: string, data: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }, []);

  const readDirectoryEntries = useCallback(async (): Promise<UserDirectoryEntry[]> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.directory);
      return stored ? (JSON.parse(stored) as UserDirectoryEntry[]) : [];
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }, []);

  const writeDirectoryEntries = useCallback(async (entries: UserDirectoryEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.directory, JSON.stringify(entries));
    } catch (error) {
      console.error('Error writing directory:', error);
    }
  }, []);

  const upsertDirectoryEntry = useCallback(async (profile: UserProfile, overrides?: Partial<UserDirectoryEntry>) => {
    const entries = await readDirectoryEntries();
    const now = new Date().toISOString();
    const existingIndex = entries.findIndex(entry => entry.id === profile.id || entry.email === profile.email);
    let updatedEntry: UserDirectoryEntry;

    if (existingIndex >= 0) {
      updatedEntry = {
        ...entries[existingIndex],
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        updatedAt: now,
        ...overrides,
      };
      entries[existingIndex] = updatedEntry;
    } else {
      updatedEntry = {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        createdAt: profile.registeredAt,
        updatedAt: now,
        isActive: true,
        ...overrides,
      };
      entries.push(updatedEntry);
    }

    await writeDirectoryEntries(entries);
    return updatedEntry;
  }, [readDirectoryEntries, writeDirectoryEntries]);

  const persistPendingVerification = useCallback(async (value: DomainVerificationState | null) => {
    if (value) {
      await AsyncStorage.setItem(STORAGE_KEYS.pendingVerification, JSON.stringify(value));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.pendingVerification);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      console.log('UserContext: loading cached data');
      const [storedLoggedIn, storedProfile, storedEnrollments, storedPending] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.isLoggedIn),
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.enrollments),
        AsyncStorage.getItem(STORAGE_KEYS.pendingVerification),
      ]);

      if (storedLoggedIn === 'true' && storedProfile) {
        setIsLoggedIn(true);
        setUserProfile(JSON.parse(storedProfile));
      }
      if (storedEnrollments) {
        setEnrollments(JSON.parse(storedEnrollments));
      }
      if (storedPending) {
        setPendingVerification(JSON.parse(storedPending));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  const completeRegistration = useCallback(async (fullName: string, email: string, phone: string) => {
    const userId = Date.now().toString();
    const profile: UserProfile = {
      id: userId,
      fullName,
      email,
      phone,
      registeredAt: new Date().toISOString(),
    };

    setUserProfile(profile);
    setIsLoggedIn(true);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true'),
      saveUserData(STORAGE_KEYS.user, profile),
      upsertDirectoryEntry(profile),
    ]);

    console.log('User registered:', profile);
    return profile;
  }, [saveUserData, upsertDirectoryEntry]);

  const clearPendingVerification = useCallback(async () => {
    setPendingVerification(null);
    await persistPendingVerification(null);
  }, [persistPendingVerification]);

  const register = useCallback(async (fullName: string, email: string, phone: string) => {
    return completeRegistration(fullName, email, phone);
  }, [completeRegistration]);

  const requestDomainVerification = useCallback(async (email: string, fullName?: string, phone?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith(DOMAIN_SUFFIX)) {
      return { success: false, error: `Используйте корпоративный email ${DOMAIN_SUFFIX}` };
    }

    const code = generateVerificationCode();
    const pending: DomainVerificationState = {
      email: normalizedEmail,
      code,
      expiresAt: Date.now() + CODE_TTL,
      fullName,
      phone,
    };

    const result = await sendDomainVerificationCode(normalizedEmail, code);
    if (!result.success) {
      return { success: false, error: result.error ?? 'Не удалось отправить код' };
    }

    setPendingVerification(pending);
    await persistPendingVerification(pending);
    return { success: true };
  }, [persistPendingVerification]);

  const verifyDomainRegistration = useCallback(async (
    code: string,
    profileOverrides?: { fullName?: string; phone?: string }
  ) => {
    if (!pendingVerification) {
      return { success: false, error: 'Код не запрашивался' };
    }

    if (Date.now() > pendingVerification.expiresAt) {
      await clearPendingVerification();
      return { success: false, error: 'Срок действия кода истек' };
    }

    const normalizedCode = code.trim().toUpperCase();
    if (pendingVerification.code.toUpperCase() !== normalizedCode) {
      return { success: false, error: 'Неверный код подтверждения' };
    }

    const finalFullName = profileOverrides?.fullName ?? pendingVerification.fullName;
    const finalPhone = profileOverrides?.phone ?? pendingVerification.phone;

    if (!finalFullName || !finalPhone) {
      return { success: false, error: 'Укажите ФИО и телефон перед подтверждением' };
    }

    await completeRegistration(finalFullName, pendingVerification.email, finalPhone);
    await clearPendingVerification();
    return { success: true };
  }, [clearPendingVerification, completeRegistration, pendingVerification]);

  const login = useCallback(async (email: string) => {
    const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.user);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile) as UserProfile;
      if (profile.email === email) {
        setUserProfile(profile);
        setIsLoggedIn(true);
        await AsyncStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true');
        await upsertDirectoryEntry(profile, { lastLoginAt: new Date().toISOString() });
        console.log('User logged in:', profile);
        return profile;
      }
    }
    return null;
  }, [upsertDirectoryEntry]);

  const logout = useCallback(async () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    await AsyncStorage.setItem(STORAGE_KEYS.isLoggedIn, 'false');
    console.log('User logged out');
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Omit<UserProfile, 'id' | 'registeredAt'>>) => {
    if (!userProfile) return;

    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    await Promise.all([
      saveUserData(STORAGE_KEYS.user, updatedProfile),
      upsertDirectoryEntry(updatedProfile),
    ]);
    console.log('Profile updated:', updatedProfile);
  }, [saveUserData, upsertDirectoryEntry, userProfile]);

  const addEnrollment = useCallback(async (
    courseId: string,
    courseName: string,
    courseDate: string
  ) => {
    if (!userProfile) return null;

    const enrollment: CourseEnrollment = {
      id: Date.now().toString(),
      userId: userProfile.id,
      courseId,
      courseName,
      courseDate,
      enrolledAt: new Date().toISOString(),
      status: 'registered',
    };

    setEnrollments(prev => {
      const updated = [...prev, enrollment];
      void saveUserData(STORAGE_KEYS.enrollments, updated);
      return updated;
    });

    console.log('Enrollment added:', enrollment);
    return enrollment;
  }, [saveUserData, userProfile]);

  const updateEnrollmentStatus = useCallback(async (
    enrollmentId: string,
    status: CourseEnrollment['status'],
    result?: 'passed' | 'failed',
    notes?: string
  ) => {
    setEnrollments(prev => {
      const updated = prev.map(e =>
        e.id === enrollmentId
          ? { ...e, status, result, notes }
          : e
      );
      void saveUserData(STORAGE_KEYS.enrollments, updated);
      return updated;
    });
    console.log('Enrollment updated:', enrollmentId, status, result);
  }, [saveUserData]);

  const getEnrollmentsByStatus = useCallback((status: CourseEnrollment['status']) => {
    return enrollments.filter(e => e.status === status);
  }, [enrollments]);

  const getCompletedEnrollments = useCallback(() => {
    return enrollments.filter(e => e.status === 'completed');
  }, [enrollments]);

  return {
    isLoggedIn,
    isLoading,
    userProfile,
    enrollments,
    pendingVerification,
    register,
    login,
    logout,
    updateProfile,
    addEnrollment,
    updateEnrollmentStatus,
    getEnrollmentsByStatus,
    getCompletedEnrollments,
    requestDomainVerification,
    verifyDomainRegistration,
  };
};

export const [UserProvider, useUser] = createContextHook(useUserProviderValue);
