import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/services/auth.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { ProfileService } from '../../core/services/profile.service';
import {
  Gender,
  Goal,
  GoalRate,
  MACROS_PRESETS,
  MacrosPreset,
  ProfileUpdatePayload
} from '../../core/types/profile';

interface ActivityOption {
  value: number;
  label: string;
  description: string;
}

interface GoalOption {
  value: Goal;
  label: string;
  description: string;
}

interface GoalRateOption {
  value: GoalRate;
  label: string;
  kcalPerDay: string;
  kgPerWeek: string;
}

interface MacrosOption {
  value: MacrosPreset;
  label: string;
  description: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, DecimalPipe, MatIconModule, MatTooltipModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly calculator = inject(CalorieCalculatorService);

  readonly username = this.auth.username;

  readonly gender = signal<Gender | null>(null);
  readonly age = signal<number | null>(null);
  readonly height = signal<number | null>(null);
  readonly weight = signal<number | null>(null);
  readonly activityLevel = signal<number | null>(null);
  readonly goal = signal<Goal | null>(null);
  readonly goalRate = signal<GoalRate | null>(null);
  readonly targetWeight = signal<number | null>(null);
  readonly macrosPreset = signal<MacrosPreset>('STANDARD');

  readonly loading = signal(false);
  readonly savedAt = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly activityOptions: ReadonlyArray<ActivityOption> = [
    { value: 1.2, label: 'Sedentary', description: 'Office job, little or no exercise' },
    { value: 1.375, label: 'Light', description: '1–3 days/week light exercise' },
    { value: 1.55, label: 'Moderate', description: '3–5 days/week moderate exercise' },
    { value: 1.725, label: 'Active', description: '6–7 days/week sport' },
    { value: 1.9, label: 'Very Active', description: 'Daily intense / physical job' }
  ];

  readonly goalOptions: ReadonlyArray<GoalOption> = [
    { value: 'LOSE', label: 'Lose weight', description: 'Calorie deficit' },
    { value: 'MAINTAIN', label: 'Maintain', description: 'Stay where you are' },
    { value: 'GAIN', label: 'Gain weight', description: 'Calorie surplus' },
    { value: 'MUSCLE_GAIN', label: 'Build muscle', description: 'Lean bulk, high protein' }
  ];

  readonly goalRateOptions: ReadonlyArray<GoalRateOption> = [
    { value: 'LIGHT', label: 'Light', kcalPerDay: '±250 kcal', kgPerWeek: '≈0.25 kg/wk' },
    { value: 'MODERATE', label: 'Moderate', kcalPerDay: '±500 kcal', kgPerWeek: '≈0.5 kg/wk' },
    { value: 'AGGRESSIVE', label: 'Aggressive', kcalPerDay: '±750 kcal', kgPerWeek: '≈0.75 kg/wk' }
  ];

  readonly macrosOptions: ReadonlyArray<MacrosOption> = [
    { value: 'STANDARD', label: 'Standard', description: '30P / 40C / 30F — balanced' },
    { value: 'HIGH_PROTEIN', label: 'High Protein', description: '40P / 35C / 25F — for muscle' },
    { value: 'LOW_CARB', label: 'Low Carb', description: '25P / 20C / 55F — for fat loss' }
  ];

  readonly needsRate = computed(() => {
    const g = this.goal();
    return g !== null && g !== 'MAINTAIN';
  });

  readonly bmr = computed(() =>
    this.calculator.bmr(this.gender(), this.weight(), this.height(), this.age())
  );

  readonly tdee = computed(() => this.calculator.tdee(this.bmr(), this.activityLevel()));

  readonly dailyTarget = computed(() =>
    this.calculator.dailyTarget({
      gender: this.gender(),
      weight: this.weight(),
      height: this.height(),
      age: this.age(),
      activityLevel: this.activityLevel(),
      goal: this.goal(),
      goalRate: this.goalRate()
    })
  );

