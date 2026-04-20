export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  instructions: string[];
  commonMistakes: string[];
  isCustom: boolean;
}
