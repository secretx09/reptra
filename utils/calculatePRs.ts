import { SavedWorkoutSession, ExercisePR } from '../types/workout';

function estimateOneRepMax(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function calculateExercisePRs(
  workouts: SavedWorkoutSession[]
): ExercisePR[] {
  const prMap: Record<string, ExercisePR> = {};

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        const weight = Number(set.weight);
        const reps = Number(set.reps);

        if (!Number.isNaN(weight) && weight > 0) {
          const estimated1RM =
            !Number.isNaN(reps) && reps > 0
              ? estimateOneRepMax(weight, reps)
              : weight;

          const existingPR = prMap[exercise.exerciseId];

          if (!existingPR) {
            prMap[exercise.exerciseId] = {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              heaviestWeight: weight,
              bestEstimatedOneRepMax: estimated1RM,
            };
          } else {
            if (weight > existingPR.heaviestWeight) {
              existingPR.heaviestWeight = weight;
            }

            if (estimated1RM > existingPR.bestEstimatedOneRepMax) {
              existingPR.bestEstimatedOneRepMax = estimated1RM;
            }
          }
        }
      });
    });
  });

  return Object.values(prMap).sort(
    (a, b) => b.bestEstimatedOneRepMax - a.bestEstimatedOneRepMax
  );
}