  readonly rawDailyTarget = computed(() =>
    this.calculator.rawDailyTarget({
      gender: this.gender(),
      weight: this.weight(),
      height: this.height(),
      age: this.age(),
      activityLevel: this.activityLevel(),
      goal: this.goal(),
      goalRate: this.goalRate()
    })
  );

  readonly floorApplied = computed(() => {
    const raw = this.rawDailyTarget();
    if (raw <= 0) return false;
    const floor = this.calculator.floorForGender(this.gender());
    return raw < floor;
  });

  readonly floorTooltip = computed(
    () => `Safety minimum applied.\nCalculated target was ${this.rawDailyTarget()} kcal — below the safe lower limit.`
  );

  readonly currentMacros = computed(() => MACROS_PRESETS[this.macrosPreset()]);

  readonly macroGrams = computed(() => {
    const kcal = this.dailyTarget();
    const split = this.currentMacros();
    return {
      protein: this.calculator.proteinGrams(kcal, split.proteinPct),
      carbs: this.calculator.carbGrams(kcal, split.carbPct),
      fat: this.calculator.fatGrams(kcal, split.fatPct)
    };
  });

  readonly canSave = computed(() =>
    this.gender() !== null &&
    this.age() != null && this.age()! > 0 &&
    this.weight() != null && this.weight()! > 0 &&
    this.height() != null && this.height()! > 0 &&
    this.activityLevel() !== null &&
    this.goal() !== null &&
    (this.goal() === 'MAINTAIN' || this.goalRate() !== null)
  );

  constructor() {
    effect(() => {
      const profile = this.profileService.profile();
      if (!profile) return;
      this.gender.set(profile.gender);
      this.age.set(profile.age);
      this.height.set(profile.height);
      this.weight.set(profile.weight);
      this.activityLevel.set(profile.activityLevel);
      this.goal.set(profile.goal);
      this.goalRate.set(profile.goalRate);
      this.targetWeight.set(profile.targetWeight);
      const preset = this.detectPreset(profile.proteinPct, profile.carbPct, profile.fatPct);
      this.macrosPreset.set(preset);
    });

    if (!this.profileService.profile()) {
      this.profileService.load().subscribe();
    }
  }

  selectGender(g: Gender): void {
    this.gender.set(g);
  }

  selectActivity(level: number): void {
    this.activityLevel.set(level);
  }

  selectGoal(g: Goal): void {
    this.goal.set(g);
    if (g === 'MAINTAIN') {
      this.goalRate.set(null);
    }
    this.macrosPreset.set(this.defaultMacrosForGoal(g));
  }

  selectGoalRate(rate: GoalRate): void {
    this.goalRate.set(rate);
  }

  selectMacrosPreset(preset: MacrosPreset): void {
    this.macrosPreset.set(preset);
  }

  save(): void {
    if (!this.canSave() || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.savedAt.set(null);

    const split = this.currentMacros();
    const payload: ProfileUpdatePayload = {
      age: this.age()!,
      weight: this.weight()!,
      height: this.height()!,
      gender: this.gender()!,
      activityLevel: this.activityLevel()!,
      goal: this.goal()!,
      goalRate: this.goalRate(),
      targetWeight: this.targetWeight(),
      proteinPct: split.proteinPct,
      carbPct: split.carbPct,
      fatPct: split.fatPct
    };

    this.profileService.update(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.savedAt.set(Date.now());
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not save changes. Please try again.');
      }
    });
  }

  private defaultMacrosForGoal(g: Goal): MacrosPreset {
    switch (g) {
      case 'LOSE':
        return 'LOW_CARB';
      case 'MAINTAIN':
        return 'STANDARD';
      case 'GAIN':
      case 'MUSCLE_GAIN':
        return 'HIGH_PROTEIN';
    }
  }

  private detectPreset(p: number | null, c: number | null, f: number | null): MacrosPreset {
    if (p == null || c == null || f == null) return 'STANDARD';
    for (const [key, val] of Object.entries(MACROS_PRESETS)) {
      if (val.proteinPct === p && val.carbPct === c && val.fatPct === f) {
        return key as MacrosPreset;
      }
    }
    return 'STANDARD';
  }
}
