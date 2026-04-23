import { SavedWorkoutSession } from '../types/workout';
import { convertWeightValue } from './weightUnits';

export function calculateWorkoutSummary(workout: SavedWorkoutSession) {
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let heaviestWeight = 0;
  const sourceWeightUnit = workout.weightUnit ?? 'lb';

  workout.exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      const rawWeight = Number(set.weight) || 0;
      const weight = convertWeightValue(rawWeight, sourceWeightUnit, 'lb');
      const reps = Number(set.reps) || 0;

      totalSets += 1;
      totalReps += reps;
      totalVolume += weight * reps;
      heaviestWeight = Math.max(heaviestWeight, weight);
    });
  });

  return {
    totalSets,
    totalReps,
    totalVolume,
    heaviestWeight,
  };
}
