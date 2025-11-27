import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Course } from '@/constants/courses';
import type { Registration } from '@/contexts/AdminContext';
import type { UserDirectoryEntry } from '@/types/userDirectory';

const SNAPSHOT_ENDPOINT = '/snapshot';
const DEFAULT_POLL_INTERVAL = 10000;
const STORAGE_KEY = 'admin_server_url';

let cachedServerUrl: string | null | undefined = undefined;

async function getSyncBaseUrl(): Promise<string | null> {
  if (cachedServerUrl !== undefined) {
    return cachedServerUrl;
  }
  
  const envUrl = process.env.EXPO_PUBLIC_SYNC_BASE_URL;
  if (envUrl) {
    cachedServerUrl = envUrl;
    return envUrl;
  }
  
  try {
    const storedUrl = await AsyncStorage.getItem(STORAGE_KEY);
    cachedServerUrl = storedUrl || null;
    return cachedServerUrl;
  } catch (error) {
    console.error('Failed to load server URL from storage:', error);
    cachedServerUrl = null;
    return null;
  }
}

export function clearServerUrlCache() {
  cachedServerUrl = undefined;
}

export interface RemoteSnapshot {
  courses: Course[];
  registrations: Registration[];
  dates: string[];
  users?: UserDirectoryEntry[];
  updatedAt: string;
}

export interface RemoteMutationPayload {
  courses?: Course[];
  registrations?: Registration[];
  dates?: string[];
  users?: UserDirectoryEntry[];
  updatedAt?: string;
  reason?: string;
  source?: 'admin' | 'user';
}

async function getEndpoint(path: string): Promise<string | null> {
  const baseUrl = await getSyncBaseUrl();
  if (!baseUrl) {
    return null;
  }
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  const endpoint = await getEndpoint(path);
  if (!endpoint) {
    return null;
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...init,
    });

    if (!response.ok) {
      console.error('Remote sync: Request failed', response.status, await response.text());
      return null;
    }

    if (response.status === 204) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('Remote sync error:', error);
    return null;
  }
}

export async function isRemoteSyncEnabled(): Promise<boolean> {
  const baseUrl = await getSyncBaseUrl();
  return Boolean(baseUrl);
}

export async function fetchRemoteSnapshot(): Promise<RemoteSnapshot | null> {
  return request<RemoteSnapshot>(SNAPSHOT_ENDPOINT);
}

export async function pushRemoteMutation(payload: RemoteMutationPayload): Promise<boolean> {
  const endpoint = await getEndpoint(SNAPSHOT_ENDPOINT);
  if (!endpoint) {
    return false;
  }

  try {
    const body = JSON.stringify({
      ...payload,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      console.error('Remote sync mutation failed', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Remote sync mutation error:', error);
    return false;
  }
}

export function createRemoteSnapshotPoller(
  onSnapshot: (snapshot: RemoteSnapshot) => void,
  interval = DEFAULT_POLL_INTERVAL,
) {
  let stopPollingCallback: (() => void) | null = null;
  
  const initializePoller = async () => {
    const enabled = await isRemoteSyncEnabled();
    if (!enabled) {
      return;
    }

    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (!isActive) {
        return;
      }

      const snapshot = await fetchRemoteSnapshot();
      if (snapshot) {
        onSnapshot(snapshot);
      }

      if (!isActive) {
        return;
      }

      timeoutId = setTimeout(poll, interval);
    };

    poll();

    stopPollingCallback = () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  };
  
  initializePoller();
  
  return () => {
    if (stopPollingCallback) {
      stopPollingCallback();
    }
  };
}

export async function getSyncStatusMessage(): Promise<string> {
  const enabled = await isRemoteSyncEnabled();
  if (!enabled) {
    return 'Локальный режим хранения данных (без онлайн-синхронизации)';
  }
  return 'Онлайн-синхронизация активна';
}
