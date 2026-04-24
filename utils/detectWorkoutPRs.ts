import { SavedWorkoutSession } from '../types/workout';
import { calculateEstimatedOneRepMax } from './oneRepMax';
import { convertWeightValue } from './weightUnits';

export type WorkoutPRHighlight = {
  exerciseId: string;
  exerciseName: string;
  type: 'heaviest' | 'oneRepMax';
  value: number;
  previousValue: number;
};

type ExerciseBest = {
  heaviestWeight: number;
  bestEstimatedOneRepMax: number;
};

function getWorkoutTime(workout: SavedWorkoutSession) {
  return new Date(workout.completedAt).getTime();
}

function getExerciseBests(workouts: SavedWorkoutSession[]) {
  const bests = new Map<string, ExerciseBest>();

  workouts.forEach((workout) => {
    const sourceWeightUnit = workout.weightUnit ?? 'lb';

    workout.exercises.forEach((exercise) => {
      const currentBest = bests.get(exercise.exerciseId) ?? {
        heaviestWeight: 0,
        bestEstimatedOneRepMax: 0,
      };

      exercise.sets.forEach((set) => {
        const rawWeight = Number(set.weight);
        const reps = Number(set.reps);

        if (Number.isNaN(rawWeight) || rawWeight <= 0) {
          return;
        }

        const weight = convertWeightValue(rawWeight, sourceWeightUnit, 'lb');
        const estimatedOneRepMax =
          !Number.isNaN(reps) && reps > 0
            ? calculateEstimatedOneRepMax(weight, reps)
            : weight;

        currentBest.heaviestWeight = Math.max(currentBest.heaviestWeight, weight);
        currentBest.bestEstimatedOneRepMax = Math.max(
          currentBest.bestEstimatedOneRepMax,
          estimatedOneRepMax
        );
      });

      bests.set(exercise.exerciseId, currentBest);
    });
  });

  return bests;
}

export function detectWorkoutPRs(
  workout: SavedWorkoutSession,
  allWorkouts: SavedWorkoutSession[]
): WorkoutPRHighlight[] {
  const previousWorkouts = allWorkouts.filter(
    (item) => item.id !== workout.id && getWorkoutTime(item) < getWorkoutTime(workout)
  );
  const previousBests = getExerciseBests(previousWorkouts);
  const currentWorkoutBests = getExerciseBests([workout]);
  const highlights: WorkoutPRHighlight[] = [];

  workout.exercises.forEach((exercise) => {
    const currentBest = currentWorkoutBests.get(exercise.exerciseId);

    if (!currentBest) {
      return;
    }

    const previousBest = previousBests.get(exercise.exerciseId) ?? {
      heaviestWeight: 0,
      bestEstimatedOneRepMax: 0,
    };

    if (currentBest.heaviestWeight > previousBest.heaviestWeight) {
      highlights.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        type: 'heaviest',
        value: currentBest.heaviestWeight,
        previousValue: previousBest.heaviestWeight,
      });
    }

    if (
      currentBest.bestEstimatedOneRepMax > previousBest.bestEstimatedOneRepMax
    ) {
      highlights.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        type: 'oneRepMax',
        value: currentBest.bestEstimatedOneRepMax,
        previousValue: previousBest.bestEstimatedOneRepMax,
      });
    }
  });

  return highlights.sort((a, b) => b.value - a.value);
}
