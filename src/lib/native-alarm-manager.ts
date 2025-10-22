import { Capacitor } from '@capacitor/core';
import { Task, Settings } from './types';

// Dynamic imports to avoid SSR issues
let Filesystem: any = null;
let Directory: any = null;
let Encoding: any = null;
let LocalNotifications: any = null;

if (typeof window !== 'undefined') {
  import('@capacitor/filesystem').then(module => {
    Filesystem = module.Filesystem;
    Directory = module.Directory;
    Encoding = module.Encoding;
  });
  
  import('@capacitor/local-notifications').then(module => {
    LocalNotifications = module.LocalNotifications;
  });
}

export interface CustomAlarmSound {
  id: string;
  name: string;
  filename: string;
  isCustom: boolean;
  data?: string; // Base64 encoded audio data for custom sounds
}

export class NativeAlarmManager {
  private static instance: NativeAlarmManager;
  private audioContext: AudioContext | null = null;
  private currentAlarm: HTMLAudioElement | null = null;
  private customSounds: Map<string, CustomAlarmSound> = new Map();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static getInstance(): NativeAlarmManager {
    if (!NativeAlarmManager.instance) {
      NativeAlarmManager.instance = new NativeAlarmManager();
    }
    return NativeAlarmManager.instance;
  }

  /**
   * Get available alarm sounds (built-in + custom)
   */
  public getAvailableSounds(): CustomAlarmSound[] {
    const builtInSounds: CustomAlarmSound[] = [
      { id: 'alarm-1', name: 'Funny Alarm', filename: 'funny-alarm.mp3', isCustom: false },
      { id: 'alarm-2', name: 'Gentle Chime', filename: 'alarm-2.mp3', isCustom: false },
      { id: 'alarm-3', name: 'Digital Beep', filename: 'alarm-3.mp3', isCustom: false },
      { id: 'alarm-4', name: 'Nature Sounds', filename: 'alarm-4.mp3', isCustom: false },
      { id: 'alarm-5', name: 'Soft Melody', filename: 'alarm-5.mp3', isCustom: false },
      { id: 'default', name: 'Default Sound', filename: 'default.mp3', isCustom: false },
    ];

    const customSounds = Array.from(this.customSounds.values());
    return [...builtInSounds, ...customSounds];
  }

