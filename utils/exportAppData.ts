import { loadCustomExercises } from '../storage/customExercises';
import { loadFavoriteExerciseIds } from '../storage/favoriteExercises';
import { loadFitnessGoals } from '../storage/fitnessGoals';
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
    fitnessGoals,
  ] =
    await Promise.all([
      loadSettings(),
      loadWorkouts(),
      loadRoutines(),
      loadCustomExercises(),
      loadProgressPhotos(),
      loadFavoriteExerciseIds(),
      loadTrainingSplitPlan(),
      loadFitnessGoals(),
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
    fitnessGoals,
  };
}
