export interface WorkoutSession {
  id: string;
  routineId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  notes: string;
}

export interface LoggedSet {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  isWarmup: boolean;
  note: string;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  heaviestWeight: number;
  bestEstimatedOneRepMax: number;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: string;
  reps: string;
}

export interface SavedExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface SavedWorkoutSession {
  id: string;
  routineId: string | null;
  routineName: string;
  completedAt: string;
  exercises: SavedExerciseLog[];
}

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  heaviestWeight: number;
  bestEstimatedOneRepMax: number;
}