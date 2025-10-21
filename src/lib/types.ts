export type RecurrenceType = 'daily' | 'weekly' | 'one-time' | 'tomorrow';

export interface Task {
  id: string;
  title: string;
  time: string; // HH:mm format
  recurrence: RecurrenceType;
  weekDays?: number[]; // 0-6 (Sunday-Saturday) for weekly recurrence
  enabled: boolean;
  completed: boolean;
  completedAt?: string; // ISO date string
  notes?: string;
  notificationSound: boolean;
  vibration: boolean;
  alarmSound: string; // Sound file name for alarm
  alarmEnabled: boolean; // Whether alarm should trigger at task time
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  notificationsEnabled: boolean;
  defaultSound: boolean;
  defaultVibration: boolean;
  darkMode: boolean;
  snoozeMinutes: number;
  defaultAlarmSound: string;
  alarmVolume: number; // 0-1
}