export function formatWorkoutDuration(durationMinutes?: number) {
  if (!durationMinutes || durationMinutes <= 0) {
    return null;
  }

  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}
