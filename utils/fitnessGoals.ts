import { FitnessGoal, FitnessGoalMetric } from '../types/fitnessGoal';
import { WeightUnit } from '../types/settings';
import { ExercisePR, SavedWorkoutSession } from '../types/workout';
import { calculateWorkoutSummary } from './calculateWorkoutSummary';
import { convertVolumeValue, formatWeightNumber } from './weightUnits';

export const goalMetricOptions: {
  metric: FitnessGoalMetric;
  label: string;
  helper: string;
}[] = [
  {
    metric: 'workouts',
    label: 'Workouts',
    helper: 'Complete a target number of workouts.',
  },
  {
    metric: 'sets',
    label: 'Sets',
    helper: 'Log a target number of total sets.',
  },
  {
    metric: 'reps',
    label: 'Reps',
    helper: 'Log a target number of total reps.',
  },
  {
    metric: 'volume',
    label: 'Volume',
    helper: 'Move a target amount of total training volume.',
  },
  {
    metric: 'prs',
    label: 'PRs',
    helper: 'Set PRs on a target number of exercises.',
  },
];

export interface FitnessGoalProgress {
  goal: FitnessGoal;
  currentValue: number;
  displayedCurrentValue: number;
  displayedTargetValue: number;
  progressRatio: number;
  progressPercent: number;
  isComplete: boolean;
  metricLabel: string;
}

export function getGoalMetricLabel(metric: FitnessGoalMetric) {
  return (
    goalMetricOptions.find((option) => option.metric === metric)?.label ?? metric
  );
}

export function calculateGoalMetricValue(
  metric: FitnessGoalMetric,
  workouts: SavedWorkoutSession[],
  prs: ExercisePR[]
) {
  if (metric === 'workouts') {
    return workouts.length;
  }

  if (metric === 'prs') {
    return prs.length;
  }

  return workouts.reduce((sum, workout) => {
    const summary = calculateWorkoutSummary(workout);

    if (metric === 'sets') {
      return sum + summary.totalSets;
    }

    if (metric === 'reps') {
      return sum + summary.totalReps;
    }

    return sum + summary.totalVolume;
  }, 0);
}

export function calculateFitnessGoalProgress(
  goals: FitnessGoal[],
  workouts: SavedWorkoutSession[],
  prs: ExercisePR[],
  weightUnit: WeightUnit
): FitnessGoalProgress[] {
  return goals.map((goal) => {
    const currentValue = calculateGoalMetricValue(goal.metric, workouts, prs);
    const displayedCurrentValue =
      goal.metric === 'volume'
        ? convertVolumeValue(currentValue, 'lb', weightUnit)
        : currentValue;
    const displayedTargetValue =
      goal.metric === 'volume'
        ? convertVolumeValue(goal.targetValue, 'lb', weightUnit)
        : goal.targetValue;
    const progressRatio =
      goal.targetValue > 0 ? Math.min(currentValue / goal.targetValue, 1) : 0;

    return {
      goal,
      currentValue,
      displayedCurrentValue,
      displayedTargetValue,
      progressRatio,
      progressPercent: Math.round(progressRatio * 100),
      isComplete: currentValue >= goal.targetValue,
      metricLabel: getGoalMetricLabel(goal.metric),
    };
  });
}

export function formatGoalValue(
  value: number,
  metric: FitnessGoalMetric,
  weightUnit: WeightUnit
) {
  if (metric === 'volume') {
    return `${formatWeightNumber(value)} ${weightUnit}`;
  }

  return String(Math.round(value));
}
