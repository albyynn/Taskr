"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Upload, Music, Trash2, Play, VolumeX } from 'lucide-react';
import { NativeAlarmManager, CustomAlarmSound } from '@/lib/native-alarm-manager';
import { toast } from 'sonner';

interface CustomSoundUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSoundAdded?: (sound: CustomAlarmSound) => void;
}

export function CustomSoundUpload({ open, onOpenChange, onSoundAdded }: CustomSoundUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [customSounds, setCustomSounds] = useState<CustomAlarmSound[]>([]);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nativeAlarmManager] = useState(() => {
    if (typeof window !== 'undefined') {
      return NativeAlarmManager.getInstance();
    }
    return null;
  });

  // Load custom sounds when component mounts
  useState(() => {
    loadCustomSounds();
  });

  const loadCustomSounds = async () => {
    if (nativeAlarmManager) {
      await nativeAlarmManager.loadCustomSounds();
      const sounds = nativeAlarmManager.getAvailableSounds().filter(s => s.isCustom);
      setCustomSounds(sounds);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file (MP3, WAV, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    if (!nativeAlarmManager) {
      toast.error('Alarm manager not available');
      return;
    }

    setIsUploading(true);
    try {
      const customSound = await nativeAlarmManager.uploadCustomSound(file);
      setCustomSounds(prev => [...prev, customSound]);
      onSoundAdded?.(customSound);
      toast.success(`Custom sound "${customSound.name}" uploaded successfully!`);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading custom sound:', error);
      toast.error('Failed to upload custom sound. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSound = async (soundId: string) => {
    if (!nativeAlarmManager) {
      toast.error('Alarm manager not available');
      return;
    }

    try {
      await nativeAlarmManager.deleteCustomSound(soundId);
      setCustomSounds(prev => prev.filter(s => s.id !== soundId));
      toast.success('Custom sound deleted successfully!');
    } catch (error) {
      console.error('Error deleting custom sound:', error);
      toast.error('Failed to delete custom sound. Please try again.');
    }
  };

  const handleTestSound = async (soundId: string) => {
    if (!nativeAlarmManager) {
      toast.error('Alarm manager not available');
      return;
    }

    if (playingSound === soundId) {
      nativeAlarmManager.stopCurrentAlarm();
      setPlayingSound(null);
      return;
    }

    try {
      setPlayingSound(soundId);
      await nativeAlarmManager.testAlarmSound(soundId, 0.5);
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        setPlayingSound(null);
      }, 5000);
    } catch (error) {
      console.error('Error testing sound:', error);
      setPlayingSound(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Custom Alarm Sounds
          </DialogTitle>
          <DialogDescription>
            Upload your own MP3 files to use as alarm sounds for your reminders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Section */}
          <div className="space-y-3">
            <Label htmlFor="sound-upload" className="text-sm font-medium">
              Upload New Sound
            </Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="sound-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: MP3, WAV, M4A. Max size: 10MB
            </p>
          </div>

          {/* Custom Sounds List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Custom Sounds</Label>
            {customSounds.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No custom sounds uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customSounds.map((sound) => (
                  <div
                    key={sound.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Music className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{sound.name}</p>
                        <p className="text-xs text-muted-foreground">Custom Sound</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestSound(sound.id)}
                        className="h-8 w-8 p-0"
                      >
                        {playingSound === sound.id ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSound(sound.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
