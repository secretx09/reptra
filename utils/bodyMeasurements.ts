import { BodyMeasurement } from '../types/bodyMeasurement';
import { WeightUnit } from '../types/settings';
import { convertWeightValue, formatWeightNumber } from './weightUnits';

export function formatMeasurementDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatBodyWeight(
  value: string,
  displayUnit: WeightUnit,
  sourceUnit: WeightUnit = displayUnit
) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return '--';
  }

  return `${formatWeightNumber(
    convertWeightValue(parsedValue, sourceUnit, displayUnit)
  )} ${displayUnit}`;
}

export function getBodyWeightTrend(
  measurements: BodyMeasurement[],
  displayUnit: WeightUnit
) {
  const [latest, previous] = measurements;

  if (!latest || !previous) {
    return 'Add at least two check-ins to see a trend.';
  }

  const latestWeight = Number(latest.bodyWeight);
  const previousWeight = Number(previous.bodyWeight);

  if (!Number.isFinite(latestWeight) || !Number.isFinite(previousWeight)) {
    return 'Add body weight to two check-ins to see a trend.';
  }

  const difference = convertWeightValue(latestWeight - previousWeight, 'lb', displayUnit);
  const formattedDifference = formatWeightNumber(Math.abs(difference));

  if (difference === 0) {
    return `No change since ${formatMeasurementDate(previous.measuredAt)}.`;
  }

  return `${difference > 0 ? 'Up' : 'Down'} ${formattedDifference} ${displayUnit} since ${formatMeasurementDate(previous.measuredAt)}.`;
}
