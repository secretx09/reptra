import { saveCustomExercises } from '../storage/customExercises';
import { saveProgressPhotos } from '../storage/progressPhotos';
import { saveRoutines } from '../storage/routines';
import { defaultSettings, saveSettings } from '../storage/settings';
import { saveWorkouts } from '../storage/workouts';
import { Exercise } from '../types/exercise';
import { ProgressPhoto } from '../types/progressPhoto';
import { RoutineWithExercises } from '../types/routine';
import { AppSettings } from '../types/settings';
import { SavedWorkoutSession } from '../types/workout';

type AppDataImportPayload = {
  app?: string;
  exportedAt?: string;
  version?: number;
  settings?: Partial<AppSettings>;
  workouts?: SavedWorkoutSession[];
  routines?: RoutineWithExercises[];
  customExercises?: Exercise[];
  progressPhotos?: ProgressPhoto[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSettings(settings: Partial<AppSettings> | undefined): AppSettings {
  return {
    weightUnit: settings?.weightUnit === 'kg' ? 'kg' : 'lb',
    restTimerPresets:
      Array.isArray(settings?.restTimerPresets) &&
      settings.restTimerPresets.length === 3 &&
      settings.restTimerPresets.every(
        (value) => Number.isInteger(value) && Number(value) > 0
      )
        ? settings.restTimerPresets.map((value) => Number(value))
        : defaultSettings.restTimerPresets,
    theme: settings?.theme === 'midnight' ? 'midnight' : 'graphite',
  };
}

export function parseAppDataImport(jsonInput: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonInput);
  } catch (error) {
    throw new Error('That backup is not valid JSON.');
  }

  if (!isObject(parsed)) {
    throw new Error('That backup file is missing the expected data structure.');
  }

  const payload = parsed as AppDataImportPayload;

  if (
    !Array.isArray(payload.workouts) ||
    !Array.isArray(payload.routines) ||
    !Array.isArray(payload.customExercises) ||
    !Array.isArray(payload.progressPhotos)
  ) {
    throw new Error('That backup is missing one or more required data sections.');
  }

  return {
    settings: normalizeSettings(payload.settings),
    workouts: payload.workouts,
    routines: payload.routines,
    customExercises: payload.customExercises,
    progressPhotos: payload.progressPhotos,
  };
}

export async function importAppData(jsonInput: string) {
  const parsed = parseAppDataImport(jsonInput);

  await saveSettings(parsed.settings);
  await saveWorkouts(parsed.workouts);
  await saveRoutines(parsed.routines);
  await saveCustomExercises(parsed.customExercises);
  await saveProgressPhotos(parsed.progressPhotos);
}
