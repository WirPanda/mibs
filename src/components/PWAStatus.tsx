"use client";

import { useEffect, useState } from "react";
import { Download, HardDrive } from "lucide-react";

export const PWAStatus = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);

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

    // Получаем размер кеша
    getCacheSize();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getCacheSize = async () => {
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

  // Показываем только когда офлайн
  if (isOnline) return null;

  return (
    <div className="fixed left-4 top-1/2 translate-y-4 z-50 flex flex-col gap-2">
      {/* Статус установки */}
      {isInstalled && (
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md bg-blue-500/90 text-white text-xs font-medium hover:bg-blue-500/95 transition-all animate-in slide-in-from-left"
          title="Приложение установлено"
        >
          <Download className="w-4 h-4" />
          <span>PWA</span>
        </div>
      )}

      {/* Размер кеша */}
      {cacheSize > 0 && (
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md bg-purple-500/90 text-white text-xs font-medium hover:bg-purple-500/95 transition-all cursor-pointer animate-in slide-in-from-left"
          title={`Кеш: ${cacheSize} элементов`}
          onClick={getCacheSize}
        >
          <HardDrive className="w-4 h-4" />
          <span>{cacheSize}</span>
        </div>
      )}
    </div>
  );
};