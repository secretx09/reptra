export interface NutritionTargets {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  water: string;
  updatedAt: string;
}

export interface DailyNutritionLog {
  id: string;
  loggedAt: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  water: string;
  note: string;
}

export interface SavedMealPreset {
  id: string;
  name: string;
  category: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  water: string;
  note: string;
  createdAt: string;
}
