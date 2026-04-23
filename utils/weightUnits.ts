import { WeightUnit } from '../types/settings';

export function formatWeightUnit(unit: WeightUnit) {
  return unit === 'kg' ? 'kg' : 'lb';
}

export function convertWeightValue(
  value: number,
  fromUnit: WeightUnit = 'lb',
  toUnit: WeightUnit = 'lb'
) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (fromUnit === toUnit) {
    return value;
  }

  return fromUnit === 'lb' ? value * 0.45359237 : value / 0.45359237;
}

export function convertVolumeValue(
  value: number,
  fromUnit: WeightUnit = 'lb',
  toUnit: WeightUnit = 'lb'
) {
  return convertWeightValue(value, fromUnit, toUnit);
}

export function formatWeightNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatWeightWithUnit(
  value: string | number | undefined,
  unit: WeightUnit,
  sourceUnit: WeightUnit = unit
) {
  if (value === undefined || value === null || value === '') {
    return `- ${formatWeightUnit(unit)}`;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return `${value} ${formatWeightUnit(unit)}`;
  }

  const convertedValue = convertWeightValue(numericValue, sourceUnit, unit);
  return `${formatWeightNumber(convertedValue)} ${formatWeightUnit(unit)}`;
}

export function getWeightFieldLabel(unit: WeightUnit) {
  return `Weight (${formatWeightUnit(unit)})`;
}

export function getWeightPlaceholder(unit: WeightUnit) {
  return unit === 'kg' ? 'kg' : 'lb';
}
