export interface ProgressPhoto {
  id: string;
  imageUri: string;
  note: string;
  createdAt: string;
  sourceType?: 'uri' | 'camera' | 'gallery';
  workoutId?: string | null;
  workoutName?: string;
  workoutCompletedAt?: string;
}
