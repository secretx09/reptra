import { Exercise } from '../types/exercise';
import { WeightUnit } from '../types/settings';
import { SavedWorkoutSession } from '../types/workout';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../types/routine';
import { loadRoutines, saveRoutines } from '../storage/routines';
import { calculateWorkoutSummary } from './calculateWorkoutSummary';
import { formatWorkoutDuration } from './formatDuration';
import {
  convertWeightValue,
  convertVolumeValue,
  formatWeightNumber,
  formatWeightWithUnit,
} from './weightUnits';

export function buildWorkoutShareMessage(
  workout: SavedWorkoutSession,
  weightUnit: WeightUnit
) {
  const { totalSets, totalReps, totalVolume, heaviestWeight } =
    calculateWorkoutSummary(workout);
  const formattedDate = new Date(workout.completedAt).toLocaleDateString();
  const formattedTime = new Date(workout.completedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const formattedDuration = formatWorkoutDuration(workout.durationMinutes);
  const sourceWeightUnit = workout.weightUnit ?? 'lb';
  const convertedVolume = convertVolumeValue(totalVolume, 'lb', weightUnit);

  const summaryLines = [
    workout.routineName,
    `${formattedDate} at ${formattedTime}`,
    formattedDuration ? `Duration: ${formattedDuration}` : '',
    `${workout.exercises.length} exercises`,
    `${totalSets} sets`,
    `${totalReps} reps`,
    `Heaviest: ${formatWeightWithUnit(String(heaviestWeight || 0), weightUnit, 'lb')}`,
    `Volume: ${formatWeightNumber(convertedVolume)} ${weightUnit}`,
    workout.feedCaption?.trim() ? `Caption: ${workout.feedCaption.trim()}` : '',
    workout.note?.trim() ? `Note: ${workout.note.trim()}` : '',
    '',
    ...workout.exercises.map((exercise) => {
      const setSummary = exercise.sets
        .map(
          (set) =>
            `${formatWeightWithUnit(set.weight, weightUnit, sourceWeightUnit)} x ${set.reps || '-'}`
        )
        .join(', ');
      const exerciseNote = exercise.note?.trim()
        ? ` (${exercise.note.trim()})`
        : '';

      return `${exercise.exerciseName}: ${setSummary || 'No sets'}${exerciseNote}`;
    }),
  ].filter(Boolean);

  return summaryLines.join('\n');
}

export async function createRoutineFromWorkout(
  workout: SavedWorkoutSession,
  exerciseLibrary: Exercise[],
  weightUnit: WeightUnit
) {
  const existingRoutines = await loadRoutines();
  const baseName = `${workout.routineName} Routine`;
  const existingNames = new Set(
    existingRoutines.map((routine) => routine.name.trim().toLowerCase())
  );
  let routineName = baseName;
  let copyNumber = 2;
  const sourceWeightUnit = workout.weightUnit ?? 'lb';

  while (existingNames.has(routineName.trim().toLowerCase())) {
    routineName = `${baseName} ${copyNumber}`;
    copyNumber += 1;
  }

  const routineExercises: RoutineExerciseWithDefaults[] = workout.exercises.map(
    (savedExercise) => {
      const libraryExercise = exerciseLibrary.find(
        (exercise) => exercise.id === savedExercise.exerciseId
      );
      const firstSet = savedExercise.sets[0];
      const parsedWeight = Number(firstSet?.weight);
      const defaultWeight =
        firstSet?.weight && !Number.isNaN(parsedWeight)
          ? formatWeightNumber(
              convertWeightValue(parsedWeight, sourceWeightUnit, weightUnit)
            )
          : '';

      return {
        ...(libraryExercise ?? {
          id: savedExercise.exerciseId,
          name: savedExercise.exerciseName,
          muscleGroup: 'Custom',
          primaryMuscles: [],
          secondaryMuscles: [],
          equipment: 'Unknown',
          instructions: [],
          isCustom: true,
        }),
        defaultSets: String(Math.max(savedExercise.sets.length, 1)),
        defaultWeight,
        defaultReps: firstSet?.reps || '',
        defaultRestSeconds: '',
        note: savedExercise.note?.trim() ?? '',
        supersetGroupId: null,
      };
    }
  );

  const newRoutine: RoutineWithExercises = {
    id: `routine-${Date.now()}`,
    name: routineName,
    createdAt: new Date().toISOString(),
    isPinned: false,
    note: workout.note?.trim() ?? '',
    exercises: routineExercises,
  };

  await saveRoutines([...existingRoutines, newRoutine]);

  return newRoutine;
}
