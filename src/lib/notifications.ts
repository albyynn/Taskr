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
    return true;
  }

  if (Notification.permission === 'denied') {
    console.error('Notification permission was previously denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  return 'Notification' in window && Notification.permission === 'granted';
};

export const scheduleNotification = async (task: Task): Promise<void> => {
  if (!task.enabled) return;

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  try {
    const now = new Date();
    const [hours, minutes] = task.time.split(':').map(Number);
    
    let scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();
    
    if (timeUntilNotification > 0) {
      setTimeout(async () => {
        await showWebNotification(task);
      }, timeUntilNotification);

      console.log(`Notification scheduled for task "${task.title}" in ${Math.round(timeUntilNotification / 1000 / 60)} minutes`);
    }
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

const showWebNotification = async (task: Task): Promise<void> => {
  try {
    // Vibrate device if enabled
    if (task.vibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Play sound if enabled
    if (task.notificationSound) {
      playNotificationSound();
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(`⏰ ${task.title}`, {
        body: `Time for: ${task.title}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: task.id,
        requireInteraction: true,
        vibrate: task.vibration ? [200, 100, 200, 100, 200] : undefined,
        silent: !task.notificationSound,
        data: { taskId: task.id, url: window.location.origin },
      });
    } else {
      new Notification(`⏰ ${task.title}`, {
        body: `Time for: ${task.title}`,
        icon: '/icon-192.png',
        tag: task.id,
        requireInteraction: true,
      });
    }

    console.log(`Notification shown for task: ${task.title}`);
  } catch (error) {
    console.error('Error showing web notification:', error);
  }
};

export const vibrateDevice = async (pattern?: number[]): Promise<void> => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern || [200, 100, 200, 100, 200, 100, 400]);
  }
};

export const playNotificationSound = (): void => {
  try {
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
    console.error('Error playing sound:', error);
  }
};

export const scheduleAllNotifications = async (tasks: Task[]): Promise<void> => {
  // Schedule new notifications
  for (const task of tasks) {
    if (task.enabled && !task.completed) {
      await scheduleNotification(task);
    }
  }
};

export const cancelNotification = async (taskId: string): Promise<void> => {
  // Web notifications are cleared automatically
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
      await showWebNotification(task);
    }
  }
};
