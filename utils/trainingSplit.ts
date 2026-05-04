import {
  TrainingCategory,
  TrainingCategoryId,
  TrainingSplitPlan,
  WeekdayId,
} from '../types/trainingSplit';

export const trainingCategories: TrainingCategory[] = [
  { id: 'arms', label: 'Arms', description: 'Biceps, triceps, and arm accessories.' },
  { id: 'chest', label: 'Chest', description: 'Chest-focused pressing and fly work.' },
  { id: 'back', label: 'Back', description: 'Rows, pulldowns, and back strength.' },
  { id: 'shoulders', label: 'Shoulders', description: 'Delts, presses, and shoulder accessories.' },
  { id: 'legs', label: 'Legs', description: 'Quads, hamstrings, glutes, and calves.' },
  { id: 'core', label: 'Core', description: 'Abs, obliques, and trunk stability.' },
  { id: 'upper', label: 'Upper Body', description: 'A full upper-body training day.' },
  { id: 'lower', label: 'Lower Body', description: 'A full lower-body training day.' },
  { id: 'push', label: 'Push', description: 'Chest, shoulders, and triceps.' },
  { id: 'pull', label: 'Pull', description: 'Back, biceps, and rear delts.' },
  { id: 'mixed', label: 'Mixed', description: 'A flexible full-body or mixed routine.' },
  { id: 'cardio', label: 'Cardio', description: 'Conditioning, endurance, or active recovery.' },
  { id: 'rest', label: 'Rest', description: 'No planned lifting today.' },
];

export const routineTrainingCategories = trainingCategories.filter(
  (category) => category.id !== 'rest'
);

export const weekdays: { id: WeekdayId; label: string; shortLabel: string }[] = [
  { id: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { id: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { id: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { id: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { id: 'sunday', label: 'Sunday', shortLabel: 'Sun' },
];

export const defaultTrainingSplitPlan: TrainingSplitPlan = {
  days: weekdays.map((day) => ({
    day: day.id,
    categoryId: 'mixed',
  })),
  updatedAt: null,
};

export function getTrainingCategory(categoryId?: TrainingCategoryId) {
  return (
    trainingCategories.find((category) => category.id === categoryId) ||
    trainingCategories.find((category) => category.id === 'mixed') ||
    trainingCategories[0]
  );
}

export function getTodayWeekdayId(date = new Date()): WeekdayId {
  const day = date.getDay();

  return weekdays[(day + 6) % 7].id;
}

export function getTrainingDayForDate(
  plan: TrainingSplitPlan,
  date = new Date()
) {
  const todayId = getTodayWeekdayId(date);
  return (
    plan.days.find((day) => day.day === todayId) ||
    defaultTrainingSplitPlan.days.find((day) => day.day === todayId) ||
    defaultTrainingSplitPlan.days[0]
  );
}
