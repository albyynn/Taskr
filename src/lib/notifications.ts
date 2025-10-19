import { Task } from './types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const scheduleNotification = (task: Task): void => {
  if (!task.enabled || Notification.permission !== 'granted') return;

  const now = new Date();
  const [hours, minutes] = task.time.split(':').map(Number);
  
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow (for daily tasks)
  if (scheduledTime <= now && task.recurrence === 'daily') {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  if (timeUntilNotification > 0) {
    setTimeout(() => {
      if (task.enabled && !task.completed) {
        showNotification(task);
      }
    }, timeUntilNotification);
  }
};

export const showNotification = (task: Task): void => {
  if (Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body: `Time for: ${task.title}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: task.id,
    requireInteraction: true,
    vibrate: task.vibration ? [200, 100, 200] : undefined,
    actions: [
      { action: 'complete', title: 'Mark Complete' },
      { action: 'snooze', title: 'Snooze 5 min' },
    ],
  };

  if (task.notificationSound) {
    options.silent = false;
  }

  try {
    const notification = new Notification(`Reminder: ${task.title}`, options);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

export const scheduleAllNotifications = (tasks: Task[]): void => {
  tasks.forEach(task => {
    if (task.enabled && !task.completed) {
      scheduleNotification(task);
    }
  });
};