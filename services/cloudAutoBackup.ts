import { loadSettings } from '../storage/settings';
import { getCurrentUser } from './auth';
import { backupLocalDataToCloud } from './cloudBackup';
import { isSupabaseConfigured } from './supabase';

export async function backupAfterWorkoutIfEnabled() {
  try {
    const settings = await loadSettings();

    if (!settings.autoBackupAfterWorkout || !isSupabaseConfigured()) {
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    await backupLocalDataToCloud();
  } catch (error) {
    console.error('Auto backup after workout failed:', error);
  }
}
