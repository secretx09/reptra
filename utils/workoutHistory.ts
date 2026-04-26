import { Exercise } from '../types/exercise';
import { SavedWorkoutSession, WorkoutSet } from '../types/workout';

type PrefillValues = {
  weight: string;
  reps: string;
};

export function getMostRecentSetPrefill(
  workouts: SavedWorkoutSession[],
  exerciseId: string,
  setNumber = 1
): PrefillValues | null {
  const sortedWorkouts = [...workouts].sort((a, b) => {
    return (
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  });

  for (const workout of sortedWorkouts) {
    const matchingExercise = workout.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId
    );

    if (!matchingExercise) {
      continue;
    }

    const matchingSet = matchingExercise.sets.find(
      (set) => set.setNumber === setNumber
    );

    if (!matchingSet) {
      continue;
    }

    return {
      weight: matchingSet.weight || '',
      reps: matchingSet.reps || '',
    };
  }

  return null;
}

export function buildTemplateExercisesFromWorkout(
  workout: SavedWorkoutSession,
  exerciseLibrary: Exercise[]
) {
  const exercises: Exercise[] = [];
  const setsByExerciseId: Record<string, WorkoutSet[]> = {};
  const notesByExerciseId: Record<string, string> = {};

  workout.exercises.forEach((loggedExercise) => {
    const libraryExercise = exerciseLibrary.find(
      (exercise) => exercise.id === loggedExercise.exerciseId
    );
    const resolvedExercise: Exercise =
      libraryExercise ?? {
        id: loggedExercise.exerciseId,
        name: loggedExercise.exerciseName,
        muscleGroup: 'Custom',
        primaryMuscles: [],
        secondaryMuscles: [],
        equipment: 'Deleted custom exercise',
        instructions: [],
        isCustom: true,
      };

    exercises.push(resolvedExercise);
    notesByExerciseId[resolvedExercise.id] = loggedExercise.note || '';
    setsByExerciseId[resolvedExercise.id] = loggedExercise.sets.map((set) => ({
      ...set,
      id: `${resolvedExercise.id}-${set.setNumber}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      completed: false,
    }));
  });

  return {
    exercises,
    setsByExerciseId,
    notesByExerciseId,
  };
}
