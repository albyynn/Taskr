"use client";

import { useState, useEffect } from 'react';
import { Task, RecurrenceType } from '@/lib/types';
import { ALARM_SOUNDS } from '@/lib/alarm-manager';
import { NativeAlarmManager, CustomAlarmSound } from '@/lib/native-alarm-manager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { AlarmTestButton } from '@/components/AlarmTestButton';
import { CustomSoundUpload } from '@/components/CustomSoundUpload';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingTask?: Task | null;
  defaultAlarmSound?: string;
}

const DAYS_OF_WEEK = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

export function AddTaskDialog({ open, onOpenChange, onSave, editingTask, defaultAlarmSound = 'alarm-1' }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [notes, setNotes] = useState('');
  const [notificationSound, setNotificationSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmSound, setAlarmSound] = useState(defaultAlarmSound);
  const [showCustomSoundUpload, setShowCustomSoundUpload] = useState(false);
  const [availableSounds, setAvailableSounds] = useState<CustomAlarmSound[]>([]);
  const [nativeAlarmManager] = useState(() => {
    if (typeof window !== 'undefined') {
      return NativeAlarmManager.getInstance();
    }
    return null;
  });

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setTime(editingTask.time);
      setRecurrence(editingTask.recurrence);
      setWeekDays(editingTask.weekDays || [1, 2, 3, 4, 5]);
      setNotes(editingTask.notes || '');
      setNotificationSound(editingTask.notificationSound);
      setVibration(editingTask.vibration);
      setEnabled(editingTask.enabled);
      setAlarmEnabled(editingTask.alarmEnabled);
      setAlarmSound(editingTask.alarmSound);
    } else {
      // Reset form
      setTitle('');
      setTime('09:00');
      setRecurrence('daily');
      setWeekDays([1, 2, 3, 4, 5]);
      setNotes('');
      setNotificationSound(true);
      setVibration(true);
      setEnabled(true);
      setAlarmEnabled(false);
      setAlarmSound(defaultAlarmSound);
    }
  }, [editingTask, open, defaultAlarmSound]);

  // Load available sounds when component mounts
  useEffect(() => {
    const loadSounds = async () => {
      if (nativeAlarmManager) {
        await nativeAlarmManager.loadCustomSounds();
        const sounds = nativeAlarmManager.getAvailableSounds();
        setAvailableSounds(sounds);
      }
    };
    loadSounds();
  }, [nativeAlarmManager]);

  const handleSave = () => {
    if (!title.trim() || !time) return;

    onSave({
      title: title.trim(),
      time,
      recurrence,
      weekDays: recurrence === 'weekly' ? weekDays : undefined,
      enabled,
      completed: editingTask?.completed || false,
      completedAt: editingTask?.completedAt,
      notes: notes.trim() || undefined,
      notificationSound,
      vibration,
      alarmSound,
      alarmEnabled,
    });

    onOpenChange(false);
  };

  const toggleWeekDay = (day: number) => {
    setWeekDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
          <DialogDescription>
            {editingTask ? 'Update your task details below' : 'Create a new reminder for your daily routine'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title*</Label>
            <Input
              id="title"
              placeholder="e.g., Take Medication, Exercise, Meditate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time*</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrence">Repeat</Label>
            <Select value={recurrence} onValueChange={(value) => setRecurrence(value as RecurrenceType)}>
              <SelectTrigger id="recurrence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="tomorrow">Tomorrow Only</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrence === 'weekly' && (
            <div className="space-y-2">
              <Label>Select Days</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={weekDays.includes(day.value)}
                      onCheckedChange={() => toggleWeekDay(day.value)}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm font-normal cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound" className="text-sm">Notification Sound</Label>
              <Switch
                id="sound"
                checked={notificationSound}
                onCheckedChange={setNotificationSound}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vibration" className="text-sm">Vibration</Label>
              <Switch
                id="vibration"
                checked={vibration}
                onCheckedChange={setVibration}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled" className="text-sm">Enable Task</Label>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="alarm-enabled" className="text-sm font-medium">Alarm</Label>
                <p className="text-xs text-muted-foreground">Play alarm sound when task time is reached</p>
              </div>
              <Switch
                id="alarm-enabled"
                checked={alarmEnabled}
                onCheckedChange={setAlarmEnabled}
              />
            </div>
            
            {alarmEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Choose Alarm Sound</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomSoundUpload(true)}
                    className="text-xs"
                  >
                    Upload Custom
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {availableSounds.map(sound => (
                    <div
                      key={sound.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        alarmSound === sound.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setAlarmSound(sound.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          alarmSound === sound.id 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {alarmSound === sound.id && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{sound.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {sound.isCustom ? 'Custom Sound' : sound.filename}
                          </div>
                        </div>
                      </div>
                      <AlarmTestButton soundId={sound.id} volume={0.5} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !time} className="flex-1">
            {editingTask ? 'Update' : 'Create'} Task
          </Button>
        </div>
      </DialogContent>

      {/* Custom Sound Upload Dialog */}
      <CustomSoundUpload
        open={showCustomSoundUpload}
        onOpenChange={setShowCustomSoundUpload}
        onSoundAdded={(sound) => {
          setAvailableSounds(prev => [...prev, sound]);
          setAlarmSound(sound.id);
        }}
      />
    </Dialog>
  );
}