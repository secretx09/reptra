import { AppTheme } from '../types/settings';

export type ThemePalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  subtext: string;
  accent: string;
  accentMuted: string;
  destructive: string;
};

const palettes: Record<AppTheme, ThemePalette> = {
  graphite: {
    background: '#111111',
    surface: '#171717',
    surfaceAlt: '#1c1c1c',
    border: '#2e2e2e',
    text: '#ffffff',
    subtext: '#aaaaaa',
    accent: '#4da6ff',
    accentMuted: '#16324d',
    destructive: '#ff8a8a',
  },
  midnight: {
    background: '#050505',
    surface: '#101010',
    surfaceAlt: '#161616',
    border: '#242424',
    text: '#ffffff',
    subtext: '#9a9a9a',
    accent: '#63c2ff',
    accentMuted: '#11283a',
    destructive: '#ff9f9f',
  },
};

export function getThemePalette(theme: AppTheme) {
  return palettes[theme];
}
