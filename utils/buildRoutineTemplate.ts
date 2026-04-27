import { RoutineTemplate } from '../data/routineTemplates';
import { Exercise } from '../types/exercise';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../types/routine';

export function buildRoutineName(
  baseName: string,
  routines: RoutineWithExercises[]
) {
  const existingNames = new Set(
    routines.map((routine) => routine.name.trim().toLowerCase())
  );

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let copyNumber = 2;
  let nextName = `${baseName} ${copyNumber}`;

  while (existingNames.has(nextName.toLowerCase())) {
    copyNumber += 1;
    nextName = `${baseName} ${copyNumber}`;
  }

  return nextName;
}

export function createTemplateExercise(
  exercise: Exercise,
  index: number
): RoutineExerciseWithDefaults {
  return {
    ...exercise,
    defaultSets: '3',
    defaultWeight: '',
    defaultReps: index === 0 ? '5' : '8',
    defaultRestSeconds: '',
    note: '',
    supersetGroupId: null,
  };
}

export function buildRoutineFromTemplate(
  template: RoutineTemplate,
  exerciseLibrary: Exercise[],
  id: string,
  name = template.name
): RoutineWithExercises | null {
  const exerciseById = new Map(
    exerciseLibrary.map((exercise) => [exercise.id, exercise])
  );
  const templateExercises = template.exerciseIds
    .map((exerciseId) => exerciseById.get(exerciseId))
    .filter((exercise): exercise is Exercise => Boolean(exercise));

  if (templateExercises.length === 0) {
    return null;
  }

  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    isPinned: false,
    note: template.description,
    exercises: templateExercises.map(createTemplateExercise),
  };
}
