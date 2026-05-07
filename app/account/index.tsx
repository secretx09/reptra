import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '@supabase/supabase-js';
import {
  exchangeAuthLinkForSession,
  getCurrentUser,
  getAuthRedirectUrl,
  resendConfirmationEmail,
  sendPasswordResetEmail,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  testSupabaseConnection,
  updateCurrentUserPassword,
} from '../../services/auth';
import { isSupabaseConfigured } from '../../services/supabase';
import { backupLocalDataToCloud } from '../../services/cloudBackup';
import {
  CloudBackupSummary,
  getCloudBackupSummary,
  mergeCloudDataIntoLocal,
  restoreCloudDataToLocal,
} from '../../services/cloudRestore';
import {
  checkUsernameAvailability,
  CloudProfile,
  getCloudProfile,
  updateCloudProfile,
} from '../../services/cloudProfile';
import { loadCloudSyncStatus } from '../../storage/cloudSyncStatus';
import { CloudSyncStatus } from '../../types/cloudSync';
import { loadCustomExercises } from '../../storage/customExercises';
import { loadBodyMeasurements } from '../../storage/bodyMeasurements';
import { loadFavoriteExerciseIds } from '../../storage/favoriteExercises';
import { loadFitnessGoals } from '../../storage/fitnessGoals';
import { loadProgressPhotos } from '../../storage/progressPhotos';
import { loadRoutines } from '../../storage/routines';
import { loadSettings } from '../../storage/settings';
import { loadWorkouts } from '../../storage/workouts';

type AuthMode = 'signIn' | 'signUp';

interface LocalCloudPreview {
  workouts: number;
  routines: number;
  customExercises: number;
  progressPhotos: number;
  favoriteExercises: number;
  fitnessGoals: number;
  bodyMeasurements: number;
  settings: number;
  totalRecords: number;
}

const emptyLocalPreview: LocalCloudPreview = {
  workouts: 0,
  routines: 0,
  customExercises: 0,
  progressPhotos: 0,
  favoriteExercises: 0,
  fitnessGoals: 0,
  bodyMeasurements: 0,
  settings: 1,
  totalRecords: 1,
};

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

function getSyncComparison(
  localPreview: LocalCloudPreview,
  cloudSummary: CloudBackupSummary | null
) {
  if (!cloudSummary) {
    return {
      title: 'Cloud comparison unavailable',
      message: 'Refresh your cloud summary to compare local and cloud data.',
    };
  }

  const cloudTotal = cloudSummary.totalRecords;
  const localTotal = localPreview.totalRecords;

  if (cloudTotal === 0) {
    return {
      title: 'Cloud backup empty',
      message: 'Run Backup Local Data to create your first Supabase backup.',
    };
  }

  if (cloudTotal === localTotal) {
    return {
      title: 'Counts look matched',
      message:
        'Local and cloud record counts match. This is a good quick sync sanity check.',
    };
  }

  if (localTotal > cloudTotal) {
    return {
      title: 'Local has more records',
      message:
        'Backup Local Data will push the extra local records to Supabase.',
    };
  }

  return {
    title: 'Cloud has more records',
    message:
      'Merge Cloud Into This Device can add missing cloud records without replacing local data.',
  };
}

function getProfileCompletionItems(
  user: User | null,
  profile: CloudProfile | null
) {
  const items = [
    {
      label: 'Email confirmed',
      isComplete: Boolean(user?.email_confirmed_at),
    },
    {
      label: 'Display name',
      isComplete: Boolean(profile?.display_name),
    },
    {
      label: 'Username',
      isComplete: Boolean(profile?.username),
    },
    {
      label: 'Bio',
      isComplete: Boolean(profile?.bio),
    },
    {
      label: 'Training focus',
      isComplete: Boolean(profile?.training_focus),
    },
    {
      label: 'Cloud profile saved',
      isComplete: Boolean(profile?.updated_at),
    },
  ];
  const completedCount = items.filter((item) => item.isComplete).length;

  return {
    items,
    completedCount,
    totalCount: items.length,
  };
}

