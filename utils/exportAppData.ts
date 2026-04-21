import { loadCustomExercises } from '../storage/customExercises';
import { loadProgressPhotos } from '../storage/progressPhotos';
import { loadRoutines } from '../storage/routines';
import { loadSettings } from '../storage/settings';
import { loadWorkouts } from '../storage/workouts';

export async function buildAppDataExport() {
  const [settings, workouts, routines, customExercises, progressPhotos] =
    await Promise.all([
      loadSettings(),
      loadWorkouts(),
      loadRoutines(),
      loadCustomExercises(),
      loadProgressPhotos(),
    ]);

  return {
    app: 'Reptra',
    exportedAt: new Date().toISOString(),
    version: 1,
    settings,
    workouts,
    routines,
    customExercises,
    progressPhotos,
  };
}
