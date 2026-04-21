export type WeightUnit = 'lb' | 'kg';
export type AppTheme = 'graphite' | 'midnight';

export interface AppSettings {
  weightUnit: WeightUnit;
  defaultRestTimerSeconds: number;
  theme: AppTheme;
}
