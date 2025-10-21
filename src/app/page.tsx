"use client";

import { useState, useEffect } from 'react';
import { Task, Settings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { shouldShowTask, sortTasksByTime, shouldResetCompletedTasks, resetDailyTasks } from '@/lib/task-utils';
import {
  requestNotificationPermission,
  checkNotificationPermission,
  scheduleAllNotifications,
  vibrateDevice,
  playNotificationSound,
  checkMissedNotifications,
} from '@/lib/notifications';
import { AlarmManager } from '@/lib/alarm-manager';
import { TaskItem } from '@/components/TaskItem';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { InstallPrompt } from '@/components/InstallPrompt';
// ... keep existing imports ...
import { Button } from '@/components/ui/button';
import { Plus, Settings as SettingsIcon, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [alarmManager] = useState(() => AlarmManager.getInstance());

  // Check if we should show the permission dialog on load
  useEffect(() => {
    const hasAskedBefore = localStorage.getItem('hasAskedPermission');
    const isInIframe = window.self !== window.top;
    
    // Only show if we haven't asked before, not in iframe, and don't have permission
    if (!hasAskedBefore && !isInIframe && 'Notification' in window && Notification.permission === 'default') {
      // Small delay to let the page load first
      setTimeout(() => {
        setShowPermissionDialog(true);
      }, 1000);
    }
  }, []);

  // Load tasks and check for daily reset
  useEffect(() => {
    const loadedTasks = storage.getTasks();
    
    if (shouldResetCompletedTasks()) {
      const resetTasks = resetDailyTasks(loadedTasks);
      setTasks(resetTasks);
      storage.saveTasks(resetTasks);
    } else {
      setTasks(loadedTasks);
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Check notification permission
    checkNotificationPermission().then(setHasNotificationPermission);

    // Check for missed notifications on startup
    checkMissedNotifications(loadedTasks);
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Schedule notifications and alarms
  useEffect(() => {
    if (settings.notificationsEnabled && hasNotificationPermission) {
      scheduleAllNotifications(tasks);
      alarmManager.scheduleAlarms(tasks, settings);
    }
  }, [tasks, settings.notificationsEnabled, settings, hasNotificationPermission, alarmManager]);

  // Periodic notification check
  useEffect(() => {
    if (!settings.notificationsEnabled || !hasNotificationPermission) return;

    const checkNotifications = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.enabled || task.completed) return;

        const [hours, minutes] = task.time.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        const timeDiff = now.getTime() - scheduledTime.getTime();
        
        // If within 1 minute of scheduled time
        if (timeDiff >= 0 && timeDiff < 60000) {
          const notificationKey = `notified_${task.id}_${scheduledTime.toDateString()}`;
          const alreadyNotified = sessionStorage.getItem(notificationKey);
          
          if (!alreadyNotified) {
            showWebNotification(task);
            sessionStorage.setItem(notificationKey, 'true');
          }
        }
      });
    };

    // Check immediately
    checkNotifications();

    // Then check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);

    return () => clearInterval(interval);
  }, [tasks, settings.notificationsEnabled, hasNotificationPermission]);

  // Function to show web notification with vibration
  const showWebNotification = async (task: Task) => {
    try {
      // Vibrate device if enabled
      if (task.vibration) {
        await vibrateDevice();
      }

      // Play sound if enabled
      if (task.notificationSound) {
        playNotificationSound();
      }

      // Show notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(`⏰ ${task.title}`, {
          body: `Time for: ${task.title}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: task.id,
          requireInteraction: true,
          silent: !task.notificationSound,
          data: { taskId: task.id, url: window.location.origin },
        });
      } else {
        new Notification(`⏰ ${task.title}`, {
          body: `Time for: ${task.title}`,
          icon: '/icon-192.png',
          tag: task.id,
          requireInteraction: true,
        });
      }

      console.log(`Notification shown for task: ${task.title}`);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // Check for midnight reset
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      if (shouldResetCompletedTasks()) {
        const resetTasks = resetDailyTasks(tasks);
        setTasks(resetTasks);
        storage.saveTasks(resetTasks);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkMidnight);
  }, [tasks]);

  // Cleanup alarms on unmount
  useEffect(() => {
    return () => {
      alarmManager.clearAllAlarms();
      alarmManager.stopCurrentAlarm();
    };
  }, [alarmManager]);

  const handleRequestNotification = async () => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      toast.error('Cannot enable notifications in preview mode. Please open the app in a new tab or install it to your home screen.');
      setIsRequesting(false);
      return;
    }

    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in your browser.');
      setIsRequesting(false);
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notification permission was denied. Please enable notifications in your browser settings.');
      setIsRequesting(false);
      return;
    }

    try {
      const granted = await requestNotificationPermission();
      
      if (granted) {
        setHasNotificationPermission(true);
        const updatedSettings = { ...settings, notificationsEnabled: true };
        setSettings(updatedSettings);
        storage.saveSettings(updatedSettings);
        
        // Test vibration
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        toast.success('Notifications enabled! You\'ll receive reminders for your tasks.');
      } else {
        toast.error('Notification permission was denied. Please try again or check your settings.');
      }
    } catch (error) {
      console.error('Error requesting notifications:', error);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setIsRequesting(false);
      // Mark that we've asked for permission
      localStorage.setItem('hasAskedPermission', 'true');
    }
  };

  const handlePermissionDialogAccept = async () => {
    setShowPermissionDialog(false);
    await handleRequestNotification();
  };

  const handlePermissionDialogDecline = () => {
    setShowPermissionDialog(false);
    localStorage.setItem('hasAskedPermission', 'true');
    toast.info('You can enable notifications later from the banner above.');
  };

  // ... keep existing handler functions ...
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      alarmSound: taskData.alarmSound || settings.defaultAlarmSound,
      alarmEnabled: taskData.alarmEnabled ?? true,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    storage.saveTasks(updatedTasks);
  };

  const handleEditTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTask) return;
    
    const updatedTasks = tasks.map(task => 
      task.id === editingTask.id 
        ? { ...taskData, id: task.id, createdAt: task.createdAt, updatedAt: new Date().toISOString() }
        : task
    );
    setTasks(updatedTasks);
    storage.saveTasks(updatedTasks);
    setEditingTask(null);
  };

  const handleToggleComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined }
        : task
    );
    setTasks(updatedTasks);
    storage.saveTasks(updatedTasks);
  };

  const handleToggleEnabled = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, enabled: !task.enabled }
        : task
    );
    setTasks(updatedTasks);
    storage.saveTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    storage.saveTasks(updatedTasks);
  };

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setShowAddDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  const visibleTasks = tasks.filter(shouldShowTask);
  const sortedTasks = sortTasksByTime(visibleTasks);
  const completedCount = sortedTasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Daily Reminder</h1>
              <p className="text-sm text-muted-foreground">Ponnu stay on track with your routines</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettingsDialog(true)}
              className="shrink-0"
            >
              <SettingsIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Notification Permission Banner */}
        {!hasNotificationPermission && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <BellOff className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Enable Notifications</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get reminders for your tasks at the right time
                </p>
                <Button size="sm" onClick={handleRequestNotification} disabled={isRequesting}>
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {sortedTasks.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{sortedTasks.length}</div>
              <div className="text-xs text-muted-foreground">Total Tasks</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{completedCount}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{sortedTasks.length - completedCount}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        )}

        {/* Task List */}
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding your first daily reminder
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onToggleEnabled={handleToggleEnabled}
                onEdit={handleEditClick}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {sortedTasks.length > 0 && (
        <Button
          onClick={() => setShowAddDialog(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* Dialogs */}
      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={handleDialogClose}
        onSave={editingTask ? handleEditTask : handleAddTask}
        editingTask={editingTask}
        defaultAlarmSound={settings.defaultAlarmSound}
      />

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Permission Request Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Enable Notifications & Vibration
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                This app needs your permission to send you timely reminders for your daily tasks.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <strong>Notifications:</strong> Get alerts when it's time for your tasks
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-[-2px]">📳</span>
                  <div>
                    <strong>Vibration:</strong> Feel a gentle vibration with each reminder
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You can change these settings anytime.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handlePermissionDialogDecline}
              className="w-full sm:w-auto"
            >
              Not Now
            </Button>
            <Button
              onClick={handlePermissionDialogAccept}
              disabled={isRequesting}
              className="w-full sm:w-auto"
            >
              <Bell className="w-4 h-4 mr-2" />
              Allow Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}