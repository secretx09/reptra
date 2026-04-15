export function calculateEstimatedOneRepMax(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}