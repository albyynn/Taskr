import { Capacitor } from '@capacitor/core';
import { Task, Settings } from './types';

// Dynamic imports to avoid SSR issues
let LocalNotifications: any = null;

if (typeof window !== 'undefined') {
  import('@capacitor/local-notifications').then(module => {
    LocalNotifications = module.LocalNotifications;
  });
}

export class NativeNotificationManager {
  private static instance: NativeNotificationManager;
  private scheduledNotifications: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): NativeNotificationManager {
    if (!NativeNotificationManager.instance) {
      NativeNotificationManager.instance = new NativeNotificationManager();
    }
    return NativeNotificationManager.instance;
  }

  /**
   * Request notification permissions
   */
  public async requestPermissions(): Promise<boolean> {
    if (!LocalNotifications || !Capacitor.isNativePlatform()) {
      // Fallback to web notifications for PWA
      return this.requestWebPermissions();
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  public async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return 'Notification' in window && Notification.permission === 'granted';
    }

    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule notifications for all enabled tasks
   */
  public async scheduleNotifications(tasks: Task[], settings: Settings): Promise<void> {
    await this.clearAllNotifications();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const task of tasks) {
      if (!task.enabled || !task.alarmEnabled) continue;
      
      await this.scheduleTaskNotification(task, today, settings);
    }
  }

  /**
   * Schedule notification for a specific task
   */
  private async scheduleTaskNotification(task: Task, baseDate: Date, settings: Settings): Promise<void> {
    const [hours, minutes] = task.time.split(':').map(Number);
    const alarmDate = new Date(baseDate);
    alarmDate.setHours(hours, minutes, 0, 0);

    // If the alarm time has passed today, schedule for tomorrow
    if (alarmDate <= new Date()) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }

    const notificationId = parseInt(task.id) || Math.floor(Math.random() * 1000000);
    
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `⏰ ${task.title}`,
            body: task.notes || `Time for: ${task.title}`,
            id: notificationId,
            schedule: { at: alarmDate },
            sound: task.alarmSound || 'default',
            attachments: undefined,
            actionTypeId: 'TASK_REMINDER',
            extra: {
              taskId: task.id,
              taskTitle: task.title,
              taskNotes: task.notes,
              alarmSound: task.alarmSound,
              vibrate: task.vibration,
            },
          },
        ],
      });

      this.scheduledNotifications.set(task.id, notificationId);
      console.log(`Native notification scheduled for task "${task.title}" at ${alarmDate.toLocaleString()}`);
    } catch (error) {
      console.error(`Error scheduling notification for task "${task.title}":`, error);
    }
  }

  /**
   * Clear all scheduled notifications
   */
  public async clearAllNotifications(): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: Array.from(this.scheduledNotifications.values()).map(id => ({ id }))
      });
      this.scheduledNotifications.clear();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Clear notification for specific task
   */
  public async clearTaskNotification(taskId: string): Promise<void> {
    const notificationId = this.scheduledNotifications.get(taskId);
    if (notificationId) {
      try {
        await LocalNotifications.cancel({
          notifications: [{ id: notificationId }]
        });
        this.scheduledNotifications.delete(taskId);
      } catch (error) {
        console.error(`Error clearing notification for task ${taskId}:`, error);
      }
    }
  }

  /**
   * Test notification (for testing purposes)
   */
  public async testNotification(): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🔔 Test Notification',
            body: 'This is a test notification from Daily Reminder',
            id: 999999,
            schedule: { at: new Date(Date.now() + 2000) }, // 2 seconds from now
            sound: 'default',
            extra: {
              test: true,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  /**
   * Handle notification actions
   */
  public async handleNotificationAction(action: string, taskId: string): Promise<void> {
    switch (action) {
      case 'complete':
        // Mark task as complete
        console.log(`Task ${taskId} marked as complete from notification`);
        break;
      case 'snooze':
        // Snooze task for 5 minutes
        console.log(`Task ${taskId} snoozed for 5 minutes from notification`);
        break;
    }
  }

  /**
   * Fallback to web notifications for PWA
   */
  private async requestWebPermissions(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting web notification permission:', error);
      return false;
    }
  }
}
