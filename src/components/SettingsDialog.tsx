"use client";

import { Settings } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, onSettingsChange }: SettingsDialogProps) {
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
          <DialogDescription>
            Customize your reminder preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-base">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive reminders for your tasks</p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="defaultSound" className="text-base">Default Sound</Label>
              <p className="text-sm text-muted-foreground">Play sound for new tasks</p>
            </div>
            <Switch
              id="defaultSound"
              checked={settings.defaultSound}
              onCheckedChange={(checked) => updateSetting('defaultSound', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="defaultVibration" className="text-base">Default Vibration</Label>
              <p className="text-sm text-muted-foreground">Vibrate for new tasks</p>
            </div>
            <Switch
              id="defaultVibration"
              checked={settings.defaultVibration}
              onCheckedChange={(checked) => updateSetting('defaultVibration', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="darkMode" className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Switch to dark theme</p>
            </div>
            <Switch
              id="darkMode"
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSetting('darkMode', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="snooze" className="text-base">Snooze Duration</Label>
            <Select 
              value={settings.snoozeMinutes.toString()} 
              onValueChange={(value) => updateSetting('snoozeMinutes', parseInt(value))}
            >
              <SelectTrigger id="snooze">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}