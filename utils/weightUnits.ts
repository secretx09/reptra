import { WeightUnit } from '../types/settings';

export function formatWeightUnit(unit: WeightUnit) {
  return unit === 'kg' ? 'kg' : 'lb';
}

export function formatWeightWithUnit(
  value: string | number | undefined,
  unit: WeightUnit
) {
  if (value === undefined || value === null || value === '') {
    return `- ${formatWeightUnit(unit)}`;
  }

  return `${value} ${formatWeightUnit(unit)}`;
}

export function getWeightFieldLabel(unit: WeightUnit) {
  return `Weight (${formatWeightUnit(unit)})`;
}

export function getWeightPlaceholder(unit: WeightUnit) {
  return unit === 'kg' ? 'kg' : 'lb';
}
