import { Task } from './types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.error('Notifications not supported in this browser');
    return false;
  }

  // Check if we're in an iframe
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