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

export interface NutritionFood {
  id: string;
  name: string;
  brand: string;
  serving: string;
  calories: string;
  protein: string;
  category: string;
  isCustom: boolean;
  createdAt: string;
}
