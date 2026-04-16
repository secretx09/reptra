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

export async function deleteRoutineById(routineId: string) {
  try {
    const routines = await loadRoutines();
    const updatedRoutines = routines.filter((routine) => routine.id !== routineId);
    await saveRoutines(updatedRoutines);
  } catch (error) {
    console.error('Failed to delete routine:', error);
  }
}

export async function updateRoutineById(
  routineId: string,
  updatedRoutine: RoutineWithExercises
) {
  try {
    const routines = await loadRoutines();
    const updatedRoutines = routines.map((routine) =>
      routine.id === routineId ? updatedRoutine : routine
    );
    await saveRoutines(updatedRoutines);
  } catch (error) {
    console.error('Failed to update routine:', error);
  }
}