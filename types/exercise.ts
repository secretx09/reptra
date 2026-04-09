export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions: string[];
  commonMistakes: string[];
  isCustom: boolean;
}