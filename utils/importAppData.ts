import { saveCustomExercises } from '../storage/customExercises';
import { saveFavoriteExerciseIds } from '../storage/favoriteExercises';
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
  settings?: Partial<AppSettings> & {
    restTimerPresets?: unknown;
  };
  workouts?: SavedWorkoutSession[];
  routines?: RoutineWithExercises[];
  customExercises?: Exercise[];
  progressPhotos?: ProgressPhoto[];
  favoriteExerciseIds?: string[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSettings(settings: AppDataImportPayload['settings']): AppSettings {
  const legacyRestTimerSeconds = Array.isArray(settings?.restTimerPresets)
    ? settings.restTimerPresets
        .map((value) => Number(value))
        .find((value) => Number.isInteger(value) && value > 0)
    : undefined;

  return {
    weightUnit: settings?.weightUnit === 'kg' ? 'kg' : 'lb',
    defaultRestTimerSeconds:
      Number.isInteger(settings?.defaultRestTimerSeconds) &&
      Number(settings?.defaultRestTimerSeconds) > 0
        ? Number(settings?.defaultRestTimerSeconds)
        : Number.isInteger(legacyRestTimerSeconds)
          ? Number(legacyRestTimerSeconds)
          : defaultSettings.defaultRestTimerSeconds,
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
    favoriteExerciseIds: Array.isArray(payload.favoriteExerciseIds)
      ? payload.favoriteExerciseIds.filter((id) => typeof id === 'string')
      : [],
  };
}

export async function importAppData(jsonInput: string) {
  const parsed = parseAppDataImport(jsonInput);

  await saveSettings(parsed.settings);
  await saveWorkouts(parsed.workouts);
  await saveRoutines(parsed.routines);
  await saveCustomExercises(parsed.customExercises);
  await saveProgressPhotos(parsed.progressPhotos);
  await saveFavoriteExerciseIds(parsed.favoriteExerciseIds);
}
