import { useState, useEffect } from 'react';

interface OfflineData {
  registrations: any[];
  timestamp: number;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingData, setPendingData] = useState<any[]>([]);

  useEffect(() => {
    // Проверяем состояние сети
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      await syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Загружаем сохраненные данные
    loadPendingData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingData = () => {
    try {
      const stored = localStorage.getItem('offline-pending-data');
      if (stored) {
        const data = JSON.parse(stored);
        setPendingData(data.registrations || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки офлайн данных:', error);
    }
  };

  const saveForLater = (data: any) => {
    try {
      const stored = localStorage.getItem('offline-pending-data');
      const existing: OfflineData = stored 
        ? JSON.parse(stored) 
        : { registrations: [], timestamp: Date.now() };

      existing.registrations.push({
        ...data,
        savedAt: Date.now()
      });

      localStorage.setItem('offline-pending-data', JSON.stringify(existing));
      setPendingData(existing.registrations);

      // Регистрируем Background Sync
      if ('serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)) {
        navigator.serviceWorker.ready.then((registration: any) => {
          return registration.sync.register('sync-offline-data');
        });
      }

      return true;
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
      return false;
    }
  };

  const syncPendingData = async () => {
    if (pendingData.length === 0) return;

    try {
      const token = localStorage.getItem("bearer_token");
      
      for (const item of pendingData) {
        await fetch('/api/registrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item)
        });
      }

      // Очищаем после успешной синхронизации
      localStorage.removeItem('offline-pending-data');
      setPendingData([]);

      return true;
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      return false;
    }
  };

  const clearPendingData = () => {
    localStorage.removeItem('offline-pending-data');
    setPendingData([]);
  };

  return {
    isOnline,
    pendingData,
    hasPendingData: pendingData.length > 0,
    saveForLater,
    syncPendingData,
    clearPendingData
  };
};
