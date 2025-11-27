"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Начальное состояние
    setIsOnline(navigator.onLine);

    // Обработчики событий браузера
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Обработчики сообщений от Service Worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ONLINE') {
        handleOnline();
      } else if (event.data?.type === 'OFFLINE') {
        handleOffline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Показываем только когда офлайн
  if (isOnline) return null;

  return (
    <div 
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50 px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-left bg-red-500/90 text-white"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="font-medium text-xs">Нет сети</span>
      </div>
    </div>
  );
};