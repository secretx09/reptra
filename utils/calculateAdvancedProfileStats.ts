import { SavedWorkoutSession } from '../types/workout';
import { Exercise } from '../types/exercise';

function getWorkoutDateKey(workout: SavedWorkoutSession) {
  return new Date(workout.completedAt).toDateString();
}

function getDayDiffFromToday(dateKey: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateKey);
  date.setHours(0, 0, 0, 0);

  return Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateAdvancedProfileStats(
  workouts: SavedWorkoutSession[],
  exerciseLibrary: Exercise[] = []
) {
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );
  const workoutDateKeys = Array.from(new Set(sortedWorkouts.map(getWorkoutDateKey)));
  const exerciseCounts = new Map<string, number>();
  const muscleGroupCounts = new Map<string, number>();

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exerciseCounts.set(
        exercise.exerciseName,
        (exerciseCounts.get(exercise.exerciseName) ?? 0) + 1
      );

      const libraryExercise = exerciseLibrary.find(
        (item) => item.id === exercise.exerciseId
      );
      const muscleGroup = libraryExercise?.muscleGroup;

      if (muscleGroup) {
        muscleGroupCounts.set(muscleGroup, (muscleGroupCounts.get(muscleGroup) ?? 0) + 1);
      }
    });
  });

  const currentStreak = (() => {
    const workoutDays = new Set(workoutDateKeys);
    let streak = 0;
    let offset = 0;

    while (workoutDays.has(new Date(Date.now() - offset * 86400000).toDateString())) {
      streak += 1;
      offset += 1;
    }

    if (streak === 0 && workoutDays.has(new Date(Date.now() - 86400000).toDateString())) {
      streak = 1;
      offset = 2;

      while (workoutDays.has(new Date(Date.now() - offset * 86400000).toDateString())) {
        streak += 1;
        offset += 1;
      }
    }

    return streak;
  })();

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDayDiff: number | null = null;

  workoutDateKeys.forEach((dateKey) => {
    const dayDiff = getDayDiffFromToday(dateKey);

    if (previousDayDiff === null || previousDayDiff - dayDiff === 1) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }

    longestStreak = Math.max(longestStreak, runningStreak);
    previousDayDiff = dayDiff;
  });

  const oldestWorkout = sortedWorkouts[0];
  const newestWorkout = sortedWorkouts[sortedWorkouts.length - 1];
  const activeWeekSpan =
    oldestWorkout && newestWorkout
      ? Math.max(
          1,
          Math.ceil(
            (new Date(newestWorkout.completedAt).getTime() -
              new Date(oldestWorkout.completedAt).getTime()) /
              (1000 * 60 * 60 * 24 * 7)
          )
        )
      : 1;
  const averageWorkoutsPerWeek =
    workouts.length > 0 ? Number((workouts.length / activeWeekSpan).toFixed(1)) : 0;
  const favoriteExercise =
    [...exerciseCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None yet';

  return {
    currentStreak,
    longestStreak,
    averageWorkoutsPerWeek,
    favoriteExercise,
    uniqueTrainingDays: workoutDateKeys.length,
    mostTrainedMuscleGroup:
      [...muscleGroupCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      'None yet',
  };
}
