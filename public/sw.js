const CACHE_NAME = 'daily-reminder-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/sounds/funny-alarm.mp3'
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

// Push event - handle background push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Your reminder is due now',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.taskId || 'reminder',
      requireInteraction: true,
      vibrate: data.vibrate ? [200, 100, 200, 100, 200] : undefined,
      silent: !data.sound,
      data: {
        taskId: data.taskId,
        url: self.registration.scope,
        sound: data.sound,
        soundId: data.soundId
      },
      actions: [
        { action: 'complete', title: '✓ Complete' },
        { action: 'snooze', title: '💤 Snooze 5min' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '⏰ Reminder', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Handle action buttons
  if (event.action === 'complete') {
    // Send message to client to mark task as complete
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === event.notification.data?.url) {
              client.postMessage({
                type: 'TASK_COMPLETE',
                taskId: event.notification.data?.taskId
              });
              return client.focus();
            }
          }
          // Open app if not already open
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data?.url || '/');
          }
        })
    );
  } else if (event.action === 'snooze') {
    // Send message to client to snooze task
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === event.notification.data?.url) {
              client.postMessage({
                type: 'TASK_SNOOZE',
                taskId: event.notification.data?.taskId,
                minutes: 5
              });
              return client.focus();
            }
          }
          // Open app if not already open
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data?.url || '/');
          }
        })
    );
  } else {
    // Default click behavior - open/focus app
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
  }
});

// Background alarm scheduling
let alarmTimeouts = new Map();

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_ALARMS') {
    const { tasks, settings } = event.data;
    scheduleBackgroundAlarms(tasks, settings);
  } else if (event.data && event.data.type === 'CLEAR_ALARMS') {
    clearAllBackgroundAlarms();
  } else if (event.data && event.data.type === 'CHECK_NOTIFICATIONS') {
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

// Schedule background alarms
function scheduleBackgroundAlarms(tasks, settings) {
  // Clear existing alarms
  clearAllBackgroundAlarms();
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  tasks.forEach(task => {
    if (!task.enabled || !task.alarmEnabled) return;
    
    const [hours, minutes] = task.time.split(':').map(Number);
    const alarmDate = new Date(today);
    alarmDate.setHours(hours, minutes, 0, 0);

    // If the alarm time has passed today, schedule for tomorrow
    if (alarmDate <= now) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }

    const timeUntilAlarm = alarmDate.getTime() - now.getTime();
    
    if (timeUntilAlarm > 0) {
      const timeoutId = setTimeout(() => {
        triggerBackgroundAlarm(task, settings);
      }, timeUntilAlarm);
      
      alarmTimeouts.set(task.id, timeoutId);
      console.log(`Background alarm scheduled for task "${task.title}" in ${Math.round(timeUntilAlarm / 1000 / 60)} minutes`);
    }
  });
}

// Clear all background alarms
function clearAllBackgroundAlarms() {
  alarmTimeouts.forEach(timeoutId => {
    clearTimeout(timeoutId);
  });
  alarmTimeouts.clear();
}

// Trigger background alarm
async function triggerBackgroundAlarm(task, settings) {
  try {
    // Show notification with sound
    await showTaskNotification(task, settings);
    
    // Schedule next occurrence if task is recurring
    if (task.recurrence !== 'one-time') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      scheduleTaskAlarmForDate(task, tomorrow, settings);
    }
  } catch (error) {
    console.error('Error triggering background alarm:', error);
  }
}

// Schedule alarm for specific date
function scheduleTaskAlarmForDate(task, baseDate, settings) {
  const [hours, minutes] = task.time.split(':').map(Number);
  const alarmDate = new Date(baseDate);
  alarmDate.setHours(hours, minutes, 0, 0);

  const timeUntilAlarm = alarmDate.getTime() - Date.now();
  
  if (timeUntilAlarm > 0) {
    const timeoutId = setTimeout(() => {
      triggerBackgroundAlarm(task, settings);
    }, timeUntilAlarm);
    
    alarmTimeouts.set(task.id, timeoutId);
  }
}

// Function to show notification from service worker
async function showTaskNotification(task, settings = {}) {
  try {
    const options = {
      body: task.notes || `Time for: ${task.title}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: task.id,
      requireInteraction: true,
      vibrate: task.vibration ? [200, 100, 200, 100, 200] : undefined,
      silent: !task.notificationSound,
      data: {
        taskId: task.id,
        url: self.registration.scope,
        sound: task.notificationSound,
        soundId: task.alarmSound,
        vibrate: task.vibration
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