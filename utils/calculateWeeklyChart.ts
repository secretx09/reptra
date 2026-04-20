import { SavedWorkoutSession } from '../types/workout';

type WeeklyChartDay = {
  label: string;
  workouts: number;
};

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function calculateWeeklyChart(workouts: SavedWorkoutSession[]) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const days: WeeklyChartDay[] = Array.from({ length: 7 }, (_, index) => ({
    label: dayLabels[index],
    workouts: 0,
  }));

  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.completedAt);

    if (workoutDate < startOfWeek) {
      return;
    }

    const dayIndex = workoutDate.getDay();

    if (dayIndex >= 0 && dayIndex < 7) {
      days[dayIndex].workouts += 1;
    }
  });

  const maxWorkouts = Math.max(...days.map((day) => day.workouts), 0);

  return {
    days,
    maxWorkouts,
    todayIndex: now.getDay(),
  };
}
