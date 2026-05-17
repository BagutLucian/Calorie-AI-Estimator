export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type Goal = 'LOSE' | 'MAINTAIN' | 'GAIN' | 'MUSCLE_GAIN';

export type GoalRate = 'LIGHT' | 'MODERATE' | 'AGGRESSIVE';

export type MacrosPreset = 'STANDARD' | 'HIGH_PROTEIN' | 'LOW_CARB';

export interface MacrosSplit {
  proteinPct: number;
  carbPct: number;
  fatPct: number;
}

export const MACROS_PRESETS: Record<MacrosPreset, MacrosSplit> = {
  STANDARD: { proteinPct: 30, carbPct: 40, fatPct: 30 },
  HIGH_PROTEIN: { proteinPct: 40, carbPct: 35, fatPct: 25 },
  LOW_CARB: { proteinPct: 25, carbPct: 20, fatPct: 55 }
};

export interface ProfileDto {
  username: string;
  email: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  gender: Gender | null;
  activityLevel: number | null;
  goal: Goal | null;
  goalRate: GoalRate | null;
  targetWeight: number | null;
  proteinPct: number | null;
  carbPct: number | null;
  fatPct: number | null;
  dailyCalorieGoal: number | null;
  proteinGrams: number | null;
  carbGrams: number | null;
  fatGrams: number | null;
}

export interface ProfileUpdatePayload {
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  activityLevel: number;
  goal: Goal;
  goalRate: GoalRate | null;
  targetWeight: number | null;
  proteinPct: number;
  carbPct: number;
  fatPct: number;
}
