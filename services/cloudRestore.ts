import { loadCustomExercises, saveCustomExercises } from '../storage/customExercises';
import { loadBodyMeasurements, saveBodyMeasurements } from '../storage/bodyMeasurements';
import { loadFitnessGoals, saveFitnessGoals } from '../storage/fitnessGoals';
import { saveFavoriteExerciseIds } from '../storage/favoriteExercises';
import { loadFavoriteExerciseIds } from '../storage/favoriteExercises';
import { loadProgressPhotos, saveProgressPhotos } from '../storage/progressPhotos';
import { loadRoutines, saveRoutines } from '../storage/routines';
import { saveSettings } from '../storage/settings';
import {
  loadDailyNutritionLogs,
  loadNutritionTargets,
  loadSavedMealPresets,
  saveDailyNutritionLogs,
  saveNutritionTargets,
  saveSavedMealPresets,
} from '../storage/nutrition';
import { saveTrainingSplitPlan } from '../storage/trainingSplit';
import { loadWellnessCheckIns, saveWellnessCheckIns } from '../storage/wellnessCheckIns';
import { loadWorkouts, saveWorkouts } from '../storage/workouts';
import {
  markCloudMergeComplete,
  markCloudRestoreComplete,
} from '../storage/cloudSyncStatus';
import { Exercise } from '../types/exercise';
import { BodyMeasurement } from '../types/bodyMeasurement';
import { FitnessGoal } from '../types/fitnessGoal';
import {
  DailyNutritionLog,
  NutritionTargets,
  SavedMealPreset,
} from '../types/nutrition';
import { ProgressPhoto } from '../types/progressPhoto';
import { RoutineWithExercises } from '../types/routine';
import { AppSettings } from '../types/settings';
import { TrainingSplitPlan } from '../types/trainingSplit';
import { SavedWorkoutSession } from '../types/workout';
import { WellnessCheckIn } from '../types/wellnessCheckIn';
import { Database, Json } from '../types/supabase';
import { getCurrentUser } from './auth';
import { getSupabaseClient } from './supabase';

type CloudRecord = Database['public']['Tables']['cloud_records']['Row'];

export interface CloudBackupSummary {
  ok: boolean;
  message: string;
  totalRecords: number;
  lastUpdatedAt: string | null;
  counts: {
    workouts: number;
    routines: number;
    customExercises: number;
    progressPhotos: number;
    settings: number;
    trainingSplit: number;
    favoriteExercises: number;
    fitnessGoals: number;
    bodyMeasurements: number;
    wellnessCheckIns: number;
    nutritionTargets: number;
    dailyNutritionLogs: number;
    savedMealPresets: number;
  };
}

export interface CloudRestoreResult {
  ok: boolean;
  message: string;
  recordCount: number;
}

export interface CloudMergeResult {
  ok: boolean;
  message: string;
  addedCounts: {
    workouts: number;
    routines: number;
    customExercises: number;
    progressPhotos: number;
    favoriteExercises: number;
    fitnessGoals: number;
    bodyMeasurements: number;
    wellnessCheckIns: number;
    dailyNutritionLogs: number;
    savedMealPresets: number;
  };
}

function fromJson<T>(value: Json): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function fetchCloudRecords() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
      records: [] as CloudRecord[],
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: 'Sign in before reading cloud data.',
      records: [] as CloudRecord[],
    };
  }

  const { data, error } = await supabase
    .from('cloud_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    return {
      ok: false,
      message: error.message,
      records: [] as CloudRecord[],
    };
  }

  return {
    ok: true,
    message: 'Cloud data loaded.',
    records: data ?? [],
  };
}

