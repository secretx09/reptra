export interface ExerciseDemoMedia {
  type: 'video' | 'gif';
  url: string;
  title: string;
  sourceLabel?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  demoMedia?: ExerciseDemoMedia;
  instructions: string[];
  isCustom: boolean;
}
