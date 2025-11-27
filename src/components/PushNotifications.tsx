"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";

export const PushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Проверяем существующую подписку
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if (typeof window === 'undefined') return;
    
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      } catch (error) {
        console.error('Ошибка проверки подписки:', error);
      }
    }
  };

  const requestPermission = async () => {
    if (typeof window === 'undefined') return;
    
    if (!('Notification' in window)) {
      toast.error("Уведомления не поддерживаются вашим браузером");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success("🔔 Уведомления включены!");
        await subscribeToPush();
      } else if (result === 'denied') {
        toast.error("🔕 Уведомления отклонены");
      }
    } catch (error) {
      console.error('Ошибка запроса разрешения:', error);
      toast.error("Ошибка при включении уведомлений");
    }
  };

  const subscribeToPush = async () => {
    if (typeof window === 'undefined') return;
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Используем публичный VAPID ключ (нужно будет настроить на сервере)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      
      if (!vapidPublicKey) {
        console.warn('VAPID ключ не настроен');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(subscription);

      // Отправляем подписку на сервер
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      console.log('Push подписка создана:', subscription);
    } catch (error) {
      console.error('Ошибка создания подписки:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (typeof window === 'undefined') return;
    
    if (!subscription) {
      return;
    }

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      toast.success("🔕 Уведомления отключены");

      // Удаляем подписку с сервера
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    } catch (error) {
      console.error('Ошибка отписки:', error);
      toast.error("Ошибка при отключении уведомлений");
    }
  };

  // Конвертация VAPID ключа
  const urlBase64ToUint8Array = (base64String: string) => {
    if (typeof window === 'undefined') return new Uint8Array();
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Тестовое уведомление
  const sendTestNotification = () => {
    if (typeof window === 'undefined') return;
    
    if (permission === 'granted') {
      new Notification('МИБС - Тестовое уведомление', {
        body: 'Уведомления работают корректно! 🎉',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification'
      });
    }
  };

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  return (
    <div className="hidden">
      {/* Компонент работает в фоне */}
      {/* При необходимости можно добавить UI для управления уведомлениями */}
    </div>
  );
};

// Экспортируем хук для использования в других компонентах
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if (typeof window === 'undefined') return;
    
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch (error) {
        console.error('Ошибка проверки подписки:', error);
      }
    }
  };

  const requestPermission = async () => {
    if (typeof window === 'undefined') return false;
    
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  };

  return {
    permission,
    isSubscribed,
    canNotify: permission === 'granted',
    requestPermission
  };
};