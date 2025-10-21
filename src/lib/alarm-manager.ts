import { Task, Settings } from './types';

export interface AlarmSound {
  id: string;
  name: string;
  filename: string;
}

export const ALARM_SOUNDS: AlarmSound[] = [
  { id: 'alarm-1', name: 'funny Alarm', filename: 'funny-alarm.mp3' },
  { id: 'alarm-2', name: 'Gentle Chime', filename: 'alarm-2.mp3' },
  { id: 'alarm-3', name: 'Digital Beep', filename: 'alarm-3.mp3' },
  { id: 'alarm-4', name: 'Nature Sounds', filename: 'alarm-4.mp3' },
  { id: 'alarm-5', name: 'Soft Melody', filename: 'alarm-5.mp3' },
  { id: 'default', name: 'Default Sound', filename: 'default.mp3' },
];

export class AlarmManager {
  private static instance: AlarmManager;
  private audioContext: AudioContext | null = null;
  private scheduledAlarms: Map<string, number> = new Map();
  private currentAlarm: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static getInstance(): AlarmManager {
    if (!AlarmManager.instance) {
      AlarmManager.instance = new AlarmManager();
    }
    return AlarmManager.instance;
  }

  /**
   * Schedule alarms for all enabled tasks
   */
  public scheduleAlarms(tasks: Task[], settings: Settings): void {
    this.clearAllAlarms();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    tasks.forEach(task => {
      if (!task.enabled || !task.alarmEnabled) return;
      
      this.scheduleTaskAlarm(task, today, settings);
    });
  }

  /**
   * Schedule alarm for a specific task
   */
  private scheduleTaskAlarm(task: Task, baseDate: Date, settings: Settings): void {
    const [hours, minutes] = task.time.split(':').map(Number);
    const alarmDate = new Date(baseDate);
    alarmDate.setHours(hours, minutes, 0, 0);

    // If the alarm time has passed today, schedule for tomorrow
    if (alarmDate <= new Date()) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }

    const timeoutId = window.setTimeout(() => {
      this.triggerAlarm(task, settings);
    }, alarmDate.getTime() - Date.now());

    this.scheduledAlarms.set(task.id, timeoutId);
  }

  /**
   * Trigger alarm for a task
   */
  private async triggerAlarm(task: Task, settings: Settings): Promise<void> {
    try {
      // Request notification permission if not granted
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(`Time for: ${task.title}`, {
          body: task.notes || 'Your scheduled task is due now',
          icon: '/icon-192.png',
          tag: task.id,
          requireInteraction: true,
        });
      }

      // Play alarm sound
      await this.playAlarmSound(task.alarmSound, settings.alarmVolume);

      // Schedule next occurrence if task is recurring
      this.scheduleNextOccurrence(task, settings);

    } catch (error) {
      console.error('Error triggering alarm:', error);
    }
  }

  /**
   * Play alarm sound
   */
  private async playAlarmSound(soundId: string, volume: number = 1): Promise<void> {
    try {
      const sound = ALARM_SOUNDS.find(s => s.id === soundId) || ALARM_SOUNDS[0];
      const audio = new Audio(`/sounds/${sound.filename}`);
      
      // Fallback to default notification sound if custom sound fails
      audio.onerror = () => {
        console.warn(`Failed to load sound: ${sound.filename}, using default notification`);
        // Browser will use default notification sound
        if (this.audioContext) {
          this.playDefaultBeep(volume);
        }
      };

      audio.volume = Math.max(0, Math.min(1, volume));
      audio.loop = true;
      
      // Stop current alarm if playing
      if (this.currentAlarm) {
        this.currentAlarm.pause();
        this.currentAlarm.currentTime = 0;
        this.currentAlarm = null;
      }
      
      this.currentAlarm = audio;
      await audio.play();

      // Stop alarm after 30 seconds to prevent infinite looping
      setTimeout(() => {
        if (this.currentAlarm === audio) {
          audio.pause();
          audio.currentTime = 0;
          this.currentAlarm = null;
        }
      }, 30000);

    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Fallback to default beep
      if (this.audioContext) {
        this.playDefaultBeep(volume);
      }
    }
  }

  /**
   * Play default beep sound using Web Audio API
   */
  private playDefaultBeep(volume: number = 1): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  /**
   * Schedule next occurrence for recurring tasks
   */
  private scheduleNextOccurrence(task: Task, settings: Settings): void {
    if (task.recurrence === 'one-time') return;

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    this.scheduleTaskAlarm(task, tomorrow, settings);
  }

  /**
   * Stop current alarm
   */
  public stopCurrentAlarm(): void {
    if (this.currentAlarm) {
      this.currentAlarm.pause();
      this.currentAlarm.currentTime = 0;
      this.currentAlarm = null;
    }
  }

  /**
   * Clear all scheduled alarms
   */
  public clearAllAlarms(): void {
    this.scheduledAlarms.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.scheduledAlarms.clear();
  }

  /**
   * Clear alarm for specific task
   */
  public clearTaskAlarm(taskId: string): void {
    const timeoutId = this.scheduledAlarms.get(taskId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledAlarms.delete(taskId);
    }
  }

  /**
   * Get available alarm sounds
   */
  public static getAvailableSounds(): AlarmSound[] {
    return ALARM_SOUNDS;
  }

  /**
   * Test alarm sound
   */
  public async testAlarmSound(soundId: string, volume: number = 0.5): Promise<void> {
    try {
      const sound = ALARM_SOUNDS.find(s => s.id === soundId) || ALARM_SOUNDS[0];
      const audio = new Audio(`/sounds/${sound.filename}`);
      
      // Fallback to default notification sound if custom sound fails
      audio.onerror = () => {
        console.warn(`Failed to load sound: ${sound.filename}, using default notification`);
        if (this.audioContext) {
          this.playDefaultBeep(volume);
        }
      };

      audio.volume = Math.max(0, Math.min(1, volume));
      audio.loop = false; // Don't loop for test sounds
      
      // Stop current alarm if playing
      if (this.currentAlarm) {
        this.currentAlarm.pause();
        this.currentAlarm.currentTime = 0;
      }
      
      this.currentAlarm = audio;
      await audio.play();

      // Stop alarm after 5 seconds for test sounds
      setTimeout(() => {
        if (this.currentAlarm === audio) {
          audio.pause();
          audio.currentTime = 0;
          this.currentAlarm = null;
        }
      }, 5000);

    } catch (error) {
      console.error('Error playing test alarm sound:', error);
      // Fallback to default beep
      if (this.audioContext) {
        this.playDefaultBeep(volume);
      }
    }
  }
}
