import { Task, Settings } from './types';

const TASKS_KEY = 'daily-reminder-tasks';
const SETTINGS_KEY = 'daily-reminder-settings';
const LAST_RESET_KEY = 'daily-reminder-last-reset';

export const storage = {
  getTasks: (): Task[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading tasks:', error);
      return [];
    }
  },

  saveTasks: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  },

  getSettings: (): Settings => {
    if (typeof window === 'undefined') {
      return {
        notificationsEnabled: true,
        defaultSound: true,
        defaultVibration: true,
        darkMode: false,
        snoozeMinutes: 5,
      };
    }
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        notificationsEnabled: true,
        defaultSound: true,
        defaultVibration: true,
        darkMode: false,
        snoozeMinutes: 5,
      };
    } catch (error) {
      console.error('Error reading settings:', error);
      return {
        notificationsEnabled: true,
        defaultSound: true,
        defaultVibration: true,
        darkMode: false,
        snoozeMinutes: 5,
      };
    }
  },

  saveSettings: (settings: Settings): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  getLastReset: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_RESET_KEY);
  },

  setLastReset: (date: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_RESET_KEY, date);
  },
};