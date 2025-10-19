const CACHE_NAME = 'daily-reminder-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === event.notification.data?.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open app if not already open
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data?.url || '/');
        }
      })
  );
});

// Periodic notification check - this runs in the background
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_NOTIFICATIONS') {
    const tasks = event.data.tasks;
    const now = new Date();
    
    tasks.forEach((task) => {
      if (!task.enabled || task.completed) return;

      const [hours, minutes] = task.time.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      const timeDiff = now.getTime() - scheduledTime.getTime();
      
      // If within 1 minute of scheduled time and not already notified
      if (timeDiff >= 0 && timeDiff < 60000) {
        showTaskNotification(task);
      }
    });
  }
});

// Function to show notification from service worker
async function showTaskNotification(task) {
  try {
    const options = {
      body: `Time for: ${task.title}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: task.id,
      requireInteraction: true,
      vibrate: task.vibration ? [200, 100, 200, 100, 200] : undefined,
      silent: !task.notificationSound,
      data: {
        taskId: task.id,
        url: self.registration.scope,
      },
      actions: [
        { action: 'complete', title: '✓ Complete' },
        { action: 'snooze', title: '💤 Snooze 5min' },
      ],
    };

    await self.registration.showNotification(`⏰ ${task.title}`, options);
    console.log('Service worker showed notification for:', task.title);
  } catch (error) {
    console.error('Error showing notification from SW:', error);
  }
}