export default function AccountScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [backupStatus, setBackupStatus] = useState('');
  const [cloudSummary, setCloudSummary] = useState<CloudBackupSummary | null>(
    null
  );
  const [localPreview, setLocalPreview] =
    useState<LocalCloudPreview>(emptyLocalPreview);
  const [cloudSyncStatus, setCloudSyncStatus] =
    useState<CloudSyncStatus | null>(null);
  const [cloudProfile, setCloudProfile] = useState<CloudProfile | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileTrainingFocus, setProfileTrainingFocus] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityStatus, setSecurityStatus] = useState('');
  const [authEmailStatus, setAuthEmailStatus] = useState('');
  const [manualAuthLink, setManualAuthLink] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [mergeStatus, setMergeStatus] = useState('');
  const authRedirectUrl = getAuthRedirectUrl();
  const syncComparison = getSyncComparison(localPreview, cloudSummary);
  const profileCompletion = getProfileCompletionItems(currentUser, cloudProfile);
  const cleanProfileUsername = profileUsername.trim().toLowerCase();

  const fetchLocalPreview = useCallback(async () => {
    const [
      settings,
      workouts,
      routines,
      customExercises,
      progressPhotos,
      favoriteExerciseIds,
      fitnessGoals,
      bodyMeasurements,
    ] = await Promise.all([
      loadSettings(),
      loadWorkouts(),
      loadRoutines(),
      loadCustomExercises(),
      loadProgressPhotos(),
      loadFavoriteExerciseIds(),
      loadFitnessGoals(),
      loadBodyMeasurements(),
    ]);

    setLocalPreview({
      workouts: workouts.length,
      routines: routines.length,
      customExercises: customExercises.length,
      progressPhotos: progressPhotos.length,
      favoriteExercises: favoriteExerciseIds.length,
      fitnessGoals: fitnessGoals.length,
      bodyMeasurements: bodyMeasurements.length,
      settings: settings ? 1 : 0,
      totalRecords:
        workouts.length +
        routines.length +
        customExercises.length +
        progressPhotos.length +
        fitnessGoals.length +
        bodyMeasurements.length +
        2,
    });
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    await fetchLocalPreview();
    const syncStatus = await loadCloudSyncStatus();
    const user = await getCurrentUser();

    setCloudSyncStatus(syncStatus);
    setCurrentUser(user);

    if (user) {
      const [summary, profileResult] = await Promise.all([
        getCloudBackupSummary(),
        getCloudProfile(),
      ]);
      setCloudSummary(summary);
      setCloudProfile(profileResult.profile);
      setProfileDisplayName(profileResult.profile?.display_name ?? '');
      setProfileUsername(profileResult.profile?.username ?? '');
      setProfileBio(profileResult.profile?.bio ?? '');
      setProfileTrainingFocus(profileResult.profile?.training_focus ?? '');
    } else {
      setCloudSummary(null);
      setCloudProfile(null);
      setProfileDisplayName('');
      setProfileUsername('');
      setProfileBio('');
      setProfileTrainingFocus('');
    }
  }, [fetchLocalPreview]);

  useFocusEffect(
    useCallback(() => {
      fetchCurrentUser();
    }, [fetchCurrentUser])
  );

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      Alert.alert('Missing info', 'Enter an email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const result =
      authMode === 'signIn'
        ? await signInWithEmail(trimmedEmail, password)
        : await signUpWithEmail(trimmedEmail, password, displayName);

    setIsLoading(false);

    if (!result.ok) {
      Alert.alert('Account error', result.message);
      return;
    }

    await fetchCurrentUser();
    Alert.alert('Account', result.message);
  };

  const handleSendPasswordReset = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Missing email', 'Enter your email first.');
      return;
    }

    setIsLoading(true);
    const result = await sendPasswordResetEmail(trimmedEmail);
    setIsLoading(false);
    setAuthEmailStatus(result.message);

    if (!result.ok) {
      Alert.alert('Password reset failed', result.message);
      return;
    }

    Alert.alert('Password reset', result.message);
  };

  const handleResendConfirmation = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Missing email', 'Enter your email first.');
      return;
    }

    setIsLoading(true);
    const result = await resendConfirmationEmail(trimmedEmail);
    setIsLoading(false);
    setAuthEmailStatus(result.message);

    if (!result.ok) {
      Alert.alert('Confirmation failed', result.message);
      return;
    }

    Alert.alert('Confirmation email', result.message);
  };

  const handleConfirmPastedLink = async () => {
    const trimmedLink = manualAuthLink.trim();

    if (!trimmedLink) {
      Alert.alert('Missing link', 'Paste the full email link first.');
      return;
    }

    setIsLoading(true);
    setAuthEmailStatus('Checking pasted auth link...');
    const result = await exchangeAuthLinkForSession(trimmedLink);
    setIsLoading(false);
    setAuthEmailStatus(result.message);

    if (!result.ok) {
      Alert.alert('Auth link failed', result.message);
      return;
    }

    setManualAuthLink('');
    await fetchCurrentUser();
    Alert.alert('Auth link confirmed', result.message);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setSecurityStatus('Updating password...');
    const result = await updateCurrentUserPassword(newPassword);
    setIsLoading(false);
    setSecurityStatus(result.message);

    if (!result.ok) {
      Alert.alert('Password update failed', result.message);
      return;
    }

    setNewPassword('');
    Alert.alert('Password updated', result.message);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    const result = await signOut();
    setIsLoading(false);

    if (!result.ok) {
      Alert.alert('Sign out failed', result.message);
      return;
    }

    setCurrentUser(null);
    Alert.alert('Account', result.message);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    const result = await testSupabaseConnection();
    setIsLoading(false);
    setConnectionStatus(result.message);

    if (!result.ok) {
      Alert.alert('Connection issue', result.message);
    }
  };

  const handleBackupLocalData = async () => {
    setIsLoading(true);
    setBackupStatus('Backing up local data...');
    const result = await backupLocalDataToCloud();
    setIsLoading(false);
    setBackupStatus(result.message);

    if (!result.ok) {
      Alert.alert('Backup failed', result.message);
      return;
    }

    const summary = await getCloudBackupSummary();
    const syncStatus = await loadCloudSyncStatus();
    setCloudSummary(summary);
    setCloudSyncStatus(syncStatus);
    Alert.alert('Backup complete', result.message);
  };

  const handleRefreshCloudSummary = async () => {
    setIsLoading(true);
    const summary = await getCloudBackupSummary();
    setIsLoading(false);
    setCloudSummary(summary);

    if (!summary.ok) {
      Alert.alert('Cloud summary failed', summary.message);
    }
  };

  const handleSaveCloudProfile = async () => {
    setIsLoading(true);
    setProfileStatus('Saving cloud profile...');
    const result = await updateCloudProfile(
      profileDisplayName,
      profileUsername,
      profileBio,
      profileTrainingFocus
    );
    setIsLoading(false);
    setProfileStatus(result.message);

    if (!result.ok) {
      Alert.alert('Profile update failed', result.message);
      return;
    }

    setCloudProfile(result.profile);
    Alert.alert('Profile saved', result.message);
  };

  const handleCheckUsername = async () => {
    setIsLoading(true);
    setUsernameStatus('Checking username...');
    const result = await checkUsernameAvailability(profileUsername);
    setIsLoading(false);
    setUsernameStatus(result.message);

    if (!result.ok || !result.available) {
      Alert.alert('Username check', result.message);
    }
  };

  const handleRestoreCloudData = () => {
    Alert.alert(
      'Restore cloud data?',
      'This replaces local workouts, routines, custom exercises, settings, favorites, and progress photo metadata with the current Supabase backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            setRestoreStatus('Restoring cloud data...');
            const result = await restoreCloudDataToLocal();
            const syncStatus = await loadCloudSyncStatus();
            setIsLoading(false);
            setRestoreStatus(result.message);
            setCloudSyncStatus(syncStatus);

            if (!result.ok) {
              Alert.alert('Restore failed', result.message);
              return;
            }

            await fetchLocalPreview();
            Alert.alert('Restore complete', result.message);
          },
        },
      ]
    );
  };

  const handleMergeCloudData = () => {
    Alert.alert(
      'Merge cloud data?',
      'This adds cloud workouts, routines, custom exercises, favorites, and progress photo metadata that are missing on this device. Existing local data will not be replaced.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: async () => {
            setIsLoading(true);
            setMergeStatus('Merging cloud data...');
            const result = await mergeCloudDataIntoLocal();
            const syncStatus = await loadCloudSyncStatus();
            setIsLoading(false);
            setMergeStatus(result.message);
            setCloudSyncStatus(syncStatus);

            if (!result.ok) {
              Alert.alert('Merge failed', result.message);
              return;
            }

            await fetchLocalPreview();
            Alert.alert('Merge complete', result.message);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Account' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.appName}>Reptra</Text>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>
            Manage your login, cloud profile, and manual Supabase backup tools.
            Local workouts still work even if you are signed out.
          </Text>

          <View
            style={[
              styles.statusCard,
              isSupabaseConfigured() && styles.statusCardReady,
            ]}
          >
            <Text
              style={[
                styles.statusTitle,
                isSupabaseConfigured() && styles.statusTitleReady,
              ]}
            >
              {isSupabaseConfigured()
                ? 'Supabase Connected'
                : 'Supabase Not Configured'}
            </Text>
            <Text style={styles.statusText}>
              {isSupabaseConfigured()
                ? 'You can sign up or sign in with your Supabase project.'
                : 'Add your Supabase URL and anon key to a local .env file, then restart Expo.'}
            </Text>

            <Pressable
              style={styles.connectionButton}
              onPress={handleTestConnection}
              disabled={!isSupabaseConfigured() || isLoading}
            >
              <Text style={styles.connectionButtonText}>Test Connection</Text>
            </Pressable>

            {connectionStatus ? (
              <Text style={styles.connectionStatus}>{connectionStatus}</Text>
            ) : null}
          </View>

          <View style={styles.redirectCard}>
            <Text style={styles.redirectTitle}>Auth Redirect</Text>
            <Text style={styles.redirectText}>
              Add this active URL in Supabase Authentication URL Configuration.
              Expo Go links are only for development; installed builds use
              reptra://auth/callback.
            </Text>
            <Text style={styles.redirectUrl}>{authRedirectUrl}</Text>
            <Pressable
              style={styles.setupButton}
              onPress={() => router.push('/account/setup' as never)}
            >
              <Text style={styles.setupButtonText}>Open Setup Checklist</Text>
            </Pressable>
          </View>

          {currentUser ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Signed In</Text>
              <Text style={styles.signedInEmail}>{currentUser.email}</Text>
              <Text style={styles.sectionDescription}>
                Manual sync tools are active. Backup uploads this device, while
                restore replaces this device with the current cloud copy.
              </Text>

              <View style={styles.accountMetaCard}>
                <View style={styles.accountMetaRow}>
                  <Text style={styles.accountMetaLabel}>Email confirmed</Text>
                  <Text style={styles.accountMetaValue}>
                    {currentUser.email_confirmed_at ? 'Yes' : 'Not yet'}
                  </Text>
                </View>
                <View style={styles.accountMetaRow}>
                  <Text style={styles.accountMetaLabel}>Provider</Text>
                  <Text style={styles.accountMetaValue}>
                    {currentUser.app_metadata?.provider || 'email'}
                  </Text>
                </View>
                <View style={styles.accountMetaRow}>
                  <Text style={styles.accountMetaLabel}>Created</Text>
                  <Text style={styles.accountMetaValue}>
                    {formatDateTime(currentUser.created_at)}
                  </Text>
                </View>
                <View style={styles.accountMetaRow}>
                  <Text style={styles.accountMetaLabel}>Last sign in</Text>
                  <Text style={styles.accountMetaValue}>
                    {formatDateTime(currentUser.last_sign_in_at ?? null)}
                  </Text>
                </View>
              </View>

              <View style={styles.profileCompletionCard}>
                <Text style={styles.profileCompletionTitle}>
                  Profile setup {profileCompletion.completedCount}/
                  {profileCompletion.totalCount}
                </Text>
                <Text style={styles.profileCompletionText}>
                  These pieces will matter more later when Reptra adds friends,
                  social feed posts, and searchable profiles.
                </Text>

                {profileCompletion.items.map((item) => (
                  <View key={item.label} style={styles.profileCompletionRow}>
                    <Text
                      style={[
                        styles.profileCompletionDot,
                        item.isComplete && styles.profileCompletionDotDone,
                      ]}
                    >
                      {item.isComplete ? 'Ready' : 'Todo'}
                    </Text>
                    <Text style={styles.profileCompletionLabel}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.backupCard}>
                <Text style={styles.backupTitle}>Account Security</Text>
                <Text style={styles.backupText}>
                  Use this after opening a password reset link, or anytime you
                  are signed in and want to change your password.
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor="#777777"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleUpdatePassword}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Update Password</Text>
                </Pressable>

                {securityStatus ? (
                  <Text style={styles.backupStatus}>{securityStatus}</Text>
                ) : null}
              </View>

              <View style={styles.backupCard}>
                <Text style={styles.backupTitle}>Cloud Profile</Text>
                <Text style={styles.backupText}>
                  This is the public-facing profile layer we can reuse later for
                  friends, posts, and social features.
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Display name"
                  placeholderTextColor="#777777"
                  value={profileDisplayName}
                  onChangeText={setProfileDisplayName}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#777777"
                  autoCapitalize="none"
                  value={profileUsername}
                  onChangeText={setProfileUsername}
                />

                <View style={styles.handlePreviewCard}>
                  <Text style={styles.handlePreviewLabel}>Profile username</Text>
                  <Text style={styles.handlePreviewValue}>
                    {cleanProfileUsername
                      ? `@${cleanProfileUsername}`
                      : '@username'}
                  </Text>
                  <Text style={styles.handlePreviewText}>
                    Later, this can become the username people search for or
                    use when signing in.
                  </Text>
                </View>

                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Bio"
                  placeholderTextColor="#777777"
                  multiline
                  value={profileBio}
                  onChangeText={setProfileBio}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Training focus"
                  placeholderTextColor="#777777"
                  value={profileTrainingFocus}
                  onChangeText={setProfileTrainingFocus}
                />

                <View style={styles.publicProfilePreviewCard}>
                  <Text style={styles.publicProfilePreviewLabel}>
                    Public profile preview
                  </Text>
                  <Text style={styles.publicProfilePreviewName}>
                    {profileDisplayName.trim() || 'Reptra Athlete'}
                  </Text>
                  <Text style={styles.publicProfilePreviewUsername}>
                    {cleanProfileUsername
                      ? `@${cleanProfileUsername}`
                      : '@username'}
                  </Text>
                  <Text style={styles.publicProfilePreviewBio}>
                    {profileBio.trim() ||
                      'Add a short bio so future friends know what you are working toward.'}
                  </Text>
                  <Text style={styles.publicProfilePreviewFocus}>
                    Focus:{' '}
                    {profileTrainingFocus.trim() || 'Not set yet'}
                  </Text>
                </View>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleCheckUsername}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    Check Username
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleSaveCloudProfile}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Save Cloud Profile</Text>
                </Pressable>

                {usernameStatus ? (
                  <Text style={styles.backupStatus}>{usernameStatus}</Text>
                ) : null}

                {cloudProfile?.updated_at ? (
                  <Text style={styles.backupStatus}>
                    Profile updated: {formatDateTime(cloudProfile.updated_at)}
                  </Text>
                ) : null}

                {profileStatus ? (
                  <Text style={styles.backupStatus}>{profileStatus}</Text>
                ) : null}
              </View>

              <View style={styles.backupCard}>
                <Text style={styles.backupTitle}>Sync Status</Text>
                <Text style={styles.backupText}>
                  Reptra is still local-first. These timestamps only track
                  manual backup and restore actions on this device.
                </Text>

                <View style={styles.syncStatusRow}>
                  <Text style={styles.syncStatusLabel}>Last backup</Text>
                  <Text style={styles.syncStatusValue}>
                    {formatDateTime(cloudSyncStatus?.lastBackupAt ?? null)}
                  </Text>
                </View>
                <View style={styles.syncStatusRow}>
                  <Text style={styles.syncStatusLabel}>Backup records</Text>
                  <Text style={styles.syncStatusValue}>
                    {cloudSyncStatus?.lastBackupRecordCount ?? 0}
                  </Text>
                </View>
                <View style={styles.syncStatusRow}>
                  <Text style={styles.syncStatusLabel}>Last restore</Text>
                  <Text style={styles.syncStatusValue}>
                    {formatDateTime(cloudSyncStatus?.lastRestoreAt ?? null)}
                  </Text>
                </View>
                <View style={styles.syncStatusRow}>
                  <Text style={styles.syncStatusLabel}>Last merge</Text>
                  <Text style={styles.syncStatusValue}>
                    {formatDateTime(cloudSyncStatus?.lastMergeAt ?? null)}
                  </Text>
                </View>
                <View style={styles.syncStatusRow}>
                  <Text style={styles.syncStatusLabel}>Restore records</Text>
                  <Text style={styles.syncStatusValue}>
                    {cloudSyncStatus?.lastRestoreRecordCount ?? 0}
                  </Text>
                </View>
                <View style={styles.syncStatusRow}>
                  <Text style={styles.syncStatusLabel}>Merge added</Text>
                  <Text style={styles.syncStatusValue}>
                    {cloudSyncStatus?.lastMergeRecordCount ?? 0}
                  </Text>
                </View>

                {cloudSyncStatus?.lastMessage ? (
                  <Text style={styles.backupStatus}>
                    {cloudSyncStatus.lastMessage}
                  </Text>
                ) : null}
              </View>

              <View style={styles.backupCard}>
                <Text style={styles.backupTitle}>Local Backup Preview</Text>
                <Text style={styles.backupText}>
                  This is what Backup Local Data will upload from this device.
                </Text>

                <View style={styles.cloudSummaryGrid}>
                  <View style={styles.cloudSummaryItem}>
                    <Text style={styles.cloudSummaryValue}>
                      {localPreview.workouts}
                    </Text>
                    <Text style={styles.cloudSummaryLabel}>Workouts</Text>
                  </View>
                  <View style={styles.cloudSummaryItem}>
                    <Text style={styles.cloudSummaryValue}>
                      {localPreview.routines}
                    </Text>
                    <Text style={styles.cloudSummaryLabel}>Routines</Text>
                  </View>
                  <View style={styles.cloudSummaryItem}>
                    <Text style={styles.cloudSummaryValue}>
                      {localPreview.customExercises}
                    </Text>
                    <Text style={styles.cloudSummaryLabel}>Custom</Text>
                  </View>
                  <View style={styles.cloudSummaryItem}>
                    <Text style={styles.cloudSummaryValue}>
                      {localPreview.progressPhotos}
                    </Text>
                    <Text style={styles.cloudSummaryLabel}>Photos</Text>
                  </View>
                </View>

                <Text style={styles.backupStatus}>
                  Favorites: {localPreview.favoriteExercises} | Goals:{' '}
                  {localPreview.fitnessGoals} | Body:{' '}
                  {localPreview.bodyMeasurements} | Settings:{' '}
                  {localPreview.settings} | Total records:{' '}
                  {localPreview.totalRecords}
                </Text>
              </View>

              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>
                  {syncComparison.title}
                </Text>
                <Text style={styles.comparisonText}>
                  {syncComparison.message}
                </Text>
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonValue}>
                      {localPreview.totalRecords}
                    </Text>
                    <Text style={styles.comparisonLabel}>Local</Text>
                  </View>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonValue}>
                      {cloudSummary?.totalRecords ?? 0}
                    </Text>
                    <Text style={styles.comparisonLabel}>Cloud</Text>
                  </View>
                </View>
              </View>

              <View style={styles.backupCard}>
                <Text style={styles.backupTitle}>Cloud Backup</Text>
                <Text style={styles.backupText}>
                  Upload your current local workouts, routines, custom exercises,
                  settings, favorites, and progress photo metadata to Supabase.
                  This does not download or overwrite anything yet.
                </Text>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleBackupLocalData}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    Backup Local Data
                  </Text>
                </Pressable>

                {backupStatus ? (
                  <Text style={styles.backupStatus}>{backupStatus}</Text>
                ) : null}
              </View>

              <View style={styles.backupCard}>
                <Text style={styles.backupTitle}>Cloud Backup Summary</Text>
                <Text style={styles.backupText}>
                  Check what is currently stored in Supabase before restoring.
                </Text>

                {cloudSummary ? (
                  <View style={styles.cloudSummaryGrid}>
                    <View style={styles.cloudSummaryItem}>
                      <Text style={styles.cloudSummaryValue}>
                        {cloudSummary.counts.workouts}
                      </Text>
                      <Text style={styles.cloudSummaryLabel}>Workouts</Text>
                    </View>
                    <View style={styles.cloudSummaryItem}>
                      <Text style={styles.cloudSummaryValue}>
                        {cloudSummary.counts.routines}
                      </Text>
                      <Text style={styles.cloudSummaryLabel}>Routines</Text>
                    </View>
                    <View style={styles.cloudSummaryItem}>
                      <Text style={styles.cloudSummaryValue}>
                        {cloudSummary.counts.customExercises}
                      </Text>
                      <Text style={styles.cloudSummaryLabel}>Custom</Text>
                    </View>
                    <View style={styles.cloudSummaryItem}>
                      <Text style={styles.cloudSummaryValue}>
                        {cloudSummary.counts.progressPhotos}
                      </Text>
                      <Text style={styles.cloudSummaryLabel}>Photos</Text>
                    </View>
                  </View>
                ) : null}

                <Text style={styles.backupStatus}>
                  {cloudSummary?.message ?? 'No cloud summary loaded yet.'}
                </Text>

                {cloudSummary?.lastUpdatedAt ? (
                  <Text style={styles.backupStatus}>
                    Last cloud update:{' '}
                    {new Date(cloudSummary.lastUpdatedAt).toLocaleString()}
                  </Text>
                ) : null}

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleRefreshCloudSummary}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Refresh Summary</Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => router.push('/account/cloud-records' as never)}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    View Cloud Records
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleMergeCloudData}
                  disabled={isLoading || !cloudSummary?.totalRecords}
                >
                  <Text style={styles.secondaryButtonText}>
                    Merge Cloud Into This Device
                  </Text>
                </Pressable>

                {mergeStatus ? (
                  <Text style={styles.backupStatus}>{mergeStatus}</Text>
                ) : null}

                <Pressable
                  style={styles.dangerButton}
                  onPress={handleRestoreCloudData}
                  disabled={isLoading || !cloudSummary?.totalRecords}
                >
                  <Text style={styles.dangerButtonText}>Restore From Cloud</Text>
                </Pressable>

                {restoreStatus ? (
                  <Text style={styles.backupStatus}>{restoreStatus}</Text>
                ) : null}
              </View>

              <Pressable
                style={styles.secondaryButton}
                onPress={fetchCurrentUser}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Refresh Session</Text>
              </Pressable>

              <Pressable
                style={styles.dangerButton}
                onPress={handleSignOut}
                disabled={isLoading}
              >
                <Text style={styles.dangerButtonText}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <View style={styles.modeRow}>
                <Pressable
                  style={[
                    styles.modeButton,
                    authMode === 'signIn' && styles.modeButtonActive,
                  ]}
                  onPress={() => setAuthMode('signIn')}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      authMode === 'signIn' && styles.modeButtonTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modeButton,
                    authMode === 'signUp' && styles.modeButtonActive,
                  ]}
                  onPress={() => setAuthMode('signUp')}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      authMode === 'signUp' && styles.modeButtonTextActive,
                    ]}
                  >
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              {authMode === 'signUp' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Display name"
                  placeholderTextColor="#777777"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              ) : null}

              <View style={styles.usernameFutureCard}>
                <Text style={styles.usernameFutureTitle}>
                  Username sign-in is coming later
                </Text>
                <Text style={styles.usernameFutureText}>
                  For now, Supabase signs in with email and password. Your
                  saved username is still useful for future profiles, friends,
                  and searchable accounts.
                </Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#777777"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#777777"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  (!isSupabaseConfigured() || isLoading) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isSupabaseConfigured() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#111111" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {authMode === 'signIn' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </Pressable>

              <View style={styles.authHelpCard}>
                <Text style={styles.authHelpTitle}>Need help signing in?</Text>
                <Text style={styles.authHelpText}>
                  Enter your email above, then send a reset link or resend your
                  confirmation email. If Expo Go gets stuck opening the link,
                  paste the full email link here instead.
                </Text>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleSendPasswordReset}
                  disabled={!isSupabaseConfigured() || isLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    Send Password Reset
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleResendConfirmation}
                  disabled={!isSupabaseConfigured() || isLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    Resend Confirmation Email
                  </Text>
                </Pressable>

                <TextInput
                  style={[styles.input, styles.authLinkInput]}
                  placeholder="Paste confirmation or reset link"
                  placeholderTextColor="#777777"
                  autoCapitalize="none"
                  multiline
                  value={manualAuthLink}
                  onChangeText={setManualAuthLink}
                />

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleConfirmPastedLink}
                  disabled={!isSupabaseConfigured() || isLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    Confirm Pasted Link
                  </Text>
                </Pressable>

                {authEmailStatus ? (
                  <Text style={styles.backupStatus}>{authEmailStatus}</Text>
                ) : null}
              </View>
            </View>
          )}
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
  appName: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  statusCardReady: {
    backgroundColor: '#101c29',
    borderColor: '#294969',
  },
  statusTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusTitleReady: {
    color: '#4da6ff',
  },
  statusText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
  },
  connectionButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  connectionButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '800',
  },
  connectionStatus: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
  },
  redirectCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  redirectTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  redirectText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  redirectUrl: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  setupButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  setupButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  signedInEmail: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  accountMetaCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  accountMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
    paddingVertical: 8,
  },
  accountMetaLabel: {
    color: '#aaaaaa',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  accountMetaValue: {
    color: '#ffffff',
    flex: 1.4,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  profileCompletionCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  profileCompletionTitle: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  profileCompletionText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  profileCompletionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  profileCompletionDot: {
    backgroundColor: '#2a1111',
    borderRadius: 999,
    color: '#ff8a8a',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  profileCompletionDotDone: {
    backgroundColor: '#16324d',
    color: '#4da6ff',
  },
  profileCompletionLabel: {
    color: '#ffffff',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  backupCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  backupTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  backupText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  backupStatus: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  handlePreviewCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  handlePreviewLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  handlePreviewValue: {
    color: '#4da6ff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  handlePreviewText: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
  },
  publicProfilePreviewCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  publicProfilePreviewLabel: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  publicProfilePreviewName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 3,
  },
  publicProfilePreviewUsername: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  publicProfilePreviewBio: {
    color: '#d6d6d6',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  publicProfilePreviewFocus: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
    paddingVertical: 9,
  },
  syncStatusLabel: {
    color: '#aaaaaa',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  syncStatusValue: {
    color: '#ffffff',
    flex: 1.4,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  cloudSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  cloudSummaryItem: {
    width: '48%',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  cloudSummaryValue: {
    color: '#4da6ff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  cloudSummaryLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
  },
  comparisonCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  comparisonTitle: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  comparisonText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  comparisonStat: {
    flex: 1,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
  },
  comparisonValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 3,
  },
  comparisonLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  modeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modeButtonTextActive: {
    color: '#4da6ff',
  },
  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
  authHelpCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  authHelpTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  authHelpText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  authLinkInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  usernameFutureCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  usernameFutureTitle: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  usernameFutureText: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
  },
  dangerButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ff8a8a',
    fontSize: 14,
    fontWeight: '800',
  },
});
