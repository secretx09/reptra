import { ExerciseDemoMedia } from '../types/exercise';

export function splitMultilineInput(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinMultilineInput(values?: string[]) {
  return Array.isArray(values) ? values.join('\n') : '';
}

export function buildDemoMedia(
  type: ExerciseDemoMedia['type'],
  url: string,
  title: string,
  sourceLabel: string
): ExerciseDemoMedia | undefined {
  const trimmedUrl = url.trim();
  const trimmedTitle = title.trim();

  if (!trimmedUrl) {
    return undefined;
  }

  return {
    type,
    url: trimmedUrl,
    title: trimmedTitle || 'Movement Demo',
    sourceLabel: sourceLabel.trim() || undefined,
  };
}
