"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlarmManager } from '@/lib/alarm-manager';
import { NativeAlarmManager } from '@/lib/native-alarm-manager';
import { Volume2, VolumeX, Play } from 'lucide-react';

interface AlarmTestButtonProps {
  soundId: string;
  volume: number;
}

export function AlarmTestButton({ soundId, volume }: AlarmTestButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const alarmManager = AlarmManager.getInstance();
  const [nativeAlarmManager] = useState(() => {
    if (typeof window !== 'undefined') {
      return NativeAlarmManager.getInstance();
    }
    return null;
  });

  const handleTestAlarm = async () => {
    if (isPlaying) {
      // Stop the current alarm
      alarmManager.stopCurrentAlarm();
      if (nativeAlarmManager) {
        nativeAlarmManager.stopCurrentAlarm();
      }
      setIsPlaying(false);
    } else {
      // Stop any currently playing alarm first
      alarmManager.stopCurrentAlarm();
      if (nativeAlarmManager) {
        nativeAlarmManager.stopCurrentAlarm();
      }
      
      setIsPlaying(true);
      
      try {
        // Use native alarm manager for better sound support
        if (nativeAlarmManager) {
          await nativeAlarmManager.testAlarmSound(soundId, volume);
        } else {
          await alarmManager.testAlarmSound(soundId, volume);
        }
        
        // Auto-stop after 5 seconds for test sounds
        setTimeout(() => {
          setIsPlaying(false);
        }, 5000);
        
      } catch (error) {
        console.error('Error playing test sound:', error);
        setIsPlaying(false);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        alarmManager.stopCurrentAlarm();
        if (nativeAlarmManager) {
          nativeAlarmManager.stopCurrentAlarm();
        }
      }
    };
  }, [isPlaying, alarmManager, nativeAlarmManager]);

  return (
    <Button
      variant={isPlaying ? "destructive" : "outline"}
      size="sm"
      onClick={handleTestAlarm}
      className="h-8 px-2"
      title={isPlaying ? "Stop sound" : "Play sound"}
    >
      {isPlaying ? (
        <VolumeX className="w-3 h-3" />
      ) : (
        <Play className="w-3 h-3" />
      )}
    </Button>
  );
}
