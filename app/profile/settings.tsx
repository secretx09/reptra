import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Share,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { defaultSettings, loadSettings, saveSettings } from '../../storage/settings';
import { loadCustomExercises } from '../../storage/customExercises';
import { loadBodyMeasurements } from '../../storage/bodyMeasurements';
import { loadFavoriteExerciseIds } from '../../storage/favoriteExercises';
import { loadProgressPhotos } from '../../storage/progressPhotos';
import { loadRoutines } from '../../storage/routines';
import { loadWorkouts } from '../../storage/workouts';
import { AppSettings, AppTheme, WeightUnit } from '../../types/settings';
import { buildAppDataExport } from '../../utils/exportAppData';
import { resetAppData } from '../../utils/resetAppData';
import { formatRestTimerLabel, parseRestTimerInput } from '../../utils/restTimer';
import { isSupabaseConfigured } from '../../services/supabase';
import { getCurrentUser } from '../../services/auth';
import { loadCloudSyncStatus } from '../../storage/cloudSyncStatus';
import { CloudSyncStatus } from '../../types/cloudSync';
import { getCloudBackupSummary } from '../../services/cloudRestore';

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

export default function ProfileSettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] =
    useState<CloudSyncStatus | null>(null);
  const [cloudRecordCount, setCloudRecordCount] = useState(0);
  const [dataSnapshot, setDataSnapshot] = useState({
    workouts: 0,
    routines: 0,
    customExercises: 0,
    progressPhotos: 0,
    favoriteExercises: 0,
    bodyMeasurements: 0,
    lastWorkoutLabel: 'No workouts yet',
  });
  const [defaultRestTimerInput, setDefaultRestTimerInput] = useState(
    defaultSettings.defaultRestTimerSeconds.toString()
  );

  useFocusEffect(
    useCallback(() => {
      const fetchSettings = async () => {
        const savedSettings = await loadSettings();
        const [
          savedWorkouts,
          savedRoutines,
          savedCustomExercises,
          savedPhotos,
          savedFavoriteIds,
          savedBodyMeasurements,
        ] = await Promise.all([
          loadWorkouts(),
          loadRoutines(),
          loadCustomExercises(),
          loadProgressPhotos(),
          loadFavoriteExerciseIds(),
          loadBodyMeasurements(),
        ]);
        const latestWorkout = savedWorkouts[0];
        const currentUser = await getCurrentUser();
        const syncStatus = await loadCloudSyncStatus();
        const cloudSummary = currentUser ? await getCloudBackupSummary() : null;

        setSettings(savedSettings);
        setAccountEmail(currentUser?.email ?? null);
        setCloudSyncStatus(syncStatus);
        setCloudRecordCount(cloudSummary?.totalRecords ?? 0);
        setDefaultRestTimerInput(savedSettings.defaultRestTimerSeconds.toString());
        setDataSnapshot({
          workouts: savedWorkouts.length,
          routines: savedRoutines.length,
          customExercises: savedCustomExercises.length,
          progressPhotos: savedPhotos.length,
          favoriteExercises: savedFavoriteIds.length,
          bodyMeasurements: savedBodyMeasurements.length,
          lastWorkoutLabel: latestWorkout
            ? new Date(latestWorkout.completedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'No workouts yet',
        });
      };

      fetchSettings();
    }, [])
  );

  const handleUpdateWeightUnit = async (weightUnit: WeightUnit) => {
    const nextSettings = {
      ...settings,
      weightUnit,
    };

    setSettings(nextSettings);
    await saveSettings(nextSettings);
  };

  const handleUpdateTheme = async (theme: AppTheme) => {
    const nextSettings = {
      ...settings,
      theme,
    };

    setSettings(nextSettings);
    await saveSettings(nextSettings);
  };

  const handleToggleAutoBackupAfterWorkout = async () => {
    const nextSettings = {
      ...settings,
      autoBackupAfterWorkout: !settings.autoBackupAfterWorkout,
    };

    setSettings(nextSettings);
    await saveSettings(nextSettings);
  };

  const handleSaveDefaultRestTimer = async () => {
    const parsedValue = parseRestTimerInput(defaultRestTimerInput);

    if (!parsedValue) {
      Alert.alert(
        'Invalid default timer',
        'Enter a rest time like `90` or `1:30`.'
      );
      return;
    }

    const nextSettings = {
      ...settings,
      defaultRestTimerSeconds: parsedValue,
    };

    setSettings(nextSettings);
    setDefaultRestTimerInput(parsedValue.toString());
    await saveSettings(nextSettings);
    Alert.alert('Saved', 'Your default rest timer has been updated.');
  };

  const handleExportData = async () => {
    try {
      const exportPayload = await buildAppDataExport();
      const exportJson = JSON.stringify(exportPayload, null, 2);

      await Share.share({
        title: 'Reptra Export',
        message: exportJson,
      });
    } catch {
      Alert.alert(
        'Export failed',
        'We could not prepare your export right now. Please try again.'
      );
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset all data?',
      'This will permanently remove your workouts, routines, progress photos, custom exercises, and settings from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAppData();
              setSettings(defaultSettings);
              setDefaultRestTimerInput(
                defaultSettings.defaultRestTimerSeconds.toString()
              );
              Alert.alert(
                'Data reset',
                'All local Reptra data has been cleared from this device.'
              );
            } catch {
              Alert.alert(
                'Reset failed',
                'We could not clear your local data right now. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize how Reptra feels as you train.</Text>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Cloud Sync</Text>
            <Text style={styles.sectionDescription}>
              Supabase is being added safely while local storage keeps working.
            </Text>

            <View
              style={[
                styles.backendStatusCard,
                isSupabaseConfigured() && styles.backendStatusCardReady,
              ]}
            >
              <Text
                style={[
                  styles.backendStatusTitle,
                  isSupabaseConfigured() && styles.backendStatusTitleReady,
                ]}
              >
                {isSupabaseConfigured()
                  ? 'Supabase Configured'
                  : 'Supabase Not Connected Yet'}
              </Text>
              <Text style={styles.backendStatusText}>
                {isSupabaseConfigured()
                  ? accountEmail
                    ? `Signed in as ${accountEmail}. Manual backup and restore are ready.`
                    : 'Supabase is configured. Sign in to prepare for cloud sync.'
                  : 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your local env file when your project is ready.'}
              </Text>
            </View>

            <View style={styles.syncMiniCard}>
              <View style={styles.syncMiniRow}>
                <Text style={styles.syncMiniLabel}>Cloud records</Text>
                <Text style={styles.syncMiniValue}>{cloudRecordCount}</Text>
              </View>
              <View style={styles.syncMiniRow}>
                <Text style={styles.syncMiniLabel}>Last backup</Text>
                <Text style={styles.syncMiniValue}>
                  {formatDateTime(cloudSyncStatus?.lastBackupAt ?? null)}
                </Text>
              </View>
              <View style={styles.syncMiniRow}>
                <Text style={styles.syncMiniLabel}>Last restore</Text>
                <Text style={styles.syncMiniValue}>
                  {formatDateTime(cloudSyncStatus?.lastRestoreAt ?? null)}
                </Text>
              </View>
              <View style={styles.syncMiniRow}>
                <Text style={styles.syncMiniLabel}>Last merge</Text>
                <Text style={styles.syncMiniValue}>
                  {formatDateTime(cloudSyncStatus?.lastMergeAt ?? null)}
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.autoBackupButton,
                settings.autoBackupAfterWorkout && styles.autoBackupButtonActive,
              ]}
              onPress={handleToggleAutoBackupAfterWorkout}
            >
              <View style={styles.autoBackupTextColumn}>
                <Text
                  style={[
                    styles.autoBackupTitle,
                    settings.autoBackupAfterWorkout &&
                      styles.autoBackupTitleActive,
                  ]}
                >
                  Auto-backup after workouts
                </Text>
                <Text style={styles.autoBackupDescription}>
                  {settings.autoBackupAfterWorkout
                    ? 'On. Finished workouts will try to back up when you are signed in.'
                    : 'Off. Use manual backup from the Account screen.'}
                </Text>
              </View>
              <Text
                style={[
                  styles.autoBackupPill,
                  settings.autoBackupAfterWorkout && styles.autoBackupPillActive,
                ]}
              >
                {settings.autoBackupAfterWorkout ? 'On' : 'Off'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.accountButton}
              onPress={() => router.push('/account' as never)}
            >
              <Text style={styles.accountButtonText}>
                {accountEmail ? 'Manage Account' : 'Open Account'}
              </Text>
            </Pressable>

            {accountEmail ? (
              <Pressable
                style={styles.cloudRecordsButton}
                onPress={() => router.push('/account/cloud-records' as never)}
              >
                <Text style={styles.cloudRecordsButtonText}>
                  View Cloud Records
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Units</Text>
            <Text style={styles.sectionDescription}>
              Choose how weight is labeled throughout workouts, routines, PRs, and history.
            </Text>

            <View style={styles.optionsColumn}>
              <Pressable
                style={[
                  styles.optionButton,
                  settings.weightUnit === 'lb' && styles.optionButtonSelected,
                ]}
                onPress={() => handleUpdateWeightUnit('lb')}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    settings.weightUnit === 'lb' && styles.optionButtonTextSelected,
                  ]}
                >
                  Pounds (lb)
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  settings.weightUnit === 'kg' && styles.optionButtonSelected,
                ]}
                onPress={() => handleUpdateWeightUnit('kg')}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    settings.weightUnit === 'kg' && styles.optionButtonTextSelected,
                  ]}
                >
                  Kilograms (kg)
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Default Rest Timer</Text>
            <Text style={styles.sectionDescription}>
              This is the default rest time used when you turn a timer on for an exercise.
            </Text>

            <View style={styles.defaultTimerSummary}>
              <Text style={styles.defaultTimerSummaryLabel}>Current default</Text>
              <Text style={styles.defaultTimerSummaryValue}>
                {formatRestTimerLabel(settings.defaultRestTimerSeconds)}
              </Text>
            </View>

            <TextInput
              style={styles.defaultTimerInput}
              placeholder="e.g. 90 or 1:30"
              placeholderTextColor="#777777"
              value={defaultRestTimerInput}
              onChangeText={setDefaultRestTimerInput}
            />

            <Pressable
              style={styles.savePresetButton}
              onPress={handleSaveDefaultRestTimer}
            >
              <Text style={styles.savePresetButtonText}>Save Default Timer</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <Text style={styles.sectionDescription}>
              Pick the dark style you want across the app chrome and main screens.
            </Text>

            <View style={styles.optionsColumn}>
              <Pressable
                style={[
                  styles.optionButton,
                  settings.theme === 'graphite' && styles.optionButtonSelected,
                ]}
                onPress={() => handleUpdateTheme('graphite')}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    settings.theme === 'graphite' && styles.optionButtonTextSelected,
                  ]}
                >
                  Graphite
                </Text>
                <Text style={styles.optionHelperText}>
                  The current Reptra look with a charcoal dark background.
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  settings.theme === 'midnight' && styles.optionButtonSelected,
                ]}
                onPress={() => handleUpdateTheme('midnight')}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    settings.theme === 'midnight' && styles.optionButtonTextSelected,
                  ]}
                >
                  Midnight
                </Text>
                <Text style={styles.optionHelperText}>
                  A darker black-based look with slightly icier blue accents.
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Data</Text>
            <Text style={styles.sectionDescription}>
              Export your local Reptra data as a JSON backup you can save or send.
            </Text>

            <View style={styles.dataSnapshotCard}>
              <Text style={styles.dataSnapshotTitle}>Local Data Snapshot</Text>
              <View style={styles.dataSnapshotGrid}>
                <View style={styles.dataSnapshotItem}>
                  <Text style={styles.dataSnapshotValue}>
                    {dataSnapshot.workouts}
                  </Text>
                  <Text style={styles.dataSnapshotLabel}>Workouts</Text>
                </View>
                <View style={styles.dataSnapshotItem}>
                  <Text style={styles.dataSnapshotValue}>
                    {dataSnapshot.routines}
                  </Text>
                  <Text style={styles.dataSnapshotLabel}>Routines</Text>
                </View>
                <View style={styles.dataSnapshotItem}>
                  <Text style={styles.dataSnapshotValue}>
                    {dataSnapshot.customExercises}
                  </Text>
                  <Text style={styles.dataSnapshotLabel}>Custom</Text>
                </View>
                <View style={styles.dataSnapshotItem}>
                  <Text style={styles.dataSnapshotValue}>
                    {dataSnapshot.progressPhotos}
                  </Text>
                  <Text style={styles.dataSnapshotLabel}>Photos</Text>
                </View>
              </View>
              <Text style={styles.dataSnapshotFooter}>
                Favorites: {dataSnapshot.favoriteExercises} | Body:{' '}
                {dataSnapshot.bodyMeasurements} | Last workout:{' '}
                {dataSnapshot.lastWorkoutLabel}
              </Text>
            </View>

            <Pressable style={styles.exportButton} onPress={handleExportData}>
              <Text style={styles.exportButtonText}>Export Data</Text>
            </Pressable>

            <Pressable
              style={styles.importButton}
              onPress={() => router.push('/profile/import-data')}
            >
              <Text style={styles.importButtonText}>Import Data</Text>
            </Pressable>

            <Pressable style={styles.resetButton} onPress={handleResetData}>
              <Text style={styles.resetButtonText}>Reset All Data</Text>
            </Pressable>

            <Text style={styles.resetWarningText}>
              This clears all local data on this device. Export first if you want a backup.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 15,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionDescription: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  backendStatusCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  backendStatusCardReady: {
    backgroundColor: '#101c29',
    borderColor: '#294969',
  },
  backendStatusTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  backendStatusTitleReady: {
    color: '#4da6ff',
  },
  backendStatusText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
  },
  syncMiniCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  syncMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 6,
  },
  syncMiniLabel: {
    color: '#aaaaaa',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  syncMiniValue: {
    color: '#ffffff',
    flex: 1.2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  autoBackupButton: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 12,
  },
  autoBackupButtonActive: {
    backgroundColor: '#101c29',
    borderColor: '#294969',
  },
  autoBackupTextColumn: {
    flex: 1,
  },
  autoBackupTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  autoBackupTitleActive: {
    color: '#4da6ff',
  },
  autoBackupDescription: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
  },
  autoBackupPill: {
    backgroundColor: '#1c1c1c',
    borderRadius: 999,
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  autoBackupPillActive: {
    backgroundColor: '#16324d',
    color: '#4da6ff',
  },
  accountButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  accountButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  cloudRecordsButton: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 13,
  },
  cloudRecordsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  optionsColumn: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionButtonSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  optionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  optionButtonTextSelected: {
    color: '#4da6ff',
  },
  optionHelperText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  defaultTimerSummary: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  defaultTimerSummaryLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  defaultTimerSummaryValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  defaultTimerInput: {
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  savePresetButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  savePresetButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  dataSnapshotCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  dataSnapshotTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  dataSnapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  dataSnapshotItem: {
    width: '48%',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dataSnapshotValue: {
    color: '#4da6ff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  dataSnapshotLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '600',
  },
  dataSnapshotFooter: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
  },
  exportButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  exportButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  importButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ff8a8a',
    fontSize: 14,
    fontWeight: '700',
  },
  resetWarningText: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});
