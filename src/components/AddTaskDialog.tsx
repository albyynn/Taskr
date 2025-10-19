"use client";

import { useState, useEffect } from 'react';
import { Task, RecurrenceType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingTask?: Task | null;
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

export function AddTaskDialog({ open, onOpenChange, onSave, editingTask }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [notes, setNotes] = useState('');
  const [notificationSound, setNotificationSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [enabled, setEnabled] = useState(true);

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
    }
  }, [editingTask, open]);

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
    </Dialog>
  );
}