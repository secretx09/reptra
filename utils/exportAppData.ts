import { loadCustomExercises } from '../storage/customExercises';
import { loadBodyMeasurements } from '../storage/bodyMeasurements';
import { loadWellnessCheckIns } from '../storage/wellnessCheckIns';
import { loadFavoriteExerciseIds } from '../storage/favoriteExercises';
import { loadFitnessGoals } from '../storage/fitnessGoals';
import { loadProgressPhotos } from '../storage/progressPhotos';
import { loadRoutines } from '../storage/routines';
import { loadSettings } from '../storage/settings';
import {
  loadDailyNutritionLogs,
  loadNutritionTargets,
  loadSavedMealPresets,
} from '../storage/nutrition';
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
    bodyMeasurements,
    wellnessCheckIns,
    nutritionTargets,
    dailyNutritionLogs,
    savedMealPresets,
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
      loadBodyMeasurements(),
      loadWellnessCheckIns(),
      loadNutritionTargets(),
      loadDailyNutritionLogs(),
      loadSavedMealPresets(),
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
    bodyMeasurements,
    wellnessCheckIns,
    nutritionTargets,
    dailyNutritionLogs,
    savedMealPresets,
  };
}
