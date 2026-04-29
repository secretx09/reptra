import { saveCustomExercises } from '../storage/customExercises';
import { saveFavoriteExerciseIds } from '../storage/favoriteExercises';
import { saveProgressPhotos } from '../storage/progressPhotos';
import { saveRoutines } from '../storage/routines';
import { saveSettings } from '../storage/settings';
import { saveWorkouts } from '../storage/workouts';
import { markCloudRestoreComplete } from '../storage/cloudSyncStatus';
import { Exercise } from '../types/exercise';
import { ProgressPhoto } from '../types/progressPhoto';
import { RoutineWithExercises } from '../types/routine';
import { AppSettings } from '../types/settings';
import { SavedWorkoutSession } from '../types/workout';
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
    favoriteExercises: number;
  };
}

export interface CloudRestoreResult {
  ok: boolean;
  message: string;
  recordCount: number;
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
        favoriteExercises: 0,
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
      favoriteExercises: records.filter(
        (record) => record.record_type === 'favorite_exercise'
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

  if (settingsRecord) {
    await saveSettings(fromJson<AppSettings>(settingsRecord.payload));
  }

  if (favoritesRecord) {
    await saveFavoriteExerciseIds(fromJson<string[]>(favoritesRecord.payload));
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