  /**
   * Upload and store custom alarm sound
   */
  public async uploadCustomSound(file: File): Promise<CustomAlarmSound> {
    if (!Filesystem || !Directory || !Encoding || !Capacitor.isNativePlatform()) {
      // For web, store in IndexedDB
      return this.uploadCustomSoundWeb(file);
    }

    try {
      // Convert file to base64
      const base64Data = await this.fileToBase64(file);
      
      // Generate unique ID and filename
      const soundId = `custom-${Date.now()}`;
      const filename = `${soundId}.mp3`;
      
      // Save to device storage
      await Filesystem.writeFile({
        path: `sounds/${filename}`,
        data: base64Data,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const customSound: CustomAlarmSound = {
        id: soundId,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        filename,
        isCustom: true,
        data: base64Data,
      };

      this.customSounds.set(soundId, customSound);
      await this.saveCustomSounds();
      
      return customSound;
    } catch (error) {
      console.error('Error uploading custom sound:', error);
      throw new Error('Failed to upload custom sound');
    }
  }

  /**
   * Load custom sounds from storage
   */
  public async loadCustomSounds(): Promise<void> {
    if (!Filesystem || !Directory || !Encoding || !Capacitor.isNativePlatform()) {
      return this.loadCustomSoundsWeb();
    }

    try {
      const result = await Filesystem.readFile({
        path: 'custom-sounds.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const customSoundsData = JSON.parse(result.data);
      this.customSounds.clear();
      
      for (const sound of customSoundsData) {
        this.customSounds.set(sound.id, sound);
      }
    } catch (error) {
      console.log('No custom sounds found or error loading:', error);
    }
  }

  /**
   * Save custom sounds to storage
   */
  private async saveCustomSounds(): Promise<void> {
    if (!Filesystem || !Directory || !Encoding || !Capacitor.isNativePlatform()) {
      return this.saveCustomSoundsWeb();
    }

    try {
      const customSoundsData = Array.from(this.customSounds.values());
      await Filesystem.writeFile({
        path: 'custom-sounds.json',
        data: JSON.stringify(customSoundsData),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    } catch (error) {
      console.error('Error saving custom sounds:', error);
    }
  }

  /**
   * Play alarm sound
   */
  public async playAlarmSound(soundId: string, volume: number = 1): Promise<void> {
    try {
      const sound = this.getAvailableSounds().find(s => s.id === soundId);
      if (!sound) {
        console.warn(`Sound ${soundId} not found, using default`);
        return this.playDefaultBeep(volume);
      }

      if (Capacitor.isNativePlatform()) {
        // For native apps, use the notification sound
        await this.playNativeAlarmSound(sound, volume);
      } else {
        // For web, use HTML5 audio
        await this.playWebAlarmSound(sound, volume);
      }
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      this.playDefaultBeep(volume);
    }
  }

  /**
   * Play alarm sound on native platform
   */
  private async playNativeAlarmSound(sound: CustomAlarmSound, volume: number): Promise<void> {
    if (!LocalNotifications) {
      console.warn('LocalNotifications not available, falling back to web audio');
      return this.playWebAlarmSound(sound, volume);
    }

    try {
      // Schedule a notification with sound to play the alarm
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🔔 Alarm',
            body: 'Your reminder is due now',
            id: 888888,
            schedule: { at: new Date(Date.now() + 100) }, // Almost immediately
            sound: sound.filename,
            extra: {
              alarmSound: true,
              volume: volume,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error playing native alarm sound:', error);
      this.playDefaultBeep(volume);
    }
  }

  /**
   * Play alarm sound on web platform
   */
  private async playWebAlarmSound(sound: CustomAlarmSound, volume: number): Promise<void> {
    try {
      let audioSrc: string;
      
      if (sound.isCustom && sound.data) {
        // Use base64 data for custom sounds
        audioSrc = `data:audio/mpeg;base64,${sound.data}`;
      } else {
        // Use file path for built-in sounds
        audioSrc = `/sounds/${sound.filename}`;
      }

      const audio = new Audio(audioSrc);
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
      console.error('Error playing web alarm sound:', error);
      this.playDefaultBeep(volume);
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
   * Test alarm sound
   */
  public async testAlarmSound(soundId: string, volume: number = 0.5): Promise<void> {
    try {
      const sound = this.getAvailableSounds().find(s => s.id === soundId);
      if (!sound) {
        console.warn(`Sound ${soundId} not found, using default`);
        return this.playDefaultBeep(volume);
      }

      if (Capacitor.isNativePlatform()) {
        // For native, play immediately
        await this.playNativeAlarmSound(sound, volume);
      } else {
        // For web, play with shorter duration
        await this.playWebAlarmSound(sound, volume);
        
        // Stop after 5 seconds for test
        setTimeout(() => {
          this.stopCurrentAlarm();
        }, 5000);
      }
    } catch (error) {
      console.error('Error playing test alarm sound:', error);
      this.playDefaultBeep(volume);
    }
  }

  /**
   * Delete custom sound
   */
  public async deleteCustomSound(soundId: string): Promise<void> {
    const sound = this.customSounds.get(soundId);
    if (!sound || !sound.isCustom) return;

    try {
      if (Filesystem && Directory && Capacitor.isNativePlatform()) {
        // Delete file from device storage
        await Filesystem.deleteFile({
          path: `sounds/${sound.filename}`,
          directory: Directory.Data,
        });
      }

      this.customSounds.delete(soundId);
      await this.saveCustomSounds();
    } catch (error) {
      console.error('Error deleting custom sound:', error);
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Web-specific custom sound upload
   */
  private async uploadCustomSoundWeb(file: File): Promise<CustomAlarmSound> {
    const base64Data = await this.fileToBase64(file);
    const soundId = `custom-${Date.now()}`;
    
    const customSound: CustomAlarmSound = {
      id: soundId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      filename: `${soundId}.mp3`,
      isCustom: true,
      data: base64Data,
    };

    this.customSounds.set(soundId, customSound);
    await this.saveCustomSoundsWeb();
    
    return customSound;
  }

  /**
   * Web-specific custom sound loading
   */
  private async loadCustomSoundsWeb(): Promise<void> {
    try {
      const stored = localStorage.getItem('customAlarmSounds');
      if (stored) {
        const customSoundsData = JSON.parse(stored);
        this.customSounds.clear();
        
        for (const sound of customSoundsData) {
          this.customSounds.set(sound.id, sound);
        }
      }
    } catch (error) {
      console.log('No custom sounds found in localStorage:', error);
    }
  }

  /**
   * Web-specific custom sound saving
   */
  private async saveCustomSoundsWeb(): Promise<void> {
    try {
      const customSoundsData = Array.from(this.customSounds.values());
      localStorage.setItem('customAlarmSounds', JSON.stringify(customSoundsData));
    } catch (error) {
      console.error('Error saving custom sounds to localStorage:', error);
    }
  }
}
