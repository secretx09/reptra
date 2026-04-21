import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../types/exercise';

const CUSTOM_EXERCISES_KEY = 'customExercises';

function normalizeCustomExercise(exercise: Partial<Exercise>): Exercise {
  const muscleGroup = exercise.muscleGroup?.trim() || 'Custom';

  return {
    id: exercise.id || `custom-${Date.now()}`,
    name: exercise.name?.trim() || 'Custom Exercise',
    muscleGroup,
    primaryMuscles:
      Array.isArray(exercise.primaryMuscles) && exercise.primaryMuscles.length > 0
        ? exercise.primaryMuscles
        : [muscleGroup],
    secondaryMuscles: Array.isArray(exercise.secondaryMuscles)
      ? exercise.secondaryMuscles
      : [],
    equipment: exercise.equipment?.trim() || 'Unknown',
    demoMedia:
      exercise.demoMedia &&
      typeof exercise.demoMedia.url === 'string' &&
      typeof exercise.demoMedia.title === 'string' &&
      (exercise.demoMedia.type === 'video' || exercise.demoMedia.type === 'gif')
        ? exercise.demoMedia
        : undefined,
    instructions: Array.isArray(exercise.instructions)
      ? exercise.instructions
      : [],
    isCustom: true,
  };
}

export async function loadCustomExercises(): Promise<Exercise[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
    if (!data) {
      return [];
    }

    const parsedExercises = JSON.parse(data) as Partial<Exercise>[];
    return parsedExercises.map(normalizeCustomExercise);
  } catch (error) {
    console.error('Failed to load custom exercises:', error);
    return [];
  }
}

export async function saveCustomExercises(customExercises: Exercise[]) {
  try {
    await AsyncStorage.setItem(
      CUSTOM_EXERCISES_KEY,
      JSON.stringify(customExercises.map(normalizeCustomExercise))
    );
  } catch (error) {
    console.error('Failed to save custom exercises:', error);
  }
}
