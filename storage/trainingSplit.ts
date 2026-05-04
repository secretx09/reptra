import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingSplitPlan } from '../types/trainingSplit';
import { defaultTrainingSplitPlan, trainingCategories, weekdays } from '../utils/trainingSplit';

const TRAINING_SPLIT_KEY = 'trainingSplitPlan';

const validCategoryIds = new Set(trainingCategories.map((category) => category.id));

export async function loadTrainingSplitPlan(): Promise<TrainingSplitPlan> {
  try {
    const data = await AsyncStorage.getItem(TRAINING_SPLIT_KEY);

    if (!data) {
      return defaultTrainingSplitPlan;
    }

    const parsed = JSON.parse(data) as Partial<TrainingSplitPlan>;
    const savedDays = Array.isArray(parsed.days) ? parsed.days : [];

    return {
      updatedAt: parsed.updatedAt ?? null,
      days: weekdays.map((day) => {
        const savedDay = savedDays.find((item) => item.day === day.id);
        const categoryId =
          savedDay && validCategoryIds.has(savedDay.categoryId)
            ? savedDay.categoryId
            : 'mixed';

        return {
          day: day.id,
          categoryId,
        };
      }),
    };
  } catch (error) {
    console.error('Failed to load training split:', error);
    return defaultTrainingSplitPlan;
  }
}

export async function saveTrainingSplitPlan(plan: TrainingSplitPlan) {
  try {
    await AsyncStorage.setItem(TRAINING_SPLIT_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error('Failed to save training split:', error);
  }
}