export async function getCloudBackupSummary(): Promise<CloudBackupSummary> {
  const result = await fetchCloudRecords();

  if (!result.ok) {
    return {
      ok: false,
      message: result.message,
      totalRecords: 0,
      lastUpdatedAt: null,
      counts: {
        workouts: 0,
        routines: 0,
        customExercises: 0,
        progressPhotos: 0,
        settings: 0,
        trainingSplit: 0,
        favoriteExercises: 0,
        fitnessGoals: 0,
        bodyMeasurements: 0,
        wellnessCheckIns: 0,
        nutritionTargets: 0,
        dailyNutritionLogs: 0,
        savedMealPresets: 0,
      },
    };
  }

  const records = result.records;

  return {
    ok: true,
    message:
      records.length === 0
        ? 'No cloud backup records found yet.'
        : `Found ${records.length} cloud backup record${
            records.length === 1 ? '' : 's'
          }.`,
    totalRecords: records.length,
    lastUpdatedAt: records[0]?.updated_at ?? null,
    counts: {
      workouts: records.filter((record) => record.record_type === 'workout').length,
      routines: records.filter((record) => record.record_type === 'routine').length,
      customExercises: records.filter(
        (record) => record.record_type === 'custom_exercise'
      ).length,
      progressPhotos: records.filter(
        (record) => record.record_type === 'progress_photo'
      ).length,
      settings: records.filter((record) => record.record_type === 'settings').length,
      trainingSplit: records.filter(
        (record) => record.record_type === 'training_split'
      ).length,
      favoriteExercises: records.filter(
        (record) => record.record_type === 'favorite_exercise'
      ).length,
      fitnessGoals: records.filter((record) => record.record_type === 'fitness_goal')
        .length,
      bodyMeasurements: records.filter(
        (record) => record.record_type === 'body_measurement'
      ).length,
      wellnessCheckIns: records.filter(
        (record) => record.record_type === 'wellness_check_in'
      ).length,
      nutritionTargets: records.filter(
        (record) => record.record_type === 'nutrition_targets'
      ).length,
      dailyNutritionLogs: records.filter(
        (record) => record.record_type === 'daily_nutrition_log'
      ).length,
      savedMealPresets: records.filter(
        (record) => record.record_type === 'saved_meal_preset'
      ).length,
    },
  };
}

export async function restoreCloudDataToLocal(): Promise<CloudRestoreResult> {
  const result = await fetchCloudRecords();

  if (!result.ok) {
    return {
      ok: false,
      message: result.message,
      recordCount: 0,
    };
  }

  const records = result.records;

  if (records.length === 0) {
    return {
      ok: false,
      message: 'No cloud backup records found to restore.',
      recordCount: 0,
    };
  }

  const settingsRecord = records.find(
    (record) => record.record_type === 'settings'
  );
  const favoritesRecord = records.find(
    (record) => record.record_type === 'favorite_exercise'
  );
  const trainingSplitRecord = records.find(
    (record) => record.record_type === 'training_split'
  );
  const nutritionTargetsRecord = records.find(
    (record) => record.record_type === 'nutrition_targets'
  );

  await saveWorkouts(
    records
      .filter((record) => record.record_type === 'workout')
      .map((record) => fromJson<SavedWorkoutSession>(record.payload))
  );
  await saveRoutines(
    records
      .filter((record) => record.record_type === 'routine')
      .map((record) => fromJson<RoutineWithExercises>(record.payload))
  );
  await saveCustomExercises(
    records
      .filter((record) => record.record_type === 'custom_exercise')
      .map((record) => fromJson<Exercise>(record.payload))
  );
  await saveProgressPhotos(
    records
      .filter((record) => record.record_type === 'progress_photo')
      .map((record) => fromJson<ProgressPhoto>(record.payload))
  );
  await saveFitnessGoals(
    records
      .filter((record) => record.record_type === 'fitness_goal')
      .map((record) => fromJson<FitnessGoal>(record.payload))
  );
  await saveBodyMeasurements(
    records
      .filter((record) => record.record_type === 'body_measurement')
      .map((record) => fromJson<BodyMeasurement>(record.payload))
  );
  await saveWellnessCheckIns(
    records
      .filter((record) => record.record_type === 'wellness_check_in')
      .map((record) => fromJson<WellnessCheckIn>(record.payload))
  );
  await saveDailyNutritionLogs(
    records
      .filter((record) => record.record_type === 'daily_nutrition_log')
      .map((record) => fromJson<DailyNutritionLog>(record.payload))
  );
  await saveSavedMealPresets(
    records
      .filter((record) => record.record_type === 'saved_meal_preset')
      .map((record) => fromJson<SavedMealPreset>(record.payload))
  );

  if (settingsRecord) {
    await saveSettings(fromJson<AppSettings>(settingsRecord.payload));
  }

  if (favoritesRecord) {
    await saveFavoriteExerciseIds(fromJson<string[]>(favoritesRecord.payload));
  }

  if (trainingSplitRecord) {
    await saveTrainingSplitPlan(
      fromJson<TrainingSplitPlan>(trainingSplitRecord.payload)
    );
  }

  if (nutritionTargetsRecord) {
    await saveNutritionTargets(
      fromJson<NutritionTargets>(nutritionTargetsRecord.payload)
    );
  }

  const message = `Restored ${records.length} cloud record${
    records.length === 1 ? '' : 's'
  } to local storage.`;

  await markCloudRestoreComplete(records.length, message);

  return {
    ok: true,
    message,
    recordCount: records.length,
  };
}

