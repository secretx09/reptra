import { buildAppDataExport } from '../utils/exportAppData';
import { Json } from '../types/supabase';
import { markCloudBackupComplete } from '../storage/cloudSyncStatus';
import { getCurrentUser } from './auth';
import { getSupabaseClient } from './supabase';

type CloudRecordType =
  | 'workout'
  | 'routine'
  | 'custom_exercise'
  | 'progress_photo'
  | 'settings'
  | 'training_split'
  | 'favorite_exercise'
  | 'fitness_goal'
  | 'body_measurement'
  | 'wellness_check_in'
  | 'nutrition_targets'
  | 'daily_nutrition_log'
  | 'saved_meal_preset'
  | 'custom_nutrition_food';

interface CloudBackupRecord {
  user_id: string;
  record_type: CloudRecordType;
  local_id: string;
  payload: Json;
  updated_at: string;
  deleted_at: string | null;
}

export interface CloudBackupResult {
  ok: boolean;
  message: string;
  recordCount: number;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function buildRecord(
  userId: string,
  recordType: CloudRecordType,
  localId: string,
  payload: unknown,
  updatedAt: string
): CloudBackupRecord {
  return {
    user_id: userId,
    record_type: recordType,
    local_id: localId,
    payload: toJson(payload),
    updated_at: updatedAt,
    deleted_at: null,
  };
}

export async function backupLocalDataToCloud(): Promise<CloudBackupResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
      recordCount: 0,
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: 'Sign in before backing up data.',
      recordCount: 0,
    };
  }

  const exportPayload = await buildAppDataExport();
  const now = new Date().toISOString();
  const records: CloudBackupRecord[] = [
    buildRecord(user.id, 'settings', 'settings', exportPayload.settings, now),
    buildRecord(
      user.id,
      'training_split',
      'training_split_plan',
      exportPayload.trainingSplitPlan,
      exportPayload.trainingSplitPlan.updatedAt || now
    ),
    buildRecord(
      user.id,
      'favorite_exercise',
      'favorite_exercise_ids',
      exportPayload.favoriteExerciseIds,
      now
    ),
    ...exportPayload.fitnessGoals.map((goal) =>
      buildRecord(user.id, 'fitness_goal', goal.id, goal, goal.createdAt || now)
    ),
    ...exportPayload.bodyMeasurements.map((measurement) =>
      buildRecord(
        user.id,
        'body_measurement',
        measurement.id,
        measurement,
        measurement.measuredAt || now
      )
    ),
    ...exportPayload.wellnessCheckIns.map((checkIn) =>
      buildRecord(
        user.id,
        'wellness_check_in',
        checkIn.id,
        checkIn,
        checkIn.checkedInAt || now
      )
    ),
    buildRecord(
      user.id,
      'nutrition_targets',
      'nutrition_targets',
      exportPayload.nutritionTargets,
      exportPayload.nutritionTargets.updatedAt || now
    ),
    ...exportPayload.dailyNutritionLogs.map((log) =>
      buildRecord(
        user.id,
        'daily_nutrition_log',
        log.id,
        log,
        log.loggedAt || now
      )
    ),
    ...exportPayload.savedMealPresets.map((meal) =>
      buildRecord(
        user.id,
        'saved_meal_preset',
        meal.id,
        meal,
        meal.createdAt || now
      )
    ),
    ...exportPayload.customNutritionFoods.map((food) =>
      buildRecord(
        user.id,
        'custom_nutrition_food',
        food.id,
        food,
        food.createdAt || now
      )
    ),
    ...exportPayload.workouts.map((workout) =>
      buildRecord(
        user.id,
        'workout',
        workout.id,
        workout,
        workout.completedAt || now
      )
    ),
    ...exportPayload.routines.map((routine) =>
      buildRecord(
        user.id,
        'routine',
        routine.id,
        routine,
        routine.createdAt || now
      )
    ),
    ...exportPayload.customExercises.map((exercise) =>
      buildRecord(user.id, 'custom_exercise', exercise.id, exercise, now)
    ),
    ...exportPayload.progressPhotos.map((photo) =>
      buildRecord(
        user.id,
        'progress_photo',
        photo.id,
        photo,
        photo.createdAt || now
      )
    ),
  ];

  const { error } = await supabase
    .from('cloud_records')
    .upsert(records, {
      onConflict: 'user_id,record_type,local_id',
    });

  if (error) {
    return {
      ok: false,
      message: error.message,
      recordCount: 0,
    };
  }

  const message = `Backed up ${records.length} local record${
    records.length === 1 ? '' : 's'
  } to Supabase.`;

  await markCloudBackupComplete(records.length, message);

  return {
    ok: true,
    message,
    recordCount: records.length,
  };
}
