import type { Landmark } from './types';

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);
export const midpoint = (a: Landmark, b: Landmark): Landmark => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const standardDeviation = (values: number[]) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
};
export const ema = (previous: number | undefined, next: number) => previous === undefined ? next : 0.3 * next + 0.7 * previous;
