import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedWorkoutSession } from '../types/workout';

const WORKOUTS_KEY = 'workouts';

export async function saveWorkouts(workouts: SavedWorkoutSession[]) {
  try {
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (error) {
    console.error('Failed to save workouts:', error);
  }
}

export async function loadWorkouts(): Promise<SavedWorkoutSession[]> {
  try {
    const data = await AsyncStorage.getItem(WORKOUTS_KEY);
    if (!data) {
      return [];
    }

    const parsedWorkouts = JSON.parse(data) as SavedWorkoutSession[];

    return parsedWorkouts.map((workout) => ({
      ...workout,
      note: workout.note ?? '',
    }));
  } catch (error) {
    console.error('Failed to load workouts:', error);
    return [];
  }
}

export async function updateWorkoutById(
  workoutId: string,
  updatedWorkout: SavedWorkoutSession
) {
  try {
    const workouts = await loadWorkouts();
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId ? updatedWorkout : workout
    );
    await saveWorkouts(updatedWorkouts);
  } catch (error) {
    console.error('Failed to update workout:', error);
  }
}

export async function deleteWorkoutById(workoutId: string) {
  try {
    const workouts = await loadWorkouts();
    const updatedWorkouts = workouts.filter((workout) => workout.id !== workoutId);
    await saveWorkouts(updatedWorkouts);
  } catch (error) {
    console.error('Failed to delete workout:', error);
  }
}
