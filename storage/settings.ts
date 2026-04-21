import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types/settings';

const SETTINGS_KEY = 'appSettings';

export const defaultSettings: AppSettings = {
  weightUnit: 'lb',
  defaultRestTimerSeconds: 90,
  theme: 'graphite',
};

function normalizeDefaultRestTimerSeconds(value: unknown): number {
  const parsedValue = Number(value);

  if (Number.isInteger(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return defaultSettings.defaultRestTimerSeconds;
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!data) {
      return defaultSettings;
    }

    const parsed = JSON.parse(data) as Partial<AppSettings> & {
      restTimerPresets?: unknown;
    };

    const legacyDefaultRestTimerSeconds = Array.isArray(parsed.restTimerPresets)
      ? parsed.restTimerPresets
          .map((value) => Number(value))
          .find((value) => Number.isInteger(value) && value > 0)
      : undefined;

    return {
      weightUnit: parsed.weightUnit === 'kg' ? 'kg' : 'lb',
      defaultRestTimerSeconds: normalizeDefaultRestTimerSeconds(
        parsed.defaultRestTimerSeconds ?? legacyDefaultRestTimerSeconds
      ),
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
