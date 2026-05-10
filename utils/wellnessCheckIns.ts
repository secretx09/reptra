import { WellnessCheckIn } from '../types/wellnessCheckIn';

export function formatWellnessDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getReadinessScore(checkIn: WellnessCheckIn | undefined) {
  if (!checkIn) {
    return 0;
  }

  const sorenessRecovery = 6 - checkIn.soreness;
  const sleepScore = Math.min(Number(checkIn.sleepHours) || 0, 8) / 8 * 5;
  const average = (checkIn.energy + sorenessRecovery + sleepScore) / 3;

  return Math.max(0, Math.min(100, Math.round((average / 5) * 100)));
}

export function getReadinessLabel(score: number) {
  if (score >= 80) {
    return 'Ready to push';
  }

  if (score >= 60) {
    return 'Solid training day';
  }

  if (score >= 40) {
    return 'Keep it moderate';
  }

  if (score > 0) {
    return 'Recovery focus';
  }

  return 'No check-in yet';
}

export function getAverageReadiness(checkIns: WellnessCheckIn[]) {
  if (checkIns.length === 0) {
    return 0;
  }

  const total = checkIns.reduce(
    (sum, checkIn) => sum + getReadinessScore(checkIn),
    0
  );

  return Math.round(total / checkIns.length);
}
