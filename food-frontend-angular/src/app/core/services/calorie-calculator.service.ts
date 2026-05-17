import { Injectable } from '@angular/core';

import { Gender, Goal, GoalRate } from '../types/profile';

/**
 * Mirror of backend CalorieCalculator (Mifflin-St Jeor BMR + PAL TDEE + goal adjustment).
 * Used for live preview in the wizard and profile editor. Backend remains authoritative on save.
 */
@Injectable({ providedIn: 'root' })
export class CalorieCalculatorService {
  private static readonly FLOOR_MALE = 1500;
  private static readonly FLOOR_FEMALE = 1200;

  bmr(gender: Gender | null, weightKg: number | null, heightCm: number | null, age: number | null): number {
    if (!gender || weightKg == null || heightCm == null || age == null) {
      return 0;
    }
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === 'FEMALE' ? base - 161 : base + 5;
  }

  tdee(bmr: number, activityLevel: number | null): number {
    if (!activityLevel || bmr === 0) {
      return 0;
    }
    return bmr * activityLevel;
  }

  goalAdjustment(goal: Goal | null, rate: GoalRate | null): number {
    if (!goal || goal === 'MAINTAIN' || !rate) {
      return 0;
    }
    const magnitude = rate === 'LIGHT' ? 250 : rate === 'MODERATE' ? 500 : 750;
    return goal === 'LOSE' ? -magnitude : magnitude;
  }

  dailyTarget(params: {
    gender: Gender | null;
    weight: number | null;
    height: number | null;
    age: number | null;
    activityLevel: number | null;
    goal: Goal | null;
    goalRate: GoalRate | null;
  }): number {
    const bmr = this.bmr(params.gender, params.weight, params.height, params.age);
    const tdee = this.tdee(bmr, params.activityLevel);
    if (tdee === 0 || !params.goal) {
      return 0;
    }
    const target = tdee + this.goalAdjustment(params.goal, params.goalRate);
    const floor = params.gender === 'FEMALE'
      ? CalorieCalculatorService.FLOOR_FEMALE
      : CalorieCalculatorService.FLOOR_MALE;
    return Math.round(Math.max(target, floor));
  }

  proteinGrams(calories: number, pct: number): number {
    return Math.round((calories * pct / 100) / 4);
  }

  carbGrams(calories: number, pct: number): number {
    return Math.round((calories * pct / 100) / 4);
  }

  fatGrams(calories: number, pct: number): number {
    return Math.round((calories * pct / 100) / 9);
  }
}
