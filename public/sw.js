/* МИБС PWA Service Worker - Профессиональная версия */
const CACHE_VERSION = 'mibs-v2.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Ресурсы для кеширования при установке
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/registration',
  '/account',
  '/news',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Максимальное количество элементов в кешах
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 30;

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] 🚀 Установка Service Worker v2.0.0...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] 💾 Кеширование статических ресурсов');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] ✅ Статические ресурсы закешированы');
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] ❌ Ошибка кеширования:', error);
    })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] ⚡ Активация Service Worker...');
  
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE)
          .map(key => {
            console.log('[SW] 🗑️ Удаление старого кеша:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] ✅ Старые кеши очищены');
      return self.clients.claim();
    })
  );
});

// Ограничение размера кеша
const limitCacheSize = (cacheName, maxSize) => {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxSize) {
        cache.delete(keys[0]).then(() => limitCacheSize(cacheName, maxSize));
      }
    });
  });
};

// Стратегия Cache First (для статических ресурсов)
const cacheFirst = async (request, cacheName) => {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      limitCacheSize(cacheName, cacheName === IMAGE_CACHE ? MAX_IMAGE_CACHE_SIZE : MAX_DYNAMIC_CACHE_SIZE);
    }
    return response;
  } catch (error) {
    console.error('[SW] ❌ Cache First ошибка:', error);
    throw error;
  }
};

// Стратегия Network First (для динамических данных)
const networkFirst = async (request, cacheName) => {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      limitCacheSize(cacheName, MAX_DYNAMIC_CACHE_SIZE);
    }
    return response;
  } catch (error) {
    console.log('[SW] 📡 Сеть недоступна, используем кеш');
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Если это HTML страница - показываем offline
    if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline');
    }
    
    throw error;
  }
};

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорируем запросы не к нашему домену (кроме изображений)
  if (url.origin !== location.origin && !request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return;
  }

  // Игнорируем API аутентификации (всегда network)
  if (url.pathname.startsWith('/api/auth')) {
    return;
  }

  // Изображения - cache first
  if (request.destination === 'image' || request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // API запросы - network first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Статические ресурсы - cache first
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.url.match(/\.(js|css|woff|woff2|ttf)$/i)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML страницы - network first с fallback
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Остальное - network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Background Sync - синхронизация когда появится соединение
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncRegistrations());
  }
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncRegistrations() {
  try {
    console.log('[SW] 📤 Синхронизация регистраций...');
    
    // Получаем сохраненные регистрации из IndexedDB или кеша
    const pendingData = await getStoredData('pending-registrations');
    
    if (pendingData && pendingData.length > 0) {
      for (const item of pendingData) {
        await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
      
      await clearStoredData('pending-registrations');
      console.log('[SW] ✅ Синхронизация завершена');
      
      // Отправляем уведомление
      await self.registration.showNotification('МИБС', {
        body: 'Ваши данные успешно отправлены!',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] ❌ Ошибка синхронизации:', error);
    return Promise.reject(error);
  }
}

async function syncOfflineData() {
  try {
    console.log('[SW] 🔄 Синхронизация офлайн данных...');
    // Логика для синхронизации других офлайн данных
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] ❌ Ошибка синхронизации:', error);
    return Promise.reject(error);
  }
}

// Вспомогательные функции для работы с данными
async function getStoredData(key) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await cache.match(`/offline-data/${key}`);
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('[SW] Ошибка чтения данных:', error);
  }
  return null;
}

async function clearStoredData(key) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.delete(`/offline-data/${key}`);
  } catch (error) {
    console.error('[SW] Ошибка очистки данных:', error);
  }
}

// Push-уведомления
self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 Push уведомление получено');
  
  let data = {
    title: 'МИБС',
    body: 'Новое уведомление',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'mibs-notification',
    url: '/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      url: data.url
    },
    actions: [
      { action: 'open', title: '📱 Открыть' },
      { action: 'close', title: '❌ Закрыть' }
    ],
    requireInteraction: false,
    silent: false,
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Клик по уведомлению:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Ищем открытое окно
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Закрытие уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 🔕 Уведомление закрыто');
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  console.log('[SW] 💬 Сообщение от клиента:', event.data?.type);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(keys => {
        return Promise.all(keys.map(key => caches.delete(key)));
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
        console.log('[SW] 🗑️ Все кеши очищены');
      })
    );
  }

  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.keys().then(async keys => {
        let totalSize = 0;
        for (const key of keys) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          totalSize += requests.length;
        }
        event.ports[0]?.postMessage({ size: totalSize });
        console.log('[SW] 📊 Размер кеша:', totalSize, 'элементов');
      })
    );
  }

  if (event.data.type === 'UPDATE_CACHE') {
    event.waitUntil(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
        console.log('[SW] ✅ Кеш обновлен');
      })
    );
  }
});

// Периодическая фоновая синхронизация
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] ⏰ Periodic sync:', event.tag);
  
  if (event.tag === 'update-news') {
    event.waitUntil(updateNews());
  }
  
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function updateNews() {
  try {
    console.log('[SW] 📰 Обновление новостей в фоне...');
    
    const response = await fetch('/api/news/published');
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('/api/news/published', response.clone());
      console.log('[SW] ✅ Новости обновлены');
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] ❌ Ошибка обновления новостей:', error);
    return Promise.reject(error);
  }
}

async function checkForUpdates() {
  try {
    console.log('[SW] 🔍 Проверка обновлений...');
    
    const response = await fetch('/api/version');
    if (response && response.status === 200) {
      const data = await response.json();
      
      // Отправляем сообщение клиенту о доступном обновлении
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: data.version
        });
      });
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] ❌ Ошибка проверки обновлений:', error);
    return Promise.reject(error);
  }
}

// Мониторинг состояния сети
self.addEventListener('online', () => {
  console.log('[SW] 🌐 Подключение к интернету восстановлено');
  
  // Отправляем сообщение всем клиентам
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'ONLINE' });
    });
  });
});

self.addEventListener('offline', () => {
  console.log('[SW] 📡 Подключение к интернету потеряно');
  
  // Отправляем сообщение всем клиентам
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'OFFLINE' });
    });
  });
});

console.log('[SW] 🎉 Service Worker загружен успешно! Версия:', CACHE_VERSION);