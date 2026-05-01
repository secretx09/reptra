export interface CloudSyncStatus {
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
  lastMergeAt: string | null;
  lastBackupRecordCount: number;
  lastRestoreRecordCount: number;
  lastMergeRecordCount: number;
  lastMessage: string | null;
}
