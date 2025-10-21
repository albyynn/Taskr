"use client";

import { Task } from '@/lib/types';
import { ALARM_SOUNDS } from '@/lib/alarm-manager';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Clock, Bell, Volume2, VolumeX } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onToggleEnabled: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskItem({ task, onToggleComplete, onToggleEnabled, onEdit, onDelete }: TaskItemProps) {
  const getRecurrenceLabel = () => {
    switch (task.recurrence) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly (${task.weekDays?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')})`;
      case 'one-time':
        return 'One-time';
      case 'tomorrow':
        return 'Tomorrow';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 transition-all ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          className="mt-1"
          disabled={!task.enabled}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-semibold text-lg leading-tight ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </h3>
            <Switch
              checked={task.enabled}
              onCheckedChange={() => onToggleEnabled(task.id)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{task.time}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bell className="w-4 h-4" />
              <span>{getRecurrenceLabel()}</span>
            </div>
            {task.alarmEnabled && (
              <div className="flex items-center gap-1">
                <Volume2 className="w-4 h-4" />
                <span className="text-xs">
                  {ALARM_SOUNDS.find(s => s.id === task.alarmSound)?.name || 'Unknown Sound'}
                </span>
              </div>
            )}
            {!task.alarmEnabled && (
              <div className="flex items-center gap-1">
                <VolumeX className="w-4 h-4" />
                <span className="text-xs text-muted-foreground">No Alarm</span>
              </div>
            )}
          </div>
          
          {task.notes && (
            <p className="text-sm text-muted-foreground mb-2">{task.notes}</p>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}