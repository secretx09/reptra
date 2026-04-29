import AsyncStorage from '@react-native-async-storage/async-storage';
import { CloudSyncStatus } from '../types/cloudSync';

const CLOUD_SYNC_STATUS_KEY = 'cloudSyncStatus';

export const defaultCloudSyncStatus: CloudSyncStatus = {
  lastBackupAt: null,
  lastRestoreAt: null,
  lastBackupRecordCount: 0,
  lastRestoreRecordCount: 0,
  lastMessage: null,
};

export async function loadCloudSyncStatus(): Promise<CloudSyncStatus> {
  try {
    const data = await AsyncStorage.getItem(CLOUD_SYNC_STATUS_KEY);

    if (!data) {
      return defaultCloudSyncStatus;
    }

    const parsed = JSON.parse(data) as Partial<CloudSyncStatus>;

    return {
      lastBackupAt: parsed.lastBackupAt ?? null,
      lastRestoreAt: parsed.lastRestoreAt ?? null,
      lastBackupRecordCount: Number(parsed.lastBackupRecordCount) || 0,
      lastRestoreRecordCount: Number(parsed.lastRestoreRecordCount) || 0,
      lastMessage: parsed.lastMessage ?? null,
    };
  } catch (error) {
    console.error('Failed to load cloud sync status:', error);
    return defaultCloudSyncStatus;
  }
}

export async function saveCloudSyncStatus(status: CloudSyncStatus) {
  try {
    await AsyncStorage.setItem(CLOUD_SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Failed to save cloud sync status:', error);
  }
}

export async function markCloudBackupComplete(recordCount: number, message: string) {
  const currentStatus = await loadCloudSyncStatus();

  await saveCloudSyncStatus({
    ...currentStatus,
    lastBackupAt: new Date().toISOString(),
    lastBackupRecordCount: recordCount,
    lastMessage: message,
  });
}

export async function markCloudRestoreComplete(
  recordCount: number,
  message: string
) {
  const currentStatus = await loadCloudSyncStatus();

  await saveCloudSyncStatus({
    ...currentStatus,
    lastRestoreAt: new Date().toISOString(),
    lastRestoreRecordCount: recordCount,
    lastMessage: message,
  });
}

export async function markCloudDeleteComplete(message: string) {
  const currentStatus = await loadCloudSyncStatus();

  await saveCloudSyncStatus({
    ...currentStatus,
    lastMessage: message,
  });
}
