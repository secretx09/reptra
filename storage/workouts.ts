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
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load workouts:', error);
    return [];
  }
}