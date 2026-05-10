import { DailyNutritionLog, NutritionTargets } from '../types/nutrition';

export function getNutritionDateKey(value: string) {
  return new Date(value).toDateString();
}

function toNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

export function getTodayNutritionLogs(logs: DailyNutritionLog[]) {
  const todayKey = new Date().toDateString();
  return logs.filter((log) => getNutritionDateKey(log.loggedAt) === todayKey);
}

export function getNutritionLogsForDate(
  logs: DailyNutritionLog[],
  date: Date
) {
  const dateKey = date.toDateString();
  return logs.filter((log) => getNutritionDateKey(log.loggedAt) === dateKey);
}

export function calculateNutritionTotals(logs: DailyNutritionLog[]) {
  return logs.reduce(
    (totals, log) => ({
      calories: totals.calories + toNumber(log.calories),
      protein: totals.protein + toNumber(log.protein),
      carbs: totals.carbs + toNumber(log.carbs),
      fat: totals.fat + toNumber(log.fat),
      water: totals.water + toNumber(log.water),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      water: 0,
    }
  );
}

export function getNutritionProgress(
  currentValue: number,
  targetValue: string
) {
  const parsedTarget = toNumber(targetValue);

  if (parsedTarget <= 0) {
    return 0;
  }

  return Math.min(currentValue / parsedTarget, 1);
}

export function formatMacroValue(value: number, suffix = 'g') {
  if (!Number.isFinite(value) || value <= 0) {
    return `0${suffix}`;
  }

  const roundedValue = Math.round(value * 10) / 10;
  const formattedValue = Number.isInteger(roundedValue)
    ? String(roundedValue)
    : roundedValue.toFixed(1);

  return `${formattedValue}${suffix}`;
}

export function hasNutritionTargets(targets: NutritionTargets) {
  return Boolean(
    targets.calories ||
      targets.protein ||
      targets.carbs ||
      targets.fat ||
      targets.water
  );
}

export function getWeeklyNutritionChart(logs: DailyNutritionLog[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateLogs = getNutritionLogsForDate(logs, date);
    const totals = calculateNutritionTotals(dateLogs);

    return {
      key: date.toISOString(),
      label: date.toLocaleDateString([], { weekday: 'short' }),
      calories: totals.calories,
      protein: totals.protein,
    };
  });

  const maxCalories = Math.max(...days.map((day) => day.calories), 0);
  const averageCalories =
    days.reduce((sum, day) => sum + day.calories, 0) / days.length;
  const averageProtein =
    days.reduce((sum, day) => sum + day.protein, 0) / days.length;

  return {
    days,
    maxCalories,
    averageCalories,
    averageProtein,
  };
}
