import { loadCustomExercises } from '../storage/customExercises';
import { loadFavoriteExerciseIds } from '../storage/favoriteExercises';
import { loadProgressPhotos } from '../storage/progressPhotos';
import { loadRoutines } from '../storage/routines';
import { loadSettings } from '../storage/settings';
import { loadTrainingSplitPlan } from '../storage/trainingSplit';
import { loadWorkouts } from '../storage/workouts';

export async function buildAppDataExport() {
  const [
    settings,
    workouts,
    routines,
    customExercises,
    progressPhotos,
    favoriteExerciseIds,
    trainingSplitPlan,
  ] =
    await Promise.all([
      loadSettings(),
      loadWorkouts(),
      loadRoutines(),
      loadCustomExercises(),
      loadProgressPhotos(),
      loadFavoriteExerciseIds(),
      loadTrainingSplitPlan(),
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
    favoriteExerciseIds,
    trainingSplitPlan,
  };
}
