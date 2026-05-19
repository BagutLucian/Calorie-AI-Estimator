import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/services/auth.service';
import { MealService } from '../../core/services/meal.service';
import { ProfileService } from '../../core/services/profile.service';
import { Meal } from '../../core/types/meal';
import { DayKind, categorizeDay } from '../../core/utils/categorize-day';
import { AddMealDialogComponent } from '../meals/add-meal-dialog.component';

interface StatusBanner {
  kind: DayKind;
  message: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, MatTooltipModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly mealService = inject(MealService);
  private readonly dialog = inject(MatDialog);

  readonly username = this.auth.username;
  readonly profile = this.profileService.profile;

  readonly todayMeals = signal<Meal[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly todayConsumed = computed(() => {
    const meals = this.todayMeals();
    return meals.reduce(
      (acc, m) => {
        acc.calories += m.totalCalories ?? 0;
        acc.protein += m.protein ?? 0;
        acc.carbs += m.carbs ?? 0;
        acc.fats += m.fats ?? 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  });

  readonly progressPct = computed(() => {
    const target = this.profile()?.dailyCalorieGoal ?? 0;
    if (target === 0) return 0;
    return Math.min(100, Math.round((this.todayConsumed().calories / target) * 100));
  });

  readonly proteinPct = computed(() => this.macroPct('protein'));
  readonly carbsPct = computed(() => this.macroPct('carbs'));
  readonly fatsPct = computed(() => this.macroPct('fats'));

  readonly status = computed<StatusBanner | null>(() => {
    const p = this.profile();
    if (!p || p.dailyCalorieGoal == null || !p.goal) return null;
    const consumed = this.todayConsumed().calories;
    const target = p.dailyCalorieGoal;
    const remaining = target - consumed;
    const diff = Math.round(Math.abs(consumed - target));
    const ratio = consumed / target;
    const kind = categorizeDay(ratio, p.goal);

    if (p.goal === 'LOSE') {
      if (kind === 'bad') return { kind, message: `Over by ${diff} kcal today` };
      if (kind === 'caution') return { kind, message: `Near limit — ${Math.round(remaining)} kcal left` };
      return { kind, message: `On track — ${Math.round(remaining)} kcal left` };
    }

    if (p.goal === 'MAINTAIN') {
      if (kind === 'bad') return { kind, message: consumed > target ? `Over by ${diff} kcal today` : `Under by ${diff} kcal today` };
      if (kind === 'caution') return { kind, message: consumed < target ? `Slightly under — ${diff} kcal` : `Slightly over — ${diff} kcal` };
      return { kind, message: `On target today` };
    }

    // GAIN / MUSCLE_GAIN
    if (kind === 'good') {
      return { kind, message: consumed > target ? `Hit your target — ${diff} kcal over` : `Hit your target` };
    }
    if (kind === 'caution') {
      return { kind, message: `Almost there — ${Math.round(remaining)} more kcal` };
    }
    return { kind, message: `Need ${Math.round(remaining)} more kcal to hit your bulk target` };
  });

  constructor() {
    if (!this.profileService.profile()) {
      this.profileService.load().subscribe();
    }
    this.loadMeals();
  }

  formatTime(isoDateTime: string | null): string {
    if (!isoDateTime) return '';
    const d = new Date(isoDateTime);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onAddMeal(): void {
    const ref = this.dialog.open(AddMealDialogComponent, {
      width: '880px',
      maxWidth: '95vw',
      panelClass: 'app-dialog-panel'
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadMeals();
      }
    });
  }

  deleteMeal(mealId: number, event: Event): void {
    event.stopPropagation();
    this.mealService.delete(mealId).subscribe({
      next: () => this.loadMeals(),
      error: () => this.errorMessage.set('Could not delete meal. Please try again.')
    });
  }

  private loadMeals(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.mealService.forDate(MealService.todayIso()).subscribe({
      next: (meals) => {
        this.todayMeals.set(meals);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load meal data. Please try again later.');
      }
    });
  }

  private macroPct(macro: 'protein' | 'carbs' | 'fats'): number {
    const p = this.profile();
    if (!p) return 0;
    const targetGrams =
      macro === 'protein' ? p.proteinGrams :
      macro === 'carbs' ? p.carbGrams :
      p.fatGrams;
    if (!targetGrams || targetGrams === 0) return 0;
    const consumed = this.todayConsumed()[macro];
    return Math.min(100, Math.round((consumed / targetGrams) * 100));
  }
}
