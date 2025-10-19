import { Task } from './types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.error('Notifications not supported in this browser');
    return false;
  }

  const isInIframe = window.self !== window.top;
  if (isInIframe) {
    console.error('Notification permissions cannot be requested from within an iframe');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.error('Notification permission was previously denied');
    return false;
  }

  try {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const scheduleNotification = async (task: Task): Promise<void> => {
  if (!task.enabled || Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const now = new Date();
    const [hours, minutes] = task.time.split(':').map(Number);
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow (for daily tasks)
    if (scheduledTime <= now && task.recurrence === 'daily') {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    if (timeUntilNotification > 0 && timeUntilNotification < 24 * 60 * 60 * 1000) {
      // Store task data for service worker
      const taskData = {
        id: task.id,
        title: task.title,
        time: task.time,
        scheduledTime: scheduledTime.getTime(),
        vibration: task.vibration,
        notificationSound: task.notificationSound,
      };

      // Store in IndexedDB or localStorage for service worker access
      localStorage.setItem(`notification_${task.id}`, JSON.stringify(taskData));

      // Schedule using setTimeout and also set up service worker check
      setTimeout(async () => {
        const storedTask = localStorage.getItem(`notification_${task.id}`);
        if (storedTask) {
          const parsedTask = JSON.parse(storedTask);
          await showServiceWorkerNotification(parsedTask, registration);
        }
      }, timeUntilNotification);

      console.log(`Scheduled notification for task "${task.title}" in ${Math.round(timeUntilNotification / 1000 / 60)} minutes`);
    }
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

const showServiceWorkerNotification = async (
  taskData: { id: string; title: string; vibration?: boolean; notificationSound?: boolean },
  registration: ServiceWorkerRegistration
): Promise<void> => {
  try {
    const options: NotificationOptions = {
      body: `Time for: ${taskData.title}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: taskData.id,
      requireInteraction: true,
      vibrate: taskData.vibration ? [200, 100, 200, 100, 200] : undefined,
      silent: !taskData.notificationSound,
      data: {
        taskId: taskData.id,
        url: window.location.origin,
      },
    };

    await registration.showNotification(`Reminder: ${taskData.title}`, options);
    
    // Play sound if enabled (fallback for browsers that don't support notification sounds)
    if (taskData.notificationSound) {
      playNotificationSound();
    }

    console.log(`Showed notification for task: ${taskData.title}`);
  } catch (error) {
    console.error('Error showing service worker notification:', error);
  }
};

const playNotificationSound = (): void => {
  try {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export const showNotification = async (task: Task): Promise<void> => {
  if (Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await showServiceWorkerNotification({
      id: task.id,
      title: task.title,
      vibration: task.vibration,
      notificationSound: task.notificationSound,
    }, registration);
  } catch (error) {
    console.error('Error showing notification:', error);
    // Fallback to regular notification
    const options: NotificationOptions = {
      body: `Time for: ${task.title}`,
      icon: '/icon-192.png',
      tag: task.id,
      requireInteraction: true,
      vibrate: task.vibration ? [200, 100, 200, 100, 200] : undefined,
    };
    new Notification(`Reminder: ${task.title}`, options);
  }
};

export const scheduleAllNotifications = async (tasks: Task[]): Promise<void> => {
  for (const task of tasks) {
    if (task.enabled && !task.completed) {
      await scheduleNotification(task);
    }
  }
};

// Check for missed notifications on app startup
export const checkMissedNotifications = async (tasks: Task[]): Promise<void> => {
  const now = new Date();
  
  for (const task of tasks) {
    if (!task.enabled || task.completed) continue;

    const [hours, minutes] = task.time.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the scheduled time was in the last 5 minutes, show notification
    const timeSinceScheduled = now.getTime() - scheduledTime.getTime();
    if (timeSinceScheduled > 0 && timeSinceScheduled < 5 * 60 * 1000) {
      await showNotification(task);
    }
  }
};