import AsyncStorage from '@react-native-async-storage/async-storage';
import { BodyMeasurement } from '../types/bodyMeasurement';

const BODY_MEASUREMENTS_KEY = 'bodyMeasurements';

export async function saveBodyMeasurements(measurements: BodyMeasurement[]) {
  try {
    await AsyncStorage.setItem(
      BODY_MEASUREMENTS_KEY,
      JSON.stringify(measurements)
    );
  } catch (error) {
    console.error('Failed to save body measurements:', error);
  }
}

export async function loadBodyMeasurements(): Promise<BodyMeasurement[]> {
  try {
    const data = await AsyncStorage.getItem(BODY_MEASUREMENTS_KEY);

    if (!data) {
      return [];
    }

    const measurements = JSON.parse(data) as BodyMeasurement[];

    return measurements.sort(
      (a, b) =>
        new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
    );
  } catch (error) {
    console.error('Failed to load body measurements:', error);
    return [];
  }
}

export async function deleteBodyMeasurementById(measurementId: string) {
  const measurements = await loadBodyMeasurements();
  await saveBodyMeasurements(
    measurements.filter((measurement) => measurement.id !== measurementId)
  );
}
