"use client";

import { useState } from 'react';
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
      alarmManager.stopCurrentAlarm();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await alarmManager.testAlarmSound(soundId, volume);
      setIsPlaying(false);
    }
  };

  return (
    <Button
      variant={isPlaying ? "destructive" : "outline"}
      size="sm"
      onClick={handleTestAlarm}
      className="h-8 px-2"
    >
      {isPlaying ? (
        <VolumeX className="w-3 h-3" />
      ) : (
        <Play className="w-3 h-3" />
      )}
    </Button>
  );
}