function mergeById<T extends { id: string }>(localItems: T[], cloudItems: T[]) {
  const localIds = new Set(localItems.map((item) => item.id));
  const missingCloudItems = cloudItems.filter((item) => !localIds.has(item.id));

  return {
    mergedItems: [...localItems, ...missingCloudItems],
    addedCount: missingCloudItems.length,
  };
}

export async function mergeCloudDataIntoLocal(): Promise<CloudMergeResult> {
  const result = await fetchCloudRecords();

  if (!result.ok) {
    return {
      ok: false,
      message: result.message,
      addedCounts: {
        workouts: 0,
        routines: 0,
        customExercises: 0,
        progressPhotos: 0,
        favoriteExercises: 0,
        fitnessGoals: 0,
        bodyMeasurements: 0,
        wellnessCheckIns: 0,
        dailyNutritionLogs: 0,
        savedMealPresets: 0,
      },
    };
  }

  const records = result.records;

  if (records.length === 0) {
    return {
      ok: false,
      message: 'No cloud backup records found to merge.',
      addedCounts: {
        workouts: 0,
        routines: 0,
        customExercises: 0,
        progressPhotos: 0,
        favoriteExercises: 0,
        fitnessGoals: 0,
        bodyMeasurements: 0,
        wellnessCheckIns: 0,
        dailyNutritionLogs: 0,
        savedMealPresets: 0,
      },
    };
  }

  const [
    localWorkouts,
    localRoutines,
    localCustomExercises,
    localProgressPhotos,
    localFavoriteExerciseIds,
    localFitnessGoals,
    localBodyMeasurements,
    localWellnessCheckIns,
    localDailyNutritionLogs,
    localSavedMealPresets,
  ] = await Promise.all([
    loadWorkouts(),
    loadRoutines(),
    loadCustomExercises(),
    loadProgressPhotos(),
    loadFavoriteExerciseIds(),
    loadFitnessGoals(),
    loadBodyMeasurements(),
    loadWellnessCheckIns(),
    loadDailyNutritionLogs(),
    loadSavedMealPresets(),
  ]);

  const nutritionTargetsRecord = records.find(
    (record) => record.record_type === 'nutrition_targets'
  );

  const cloudWorkouts = records
    .filter((record) => record.record_type === 'workout')
    .map((record) => fromJson<SavedWorkoutSession>(record.payload));
  const cloudRoutines = records
    .filter((record) => record.record_type === 'routine')
    .map((record) => fromJson<RoutineWithExercises>(record.payload));
  const cloudCustomExercises = records
    .filter((record) => record.record_type === 'custom_exercise')
    .map((record) => fromJson<Exercise>(record.payload));
  const cloudProgressPhotos = records
    .filter((record) => record.record_type === 'progress_photo')
    .map((record) => fromJson<ProgressPhoto>(record.payload));
  const cloudFavoriteRecord = records.find(
    (record) => record.record_type === 'favorite_exercise'
  );
  const cloudFavoriteExerciseIds = cloudFavoriteRecord
    ? fromJson<string[]>(cloudFavoriteRecord.payload)
    : [];
  const cloudFitnessGoals = records
    .filter((record) => record.record_type === 'fitness_goal')
    .map((record) => fromJson<FitnessGoal>(record.payload));
  const cloudBodyMeasurements = records
    .filter((record) => record.record_type === 'body_measurement')
    .map((record) => fromJson<BodyMeasurement>(record.payload));
  const cloudWellnessCheckIns = records
    .filter((record) => record.record_type === 'wellness_check_in')
    .map((record) => fromJson<WellnessCheckIn>(record.payload));
  const cloudDailyNutritionLogs = records
    .filter((record) => record.record_type === 'daily_nutrition_log')
    .map((record) => fromJson<DailyNutritionLog>(record.payload));
  const cloudSavedMealPresets = records
    .filter((record) => record.record_type === 'saved_meal_preset')
    .map((record) => fromJson<SavedMealPreset>(record.payload));

  const workoutMerge = mergeById(localWorkouts, cloudWorkouts);
  const routineMerge = mergeById(localRoutines, cloudRoutines);
  const customExerciseMerge = mergeById(
    localCustomExercises,
    cloudCustomExercises
  );
  const progressPhotoMerge = mergeById(localProgressPhotos, cloudProgressPhotos);
  const fitnessGoalMerge = mergeById(localFitnessGoals, cloudFitnessGoals);
  const bodyMeasurementMerge = mergeById(
    localBodyMeasurements,
    cloudBodyMeasurements
  );
  const wellnessCheckInMerge = mergeById(
    localWellnessCheckIns,
    cloudWellnessCheckIns
  );
  const dailyNutritionLogMerge = mergeById(
    localDailyNutritionLogs,
    cloudDailyNutritionLogs
  );
  const savedMealPresetMerge = mergeById(
    localSavedMealPresets,
    cloudSavedMealPresets
  );
  const mergedFavoriteExerciseIds = Array.from(
    new Set([...localFavoriteExerciseIds, ...cloudFavoriteExerciseIds])
  );
  const addedFavoriteCount =
    mergedFavoriteExerciseIds.length - localFavoriteExerciseIds.length;

  await Promise.all([
    saveWorkouts(workoutMerge.mergedItems),
    saveRoutines(routineMerge.mergedItems),
    saveCustomExercises(customExerciseMerge.mergedItems),
    saveProgressPhotos(progressPhotoMerge.mergedItems),
    saveFavoriteExerciseIds(mergedFavoriteExerciseIds),
    saveFitnessGoals(fitnessGoalMerge.mergedItems),
    saveBodyMeasurements(bodyMeasurementMerge.mergedItems),
    saveWellnessCheckIns(wellnessCheckInMerge.mergedItems),
    saveDailyNutritionLogs(dailyNutritionLogMerge.mergedItems),
    saveSavedMealPresets(savedMealPresetMerge.mergedItems),
  ]);

  if (nutritionTargetsRecord) {
    const localNutritionTargets = await loadNutritionTargets();
    const cloudNutritionTargets = fromJson<NutritionTargets>(
      nutritionTargetsRecord.payload
    );

    if (!localNutritionTargets.updatedAt && cloudNutritionTargets.updatedAt) {
      await saveNutritionTargets(cloudNutritionTargets);
    }
  }

  const addedTotal =
    workoutMerge.addedCount +
    routineMerge.addedCount +
    customExerciseMerge.addedCount +
    progressPhotoMerge.addedCount +
    fitnessGoalMerge.addedCount +
    bodyMeasurementMerge.addedCount +
    wellnessCheckInMerge.addedCount +
    dailyNutritionLogMerge.addedCount +
    savedMealPresetMerge.addedCount +
    addedFavoriteCount;
  const message =
    addedTotal === 0
      ? 'Cloud merge finished. No missing local records were found.'
      : `Cloud merge added ${addedTotal} missing local item${
          addedTotal === 1 ? '' : 's'
        } without replacing existing data.`;

  await markCloudMergeComplete(addedTotal, message);

  return {
    ok: true,
    message,
    addedCounts: {
      workouts: workoutMerge.addedCount,
      routines: routineMerge.addedCount,
      customExercises: customExerciseMerge.addedCount,
      progressPhotos: progressPhotoMerge.addedCount,
      favoriteExercises: addedFavoriteCount,
      fitnessGoals: fitnessGoalMerge.addedCount,
      bodyMeasurements: bodyMeasurementMerge.addedCount,
      wellnessCheckIns: wellnessCheckInMerge.addedCount,
      dailyNutritionLogs: dailyNutritionLogMerge.addedCount,
      savedMealPresets: savedMealPresetMerge.addedCount,
    },
  };
}
