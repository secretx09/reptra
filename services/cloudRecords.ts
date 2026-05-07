import { markCloudDeleteComplete } from '../storage/cloudSyncStatus';
import { Database, Json } from '../types/supabase';
import { getCurrentUser } from './auth';
import { getSupabaseClient } from './supabase';

type CloudRecord = Database['public']['Tables']['cloud_records']['Row'];

export interface CloudRecordDetail {
  id: string;
  localId: string;
  recordType: CloudRecord['record_type'];
  title: string;
  updatedAt: string;
}

export interface CloudRecordsResult {
  ok: boolean;
  message: string;
  records: CloudRecordDetail[];
}

export interface CloudDeleteResult {
  ok: boolean;
  message: string;
  deletedCount: number;
}

function fromJson(value: Json): Record<string, unknown> | unknown[] | null {
  return JSON.parse(JSON.stringify(value)) as
    | Record<string, unknown>
    | unknown[]
    | null;
}

function getStringField(value: unknown, field: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const fieldValue = (value as Record<string, unknown>)[field];
  return typeof fieldValue === 'string' && fieldValue.trim()
    ? fieldValue
    : null;
}

function getRecordTitle(record: CloudRecord) {
  const payload = fromJson(record.payload);

  if (record.record_type === 'favorite_exercise') {
    return 'Favorite exercises';
  }

  if (record.record_type === 'fitness_goal') {
    return getStringField(payload, 'title') || 'Training goal';
  }

  if (record.record_type === 'body_measurement') {
    return 'Body check-in';
  }

  if (record.record_type === 'settings') {
    return 'App settings';
  }

  if (record.record_type === 'training_split') {
    return 'Weekly training split';
  }

  return (
    getStringField(payload, 'routineName') ||
    getStringField(payload, 'name') ||
    getStringField(payload, 'exerciseName') ||
    getStringField(payload, 'note') ||
    record.local_id
  );
}

function getRecordTypeLabel(recordType: CloudRecord['record_type']) {
  switch (recordType) {
    case 'custom_exercise':
      return 'Custom Exercise';
    case 'favorite_exercise':
      return 'Favorites';
    case 'fitness_goal':
      return 'Fitness Goal';
    case 'body_measurement':
      return 'Body Measurement';
    case 'progress_photo':
      return 'Progress Photo';
    case 'routine':
      return 'Routine';
    case 'settings':
      return 'Settings';
    case 'training_split':
      return 'Training Split';
    case 'workout':
      return 'Workout';
    default:
      return 'Record';
  }
}

export function formatCloudRecordType(recordType: CloudRecord['record_type']) {
  return getRecordTypeLabel(recordType);
}

export async function getCloudRecordDetails(): Promise<CloudRecordsResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
      records: [],
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: 'Sign in before reading cloud records.',
      records: [],
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
      records: [],
    };
  }

  const records = (data ?? []).map((record) => ({
    id: record.id,
    localId: record.local_id,
    recordType: record.record_type,
    title: getRecordTitle(record),
    updatedAt: record.updated_at,
  }));

  return {
    ok: true,
    message:
      records.length === 0
        ? 'No cloud records found yet.'
        : `Loaded ${records.length} cloud record${
            records.length === 1 ? '' : 's'
          }.`,
    records,
  };
}

export async function deleteAllCloudRecords(): Promise<CloudDeleteResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
      deletedCount: 0,
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: 'Sign in before deleting cloud records.',
      deletedCount: 0,
    };
  }

  const existingRecords = await getCloudRecordDetails();
  const { error } = await supabase
    .from('cloud_records')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    return {
      ok: false,
      message: error.message,
      deletedCount: 0,
    };
  }

  const deletedCount = existingRecords.records.length;
  const message = `Deleted ${deletedCount} cloud backup record${
    deletedCount === 1 ? '' : 's'
  }. Local data on this device was not changed.`;

  await markCloudDeleteComplete(message);

  return {
    ok: true,
    message,
    deletedCount,
  };
}
