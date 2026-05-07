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
import { loadFitnessGoals } from '../../storage/fitnessGoals';
import { loadBodyMeasurements } from '../../storage/bodyMeasurements';
import { Exercise } from '../../types/exercise';
import { BodyMeasurement } from '../../types/bodyMeasurement';
import { FitnessGoal } from '../../types/fitnessGoal';
import { ProgressPhoto } from '../../types/progressPhoto';
import { RoutineWithExercises } from '../../types/routine';
import { AppTheme, WeightUnit } from '../../types/settings';
import { SavedWorkoutSession, WorkoutVisibility } from '../../types/workout';
import { calculateExercisePRs } from '../../utils/calculatePRs';
import { calculateWeeklyStats } from '../../utils/calculateWeeklyStats';
import { calculateWorkoutSummary } from '../../utils/calculateWorkoutSummary';
import {
  calculateFitnessGoalProgress,
  formatGoalValue,
} from '../../utils/fitnessGoals';
import { loadExerciseLibrary } from '../../utils/exerciseLibrary';
import { getThemePalette } from '../../utils/appTheme';
import { formatWorkoutDuration } from '../../utils/formatDuration';
import { formatBodyWeight } from '../../utils/bodyMeasurements';

type FeedFilter = 'all' | WorkoutVisibility;

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
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [fitnessGoals, setFitnessGoals] = useState<FitnessGoal[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
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
          savedGoals,
          savedMeasurements,
        ] =
          await Promise.all([
            loadSettings(),
            loadWorkouts(),
            loadRoutines(),
            loadProgressPhotos(),
            loadExerciseLibrary(),
            loadFavoriteExerciseIds(),
            loadFitnessGoals(),
            loadBodyMeasurements(),
          ]);

        setTheme(settings.theme);
        setWeightUnit(settings.weightUnit);
        setWorkouts(savedWorkouts);
        setRoutines(savedRoutines);
        setProgressPhotos(savedPhotos);
        setExerciseLibrary(loadedExercises);
        setFavoriteExerciseIds(savedFavoriteIds);
        setFitnessGoals(savedGoals);
        setBodyMeasurements(savedMeasurements);
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
  const feedWorkouts = useMemo(() => {
    return [...workouts]
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
      .filter((workout) => {
        const visibility = workout.visibility ?? 'private';
        return feedFilter === 'all' || visibility === feedFilter;
      })
      .slice(0, 5);
  }, [feedFilter, workouts]);
  const sharedWorkoutCount = workouts.filter(
    (workout) => (workout.visibility ?? 'private') !== 'private'
  ).length;
  const activeGoalProgress = useMemo(() => {
    return calculateFitnessGoalProgress(
      fitnessGoals,
      workouts,
      prs,
      weightUnit
    )
      .filter((progress) => progress.goal.status === 'active')
      .sort((a, b) => b.progressRatio - a.progressRatio);
  }, [fitnessGoals, prs, weightUnit, workouts]);
  const nextGoal = activeGoalProgress[0];
  const latestBodyMeasurement = bodyMeasurements[0];

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
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Body Check-In</Text>
              <Text style={styles.cardSubtitle}>
                Latest saved body progress snapshot
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/profile/body-measurements' as never)}
            >
              <Text style={styles.linkText}>Open</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.activityPanel}
            onPress={() => router.push('/profile/body-measurements' as never)}
          >
            <Text style={styles.activityTitle}>
              {latestBodyMeasurement
                ? formatBodyWeight(
                    latestBodyMeasurement.bodyWeight,
                    weightUnit,
                    'lb'
                  )
                : 'Add body check-in'}
            </Text>
            <Text style={styles.activityMeta}>
              {latestBodyMeasurement
                ? new Date(latestBodyMeasurement.measuredAt).toLocaleDateString()
                : 'Track body weight and simple measurements'}
            </Text>
          </Pressable>
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
              <Text style={styles.cardTitle}>Next Goal</Text>
              <Text style={styles.cardSubtitle}>
                A target to keep your training pointed forward
              </Text>
            </View>

            <Pressable onPress={() => router.push('/profile/goals' as never)}>
              <Text style={styles.linkText}>Goals</Text>
            </Pressable>
          </View>

          {nextGoal ? (
            <Pressable
              style={styles.goalPanel}
              onPress={() => router.push('/profile/goals' as never)}
            >
              <View style={styles.goalPanelTopRow}>
                <View style={styles.goalPanelTextWrap}>
                  <Text style={styles.activityTitle}>{nextGoal.goal.title}</Text>
                  <Text style={styles.activityMeta}>
                    {formatGoalValue(
                      nextGoal.displayedCurrentValue,
                      nextGoal.goal.metric,
                      weightUnit
                    )}{' '}
                    /{' '}
                    {formatGoalValue(
                      nextGoal.displayedTargetValue,
                      nextGoal.goal.metric,
                      weightUnit
                    )}
                  </Text>
                </View>

                <Text style={styles.goalPanelPercent}>
                  {nextGoal.progressPercent}%
                </Text>
              </View>

              <View style={styles.goalPanelTrack}>
                <View
                  style={[
                    styles.goalPanelFill,
                    { width: `${nextGoal.progressRatio * 100}%` },
                  ]}
                />
              </View>
            </Pressable>
          ) : (
            <Pressable
              style={styles.activityPanel}
              onPress={() => router.push('/profile/goals' as never)}
            >
              <Text style={styles.activityTitle}>Create your first goal</Text>
              <Text style={styles.activityMeta}>
                Track workouts, PRs, reps, sets, or volume
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
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Feed Preview</Text>
              <Text style={styles.cardSubtitle}>
                Local-only now, social-ready later
              </Text>
            </View>

            <Text style={styles.feedCountText}>{sharedWorkoutCount} shared</Text>
          </View>

          <View style={styles.feedFilterRow}>
            {(['all', 'private', 'friends', 'public'] as FeedFilter[]).map(
              (filter) => {
                const isSelected = feedFilter === filter;

                return (
                  <Pressable
                    key={filter}
                    style={[
                      styles.feedFilterChip,
                      isSelected && styles.feedFilterChipSelected,
                    ]}
                    onPress={() => setFeedFilter(filter)}
                  >
                    <Text
                      style={[
                        styles.feedFilterChipText,
                        isSelected && styles.feedFilterChipTextSelected,
                      ]}
                    >
                      {filter}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          {feedWorkouts.length > 0 ? (
            <View style={styles.feedList}>
              {feedWorkouts.map((workout) => {
                const summary = calculateWorkoutSummary(workout);
                const duration = formatWorkoutDuration(workout.durationMinutes);
                const linkedPhoto = progressPhotos.find(
                  (photo) => photo.workoutId === workout.id
                );

                return (
                  <Pressable
                    key={workout.id}
                    style={styles.feedCard}
                    onPress={() => router.push(`/workout/history/${workout.id}`)}
                  >
                    <View style={styles.feedCardTopRow}>
                      <View style={styles.feedAvatar}>
                        <Text style={styles.feedAvatarText}>R</Text>
                      </View>

                      <View style={styles.feedTitleWrap}>
                        <Text style={styles.feedTitle}>{workout.routineName}</Text>
                        <Text style={styles.feedMeta}>
                          {formatShortDate(workout.completedAt)} -{' '}
                          {workout.visibility ?? 'private'}
                        </Text>
                      </View>
                    </View>

                    {workout.feedCaption?.trim() ? (
                      <Text style={styles.feedCaption}>
                        {workout.feedCaption.trim()}
                      </Text>
                    ) : (
                      <Text style={styles.feedCaptionMuted}>
                        No caption yet. Add one from the workout summary or
                        detail page.
                      </Text>
                    )}

                    {linkedPhoto ? (
                      <Image
                        source={{ uri: linkedPhoto.imageUri }}
                        style={styles.feedPhoto}
                      />
                    ) : null}

                    <View style={styles.feedStatRow}>
                      <Text style={styles.feedStat}>{summary.totalSets} sets</Text>
                      <Text style={styles.feedStat}>{summary.totalReps} reps</Text>
                      <Text style={styles.feedStat}>
                        {duration || `${workout.exercises.length} exercises`}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No workouts match this feed filter yet. Save feed settings from a
              workout summary or history detail to preview them here.
            </Text>
          )}
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
  feedCountText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
  },
  feedFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  feedFilterChip: {
    flex: 1,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  feedFilterChipSelected: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  feedFilterChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  feedFilterChipTextSelected: {
    color: '#111111',
  },
  feedList: {
    gap: 10,
  },
  feedCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 12,
  },
  feedCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedAvatarText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '900',
  },
  feedTitleWrap: {
    flex: 1,
  },
  feedTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  feedMeta: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  feedCaption: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  feedCaptionMuted: {
    color: '#777777',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 10,
  },
  feedPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#101010',
    marginBottom: 10,
  },
  feedStatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedStat: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  goalPanel: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 12,
  },
  goalPanelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  goalPanelTextWrap: {
    flex: 1,
  },
  goalPanelPercent: {
    color: '#4da6ff',
    fontSize: 18,
    fontWeight: '900',
  },
  goalPanelTrack: {
    height: 9,
    backgroundColor: '#0d1722',
    borderRadius: 999,
    overflow: 'hidden',
  },
  goalPanelFill: {
    height: '100%',
    backgroundColor: '#4da6ff',
    borderRadius: 999,
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
