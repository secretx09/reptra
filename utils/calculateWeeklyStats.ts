import { SavedWorkoutSession } from '../types/workout';

export function calculateWeeklyStats(workouts: SavedWorkoutSession[]) {
  const now = new Date();
  const startOfWeek = new Date(now);

  // Set to start of week (Sunday)
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  let workoutsThisWeek = 0;
  let setsThisWeek = 0;
  let exercisesThisWeek = 0;

  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.completedAt);

    if (workoutDate >= startOfWeek) {
      workoutsThisWeek++;

      exercisesThisWeek += workout.exercises.length;

      workout.exercises.forEach((exercise) => {
        setsThisWeek += exercise.sets.length;
      });
    }
  });

  return {
    workoutsThisWeek,
    setsThisWeek,
    exercisesThisWeek,
  };
}