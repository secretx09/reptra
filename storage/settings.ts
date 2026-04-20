import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types/settings';

const SETTINGS_KEY = 'appSettings';

export const defaultSettings: AppSettings = {
  weightUnit: 'lb',
  restTimerPresets: [60, 90, 120],
  theme: 'graphite',
};

function normalizeRestTimerPresets(presets: unknown): number[] {
  if (!Array.isArray(presets)) {
    return defaultSettings.restTimerPresets;
  }

  const normalizedPresets = presets
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, 3);

  if (normalizedPresets.length !== 3) {
    return defaultSettings.restTimerPresets;
  }

  return normalizedPresets;
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!data) {
      return defaultSettings;
    }

    const parsed = JSON.parse(data) as Partial<AppSettings>;

    return {
      weightUnit: parsed.weightUnit === 'kg' ? 'kg' : 'lb',
      restTimerPresets: normalizeRestTimerPresets(parsed.restTimerPresets),
      theme: parsed.theme === 'midnight' ? 'midnight' : 'graphite',
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
