"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlarmManager } from '@/lib/alarm-manager';
import { Volume2, VolumeX, Play } from 'lucide-react';

interface AlarmTestButtonProps {
  soundId: string;
  volume: number;
}

export function AlarmTestButton({ soundId, volume }: AlarmTestButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const alarmManager = AlarmManager.getInstance();

  const handleTestAlarm = async () => {
    if (isPlaying) {
      // Stop the current alarm
      alarmManager.stopCurrentAlarm();
      setIsPlaying(false);
    } else {
      // Stop any currently playing alarm first
      alarmManager.stopCurrentAlarm();
      
      setIsPlaying(true);
      
      try {
        await alarmManager.testAlarmSound(soundId, volume);
        
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
      }
    };
  }, [isPlaying, alarmManager]);

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
