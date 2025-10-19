"use client";

import { useState, useEffect } from 'react';
import { Task, Settings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { requestNotificationPermission, scheduleAllNotifications } from '@/lib/notifications';
import { shouldResetCompletedTasks, resetDailyTasks, shouldShowTask, sortTasksByTime } from '@/lib/taskUtils';
import { TaskItem } from '@/components/TaskItem';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Button } from '@/components/ui/button';
import { Plus, Settings as SettingsIcon, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);

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
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Schedule notifications
  useEffect(() => {
    if (settings.notificationsEnabled && notificationPermission === 'granted') {
      scheduleAllNotifications(tasks);
    }
  }, [tasks, settings.notificationsEnabled, notificationPermission]);

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

  const handleRequestNotification = async () => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    
    // Check if in iframe
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      toast.error('Cannot enable notifications in preview mode. Please open the app in a new tab or install it to your home screen.');
      setIsRequesting(false);
      return;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in your browser.');
      setIsRequesting(false);
      return;
    }

    // Check if already denied
    if (Notification.permission === 'denied') {
      toast.error('Notification permission was denied. Please enable notifications in your browser settings.');
      setIsRequesting(false);
      return;
    }

    try {
      const granted = await requestNotificationPermission();
      
      if (granted) {
        setNotificationPermission('granted');
        const updatedSettings = { ...settings, notificationsEnabled: true };
        setSettings(updatedSettings);
        storage.saveSettings(updatedSettings);
        toast.success('Notifications enabled! You\'ll receive reminders for your tasks.');
      } else {
        toast.error('Notification permission was denied. Please try again or check your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notifications:', error);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
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
              <p className="text-sm text-muted-foreground">Stay on track with your routines</p>
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
        {notificationPermission !== 'granted' && (
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
      />

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
}