import { SavedWorkoutSession, ExercisePR } from '../types/workout';

export function calculateExercisePRs(
  workouts: SavedWorkoutSession[]
): ExercisePR[] {
  const prMap: Record<string, ExercisePR> = {};

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        const parsedWeight = Number(set.weight);

        if (!Number.isNaN(parsedWeight) && parsedWeight > 0) {
          const existingPR = prMap[exercise.exerciseId];

          if (!existingPR || parsedWeight > existingPR.heaviestWeight) {
            prMap[exercise.exerciseId] = {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              heaviestWeight: parsedWeight,
            };
          }
        }
      });
    });
  });

  return Object.values(prMap).sort(
    (a, b) => b.heaviestWeight - a.heaviestWeight
  );
}