import { Task } from './types';
import { storage } from './storage';

export const shouldResetCompletedTasks = (): boolean => {
  const lastReset = storage.getLastReset();
  const today = new Date().toDateString();
  
  if (!lastReset || lastReset !== today) {
    return true;
  }
  
  return false;
};

export const resetDailyTasks = (tasks: Task[]): Task[] => {
  const today = new Date().toDateString();
  
  const updatedTasks = tasks.map(task => {
    if (task.recurrence === 'daily' && task.completed) {
      return {
        ...task,
        completed: false,
        completedAt: undefined,
      };
    }
    
    // Handle one-time and tomorrow tasks
    if (task.recurrence === 'one-time' && task.completed) {
      const completedDate = task.completedAt ? new Date(task.completedAt).toDateString() : '';
      if (completedDate !== today) {
        // Keep completed one-time tasks
        return task;
      }
    }
    
    if (task.recurrence === 'tomorrow') {
      const createdDate = new Date(task.createdAt).toDateString();
      const tomorrow = new Date(task.createdAt);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toDateString();
      
      if (today === tomorrowDate && task.completed) {
        // Reset tomorrow task on the next day
        return {
          ...task,
          completed: false,
          completedAt: undefined,
        };
      }
    }
    
    return task;
  });
  
  storage.setLastReset(today);
  return updatedTasks;
};

export const shouldShowTask = (task: Task): boolean => {
  const now = new Date();
  const today = now.toDateString();
  
  // One-time tasks
  if (task.recurrence === 'one-time') {
    if (task.completed) {
      const completedDate = task.completedAt ? new Date(task.completedAt).toDateString() : '';
      return completedDate === today;
    }
    return true;
  }
  
  // Tomorrow tasks
  if (task.recurrence === 'tomorrow') {
    const createdDate = new Date(task.createdAt);
    const tomorrow = new Date(createdDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toDateString();
    
    return today === tomorrowDate;
  }
  
  // Daily tasks - always show
  if (task.recurrence === 'daily') {
    return true;
  }
  
  // Weekly tasks - check if today is selected day
  if (task.recurrence === 'weekly' && task.weekDays) {
    const dayOfWeek = now.getDay();
    return task.weekDays.includes(dayOfWeek);
  }
  
  return true;
};

export const sortTasksByTime = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const [aHours, aMinutes] = a.time.split(':').map(Number);
    const [bHours, bMinutes] = b.time.split(':').map(Number);
    
    const aTotal = aHours * 60 + aMinutes;
    const bTotal = bHours * 60 + bMinutes;
    
    return aTotal - bTotal;
  });
};