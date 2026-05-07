import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitnessGoal } from '../types/fitnessGoal';

const FITNESS_GOALS_KEY = 'fitnessGoals';

export async function saveFitnessGoals(goals: FitnessGoal[]) {
  try {
    await AsyncStorage.setItem(FITNESS_GOALS_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error('Failed to save fitness goals:', error);
  }
}

export async function loadFitnessGoals(): Promise<FitnessGoal[]> {
  try {
    const data = await AsyncStorage.getItem(FITNESS_GOALS_KEY);

    if (!data) {
      return [];
    }

    const parsedGoals = JSON.parse(data) as FitnessGoal[];

    return parsedGoals.map((goal) => ({
      ...goal,
      status: goal.status ?? 'active',
    }));
  } catch (error) {
    console.error('Failed to load fitness goals:', error);
    return [];
  }
}

export async function upsertFitnessGoal(goal: FitnessGoal) {
  const goals = await loadFitnessGoals();
  const existingGoalIndex = goals.findIndex((item) => item.id === goal.id);

  if (existingGoalIndex >= 0) {
    const updatedGoals = [...goals];
    updatedGoals[existingGoalIndex] = goal;
    await saveFitnessGoals(updatedGoals);
    return;
  }

  await saveFitnessGoals([goal, ...goals]);
}

export async function deleteFitnessGoalById(goalId: string) {
  const goals = await loadFitnessGoals();
  await saveFitnessGoals(goals.filter((goal) => goal.id !== goalId));
}
