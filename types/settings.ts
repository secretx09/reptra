export type WeightUnit = 'lb' | 'kg';

export interface AppSettings {
  weightUnit: WeightUnit;
  restTimerPresets: number[];
}
