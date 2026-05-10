import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DailyNutritionLog,
  NutritionTargets,
  SavedMealPreset,
} from '../types/nutrition';

const NUTRITION_TARGETS_KEY = 'nutritionTargets';
const DAILY_NUTRITION_LOGS_KEY = 'dailyNutritionLogs';
const SAVED_MEAL_PRESETS_KEY = 'savedMealPresets';

export const defaultNutritionTargets: NutritionTargets = {
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  water: '',
  updatedAt: '',
};

export async function saveNutritionTargets(targets: NutritionTargets) {
  try {
    await AsyncStorage.setItem(NUTRITION_TARGETS_KEY, JSON.stringify(targets));
  } catch (error) {
    console.error('Failed to save nutrition targets:', error);
  }
}

export async function loadNutritionTargets(): Promise<NutritionTargets> {
  try {
    const data = await AsyncStorage.getItem(NUTRITION_TARGETS_KEY);

    if (!data) {
      return defaultNutritionTargets;
    }

    return {
      ...defaultNutritionTargets,
      ...(JSON.parse(data) as NutritionTargets),
    };
  } catch (error) {
    console.error('Failed to load nutrition targets:', error);
    return defaultNutritionTargets;
  }
}

export async function saveDailyNutritionLogs(logs: DailyNutritionLog[]) {
  try {
    await AsyncStorage.setItem(DAILY_NUTRITION_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save daily nutrition logs:', error);
  }
}

export async function loadDailyNutritionLogs(): Promise<DailyNutritionLog[]> {
  try {
    const data = await AsyncStorage.getItem(DAILY_NUTRITION_LOGS_KEY);

    if (!data) {
      return [];
    }

    const logs = JSON.parse(data) as DailyNutritionLog[];

    return logs.sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to load daily nutrition logs:', error);
    return [];
  }
}

export async function deleteDailyNutritionLogById(logId: string) {
  const logs = await loadDailyNutritionLogs();
  await saveDailyNutritionLogs(logs.filter((log) => log.id !== logId));
}

export async function saveSavedMealPresets(meals: SavedMealPreset[]) {
  try {
    await AsyncStorage.setItem(SAVED_MEAL_PRESETS_KEY, JSON.stringify(meals));
  } catch (error) {
    console.error('Failed to save meal presets:', error);
  }
}

export async function loadSavedMealPresets(): Promise<SavedMealPreset[]> {
  try {
    const data = await AsyncStorage.getItem(SAVED_MEAL_PRESETS_KEY);

    if (!data) {
      return [];
    }

    const meals = (JSON.parse(data) as SavedMealPreset[]).map((meal) => ({
      ...meal,
      category: meal.category || 'Meal',
    }));

    return meals.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Failed to load meal presets:', error);
    return [];
  }
}

export async function deleteSavedMealPresetById(mealId: string) {
  const meals = await loadSavedMealPresets();
  await saveSavedMealPresets(meals.filter((meal) => meal.id !== mealId));
}
