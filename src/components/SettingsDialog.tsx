"use client";

import { Settings } from '@/lib/types';
import { ALARM_SOUNDS } from '@/lib/alarm-manager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AlarmTestButton } from '@/components/AlarmTestButton';

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

          <div className="space-y-2">
            <Label htmlFor="defaultAlarmSound" className="text-base">Default Alarm Sound</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select 
                  value={settings.defaultAlarmSound} 
                  onValueChange={(value) => updateSetting('defaultAlarmSound', value)}
                >
                  <SelectTrigger id="defaultAlarmSound">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALARM_SOUNDS.map(sound => (
                      <SelectItem key={sound.id} value={sound.id}>
                        {sound.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AlarmTestButton soundId={settings.defaultAlarmSound} volume={settings.alarmVolume} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alarmVolume" className="text-base">Alarm Volume</Label>
            <div className="px-3">
              <Slider
                id="alarmVolume"
                min={0}
                max={1}
                step={0.1}
                value={[settings.alarmVolume]}
                onValueChange={(value) => updateSetting('alarmVolume', value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Quiet</span>
                <span>{Math.round(settings.alarmVolume * 100)}%</span>
                <span>Loud</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}