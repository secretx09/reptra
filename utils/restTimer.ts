export function parseRestTimerInput(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.includes(':')) {
    const [minutesPart, secondsPart] = trimmedValue.split(':');
    const minutes = Number(minutesPart);
    const seconds = Number(secondsPart);

    if (
      !Number.isInteger(minutes) ||
      !Number.isInteger(seconds) ||
      minutes < 0 ||
      seconds < 0 ||
      seconds > 59
    ) {
      return null;
    }

    const totalSeconds = minutes * 60 + seconds;
    return totalSeconds > 0 ? totalSeconds : null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function formatRestTimerLabel(seconds: number) {
  if (seconds <= 0) {
    return 'Off';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatRestTimerCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
