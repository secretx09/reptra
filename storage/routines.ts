import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoutineWithExercises } from '../types/routine';

const ROUTINES_KEY = 'routines';

export async function saveRoutines(routines: RoutineWithExercises[]) {
  try {
    await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  } catch (error) {
    console.error('Failed to save routines:', error);
  }
}

export async function loadRoutines(): Promise<RoutineWithExercises[]> {
  try {
    const data = await AsyncStorage.getItem(ROUTINES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load routines:', error);
    return [];
  }
}