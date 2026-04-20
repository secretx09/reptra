import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressPhoto } from '../types/progressPhoto';

const PROGRESS_PHOTOS_KEY = 'progressPhotos';

export async function loadProgressPhotos(): Promise<ProgressPhoto[]> {
  try {
    const data = await AsyncStorage.getItem(PROGRESS_PHOTOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load progress photos:', error);
    return [];
  }
}

export async function saveProgressPhotos(progressPhotos: ProgressPhoto[]) {
  try {
    await AsyncStorage.setItem(
      PROGRESS_PHOTOS_KEY,
      JSON.stringify(progressPhotos)
    );
  } catch (error) {
    console.error('Failed to save progress photos:', error);
  }
}

export async function deleteProgressPhotoById(photoId: string) {
  try {
    const existingPhotos = await loadProgressPhotos();
    const updatedPhotos = existingPhotos.filter((photo) => photo.id !== photoId);
    await saveProgressPhotos(updatedPhotos);
  } catch (error) {
    console.error('Failed to delete progress photo:', error);
  }
}
