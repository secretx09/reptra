import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { loadProgressPhotos } from '../../storage/progressPhotos';
import { loadRoutines } from '../../storage/routines';
import { loadSettings } from '../../storage/settings';
import { loadWorkouts } from '../../storage/workouts';
import { loadFavoriteExerciseIds } from '../../storage/favoriteExercises';
import { Exercise } from '../../types/exercise';
import { ProgressPhoto } from '../../types/progressPhoto';
import { RoutineWithExercises } from '../../types/routine';
import { AppTheme } from '../../types/settings';
import { SavedWorkoutSession } from '../../types/workout';
import { calculateExercisePRs } from '../../utils/calculatePRs';
import { calculateWeeklyStats } from '../../utils/calculateWeeklyStats';
import { loadExerciseLibrary } from '../../utils/exerciseLibrary';
import { getThemePalette } from '../../utils/appTheme';

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const [theme, setTheme] = useState<AppTheme>('graphite');
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<string[]>([]);
  const palette = getThemePalette(theme);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const [
          settings,
          savedWorkouts,
          savedRoutines,
          savedPhotos,
          loadedExercises,
          savedFavoriteIds,
        ] =
          await Promise.all([
            loadSettings(),
            loadWorkouts(),
            loadRoutines(),
            loadProgressPhotos(),
            loadExerciseLibrary(),
            loadFavoriteExerciseIds(),
          ]);

        setTheme(settings.theme);
        setWorkouts(savedWorkouts);
        setRoutines(savedRoutines);
        setProgressPhotos(savedPhotos);
        setExerciseLibrary(loadedExercises);
        setFavoriteExerciseIds(savedFavoriteIds);
      };

      fetchData();
    }, [])
  );

  const weeklyStats = useMemo(() => calculateWeeklyStats(workouts), [workouts]);
  const prs = useMemo(() => calculateExercisePRs(workouts), [workouts]);
  const latestWorkout = useMemo(
    () =>
      [...workouts].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )[0],
    [workouts]
  );
  const pinnedRoutine = routines.find((routine) => routine.isPinned) ?? routines[0];
  const latestPhoto = progressPhotos[0];
  const favoriteExercises = exerciseLibrary
    .filter((exercise) => favoriteExerciseIds.includes(exercise.id))
    .slice(0, 3);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
      edges={['left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.appName}>Reptra</Text>
          <Text style={styles.title}>Your training hub</Text>
          <Text style={styles.subtitle}>
            Quick actions, recent activity, and your local progress all in one place.
          </Text>

          <View style={styles.quickActionRow}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/workout/session/empty')}
            >
              <Text style={styles.primaryButtonText}>Start Empty</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push('/routine/create')}
            >
              <Text style={styles.secondaryButtonText}>Create Routine</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyStats.workoutsThisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{workouts.length}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{prs.length}</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Recent Workout</Text>
              <Text style={styles.cardSubtitle}>
                The last session saved to your history
              </Text>
            </View>

            <Pressable onPress={() => router.push('/profile/history')}>
              <Text style={styles.linkText}>History</Text>
            </Pressable>
          </View>

          {latestWorkout ? (
            <Pressable
              style={styles.activityPanel}
              onPress={() => router.push(`/workout/history/${latestWorkout.id}`)}
            >
              <Text style={styles.activityTitle}>{latestWorkout.routineName}</Text>
              <Text style={styles.activityMeta}>
                {formatShortDate(latestWorkout.completedAt)} •{' '}
                {latestWorkout.exercises.length} exercises
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.emptyText}>
              No workouts yet. Start an empty workout or try a routine template.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next Up</Text>
          {pinnedRoutine ? (
            <Pressable
              style={styles.activityPanel}
              onPress={() => router.push(`/routine/${pinnedRoutine.id}`)}
            >
              <Text style={styles.activityTitle}>{pinnedRoutine.name}</Text>
              <Text style={styles.activityMeta}>
                {pinnedRoutine.exercises.length} exercises ready
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.activityPanel}
              onPress={() => router.push('/routine/templates')}
            >
              <Text style={styles.activityTitle}>Browse templates</Text>
              <Text style={styles.activityMeta}>
                Build your first routine from a preset
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Favorite Exercises</Text>
              <Text style={styles.cardSubtitle}>Fast access to movements you care about</Text>
            </View>

            <Pressable onPress={() => router.push('/exercise')}>
              <Text style={styles.linkText}>Library</Text>
            </Pressable>
          </View>

          {favoriteExercises.length > 0 ? (
            <View style={styles.favoriteExerciseList}>
              {favoriteExercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  style={styles.favoriteExerciseRow}
                  onPress={() => router.push(`/exercise/${exercise.id}`)}
                >
                  <View style={styles.favoriteExerciseText}>
                    <Text style={styles.activityTitle}>{exercise.name}</Text>
                    <Text style={styles.activityMeta}>
                      {exercise.muscleGroup} • {exercise.equipment}
                    </Text>
                  </View>
                  <Text style={styles.favoriteExerciseArrow}>Open</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Favorite a few exercises from their detail pages and they will show up here.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Progress Check-In</Text>
              <Text style={styles.cardSubtitle}>Latest saved progress photo</Text>
            </View>

            <Pressable onPress={() => router.push('/profile/progress-photos')}>
              <Text style={styles.linkText}>Open</Text>
            </Pressable>
          </View>

          {latestPhoto ? (
            <View style={styles.photoPreviewRow}>
              <Image source={{ uri: latestPhoto.imageUri }} style={styles.photoPreview} />
              <View style={styles.photoTextWrap}>
                <Text style={styles.activityTitle}>
                  {latestPhoto.note || 'Progress photo'}
                </Text>
                <Text style={styles.activityMeta}>{formatShortDate(latestPhoto.createdAt)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No photos yet. Add check-ins from your profile when you are ready.
            </Text>
          )}
        </View>

        <View style={styles.socialCard}>
          <Text style={styles.cardTitle}>Social Feed Later</Text>
          <Text style={styles.emptyText}>
            This tab will eventually become Reptra&apos;s feed. For now, it is your
            personal launch pad.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  appName: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: '#b9d6f2',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#17283a',
    borderWidth: 1,
    borderColor: '#355b82',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    color: '#4da6ff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  socialCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 16,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  linkText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '800',
  },
  activityPanel: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
  },
  activityTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  activityMeta: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteExerciseList: {
    gap: 10,
  },
  favoriteExerciseRow: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  favoriteExerciseText: {
    flex: 1,
  },
  favoriteExerciseArrow: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 20,
  },
  photoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoPreview: {
    width: 74,
    height: 92,
    borderRadius: 12,
    backgroundColor: '#121212',
  },
  photoTextWrap: {
    flex: 1,
  },
});
