import { Goal } from '../types/profile';

export type DayKind = 'good' | 'caution' | 'bad';

/**
 * Goal-aware classification of a day based on the consumed/target calorie ratio.
 * Same logic used by History calendar, History status badge, and Statistics adherence
 * so the visuals stay consistent across pages.
 */
export function categorizeDay(ratio: number, goal: Goal): DayKind {
  switch (goal) {
    case 'LOSE':
      if (ratio > 1.0) return 'bad';
      if (ratio >= 0.85) return 'caution';
      return 'good';
    case 'MAINTAIN':
      if (ratio > 1.1 || ratio < 0.8) return 'bad';
      if (ratio < 0.9 || ratio > 1.0) return 'caution';
      return 'good';
    case 'GAIN':
    case 'MUSCLE_GAIN':
      if (ratio >= 1.0) return 'good';
      if (ratio >= 0.85) return 'caution';
      return 'bad';
  }
}
