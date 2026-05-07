export type FitnessGoalMetric = 'workouts' | 'sets' | 'reps' | 'volume' | 'prs';

export type FitnessGoalStatus = 'active' | 'archived';

export interface FitnessGoal {
  id: string;
  title: string;
  metric: FitnessGoalMetric;
  targetValue: number;
  createdAt: string;
  dueAt?: string;
  status: FitnessGoalStatus;
}
