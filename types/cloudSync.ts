export interface CloudSyncStatus {
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
  lastBackupRecordCount: number;
  lastRestoreRecordCount: number;
  lastMessage: string | null;
}
