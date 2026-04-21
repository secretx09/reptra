import { exercises as builtInExercises } from '../data/exercises';
import { loadCustomExercises } from '../storage/customExercises';
import { Exercise } from '../types/exercise';

export const baseMuscleGroups = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
];

export async function loadExerciseLibrary(): Promise<Exercise[]> {
  const customExercises = await loadCustomExercises();
  return [...builtInExercises, ...customExercises].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getMuscleGroups(exerciseLibrary: Exercise[]) {
  const dynamicGroups = Array.from(
    new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup))
  ).sort((a, b) => a.localeCompare(b));

  return ['All', ...dynamicGroups];
}
