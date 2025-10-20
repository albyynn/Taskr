import { Task } from './types';
import { storage } from './storage';

/**
 * Determines if a task should be shown in the UI
 */
export const shouldShowTask = (task: Task): boolean => {
  return true; // Show all tasks
};

/**
 * Sorts tasks by their scheduled time
 */
export const sortTasksByTime = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const [aHours, aMinutes] = a.time.split(':').map(Number);
    const [bHours, bMinutes] = b.time.split(':').map(Number);
    
    const aTime = aHours * 60 + aMinutes;
    const bTime = bHours * 60 + bMinutes;
    
    return aTime - bTime;
  });
};

/**
 * Checks if completed tasks should be reset (new day has started)
 */
export const shouldResetCompletedTasks = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const lastReset = storage.getLastReset();
  const today = new Date().toDateString();
  
  return lastReset !== today;
};

/**
 * Resets completed status for all tasks (for daily recurring tasks)
 */
export const resetDailyTasks = (tasks: Task[]): Task[] => {
  const today = new Date().toDateString();
  storage.setLastReset(today);
  
  return tasks.map(task => ({
    ...task,
    completed: false,
    completedAt: undefined
  }));
};