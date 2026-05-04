import { Exercise } from './exercise';
import { TrainingCategoryId } from './trainingSplit';

export interface Routine {
  id: string;
  name: string;
  createdAt: string;
  isPinned?: boolean;
  note?: string;
  trainingCategory?: TrainingCategoryId;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
}

export interface RoutineExerciseWithDefaults extends Exercise {
  defaultSets: string;
  defaultWeight: string;
  defaultReps: string;
  defaultRestSeconds: string;
  note?: string;
  supersetGroupId?: string | null;
}

export interface RoutineWithExercises {
  id: string;
  name: string;
  createdAt: string;
  isPinned?: boolean;
  note?: string;
  trainingCategory?: TrainingCategoryId;
  exercises: RoutineExerciseWithDefaults[];
}
