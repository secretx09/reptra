import AsyncStorage from '@react-native-async-storage/async-storage';
import { WellnessCheckIn } from '../types/wellnessCheckIn';

const WELLNESS_CHECK_INS_KEY = 'wellnessCheckIns';

export async function saveWellnessCheckIns(checkIns: WellnessCheckIn[]) {
  try {
    await AsyncStorage.setItem(WELLNESS_CHECK_INS_KEY, JSON.stringify(checkIns));
  } catch (error) {
    console.error('Failed to save wellness check-ins:', error);
  }
}

export async function loadWellnessCheckIns(): Promise<WellnessCheckIn[]> {
  try {
    const data = await AsyncStorage.getItem(WELLNESS_CHECK_INS_KEY);

    if (!data) {
      return [];
    }

    const checkIns = JSON.parse(data) as WellnessCheckIn[];

    return checkIns.sort(
      (a, b) =>
        new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
    );
  } catch (error) {
    console.error('Failed to load wellness check-ins:', error);
    return [];
  }
}

export async function deleteWellnessCheckInById(checkInId: string) {
  const checkIns = await loadWellnessCheckIns();
  await saveWellnessCheckIns(
    checkIns.filter((checkIn) => checkIn.id !== checkInId)
  );
}
