export type TrainingCategoryId =
  | 'arms'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'core'
  | 'upper'
  | 'lower'
  | 'push'
  | 'pull'
  | 'mixed'
  | 'cardio'
  | 'rest';

export interface TrainingCategory {
  id: TrainingCategoryId;
  label: string;
  description: string;
}

export type WeekdayId =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TrainingDayPlan {
  day: WeekdayId;
  categoryId: TrainingCategoryId;
}

export interface TrainingSplitPlan {
  days: TrainingDayPlan[];
  updatedAt: string | null;
}
