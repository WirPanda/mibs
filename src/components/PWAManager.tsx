"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Download, Trash2 } from "lucide-react";

export const PWAManager = () => {
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Получаем регистрацию Service Worker
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        checkCacheSize();
      });

      // Слушаем сообщения от Service Worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // Проверяем обновления Service Worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        toast.success("🎉 Приложение обновлено!", {
          description: "Перезагрузите страницу для применения изменений"
        });
      });
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data?.type === 'UPDATE_AVAILABLE') {
      setUpdateAvailable(true);
      toast.info("📦 Доступно обновление", {
        description: "Нажмите для обновления приложения",
        action: {
          label: "Обновить",
          onClick: () => updateServiceWorker()
        },
        duration: Infinity
      });
    }
  };

  const checkCacheSize = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data?.size !== undefined) {
          setCacheSize(event.data.size);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    }
  };

  const updateServiceWorker = async () => {
    if (registration) {
      const newWorker = registration.waiting || registration.installing;
      
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      } else {
        // Проверяем на обновления
        await registration.update();
        toast.success("✅ Приложение обновлено!");
      }
      
      setUpdateAvailable(false);
    }
  };

  const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data?.success) {
          toast.success("🗑️ Кеш очищен!", {
            description: "Приложение будет перезагружено"
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    }
  };

  const updateCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data?.success) {
          toast.success("✅ Кеш обновлен!");
          checkCacheSize();
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'UPDATE_CACHE' },
        [messageChannel.port2]
      );
    }
  };

  // Компонент не отображается, но работает в фоне
  // Можно добавить UI для отладки (показывать только админам)
  return null;
};

// Экспортируем хук для использования в других компонентах
export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Проверяем, установлено ли приложение
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standalone);

    // Проверяем состояние сети
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isInstalled,
    isOnline,
    canInstall: !isInstalled && 'serviceWorker' in navigator
  };
};
