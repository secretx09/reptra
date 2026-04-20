import { SavedWorkoutSession } from '../types/workout';

export function calculateProfileStats(workouts: SavedWorkoutSession[]) {
  const totalSets = workouts.reduce(
    (workoutSum, workout) =>
      workoutSum +
      workout.exercises.reduce(
        (exerciseSum, exercise) => exerciseSum + exercise.sets.length,
        0
      ),
    0
  );

  const totalExercisesLogged = workouts.reduce(
    (sum, workout) => sum + workout.exercises.length,
    0
  );

  const workoutsWithDuration = workouts.filter(
    (workout) =>
      typeof workout.durationMinutes === 'number' && workout.durationMinutes > 0
  );

  const totalDurationMinutes = workoutsWithDuration.reduce(
    (sum, workout) => sum + (workout.durationMinutes || 0),
    0
  );

  const averageDurationMinutes =
    workoutsWithDuration.length > 0
      ? Math.round(totalDurationMinutes / workoutsWithDuration.length)
      : 0;

  return {
    totalSets,
    totalExercisesLogged,
    totalDurationMinutes,
    averageDurationMinutes,
  };
}
