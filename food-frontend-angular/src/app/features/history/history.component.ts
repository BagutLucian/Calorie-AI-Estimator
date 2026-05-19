import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCalendar } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { MealService } from '../../core/services/meal.service';
import { ProfileService } from '../../core/services/profile.service';
import { Meal } from '../../core/types/meal';
import { Goal } from '../../core/types/profile';
import { DayKind, categorizeDay } from '../../core/utils/categorize-day';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DecimalPipe, MatCalendar, MatIconModule, MatTooltipModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent {
  readonly calendar = viewChild(MatCalendar<Date>);

  private readonly mealService = inject(MealService);
  private readonly profileService = inject(ProfileService);

  readonly profile = this.profileService.profile;

  readonly monthStart = signal<Date>(this.firstOfMonth(new Date()));
  readonly selectedDate = signal<Date | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly monthMeals = signal<Meal[]>([]);

  readonly calendarMounted = signal(true);

  readonly today = new Date();

  private readonly mealsByDate = computed(() => {
    const map = new Map<string, Meal[]>();
    for (const m of this.monthMeals()) {
      const arr = map.get(m.date) ?? [];
      arr.push(m);
      map.set(m.date, arr);
    }
    return map;
  });

  readonly selectedDayMeals = computed<Meal[]>(() => {
    const sel = this.selectedDate();
    if (!sel) return [];
    return this.mealsByDate().get(this.toIso(sel)) ?? [];
  });

  readonly selectedDayTotals = computed(() => {
    const meals = this.selectedDayMeals();
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
    return Math.min(100, Math.round((this.selectedDayTotals().calories / target) * 100));
  });

  readonly proteinPct = computed(() => this.macroPct('protein'));
  readonly carbsPct = computed(() => this.macroPct('carbs'));
  readonly fatsPct = computed(() => this.macroPct('fats'));

  private macroPct(macro: 'protein' | 'carbs' | 'fats'): number {
    const p = this.profile();
    if (!p) return 0;
    const targetGrams =
      macro === 'protein' ? p.proteinGrams :
      macro === 'carbs' ? p.carbGrams :
      p.fatGrams;
    if (!targetGrams || targetGrams === 0) return 0;
    const consumed = this.selectedDayTotals()[macro];
    return Math.min(100, Math.round((consumed / targetGrams) * 100));
  }

  readonly dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    if (date > this.today) return false;
    return true;
  };

  readonly dateClassFn = computed(() => {
    const map = this.mealsByDate();
    const profile = this.profile();
    const target = profile?.dailyCalorieGoal ?? 0;
    const goal = profile?.goal ?? null;
    return (date: Date): string => {
      const iso = this.toIso(date);
      const meals = map.get(iso);
      if (!meals || meals.length === 0) return '';
      if (target === 0 || !goal) return 'hist-day-logged';
      const total = meals.reduce((s, m) => s + (m.totalCalories ?? 0), 0);
      return `hist-day-${categorizeDay(total / target, goal)}`;
    };
  });

  readonly selectedDayStatus = computed<{ kind: DayKind; message: string } | null>(() => {
    if (!this.selectedDate()) return null;
    const meals = this.selectedDayMeals();
    if (meals.length === 0) return null;
    const profile = this.profile();
    const target = profile?.dailyCalorieGoal ?? 0;
    const goal = profile?.goal;
    if (target === 0 || !goal) return null;
    const consumed = this.selectedDayTotals().calories;
    const ratio = consumed / target;
    const kind = categorizeDay(ratio, goal);
    const message = this.statusMessage(kind, ratio, consumed, target, goal);
    return { kind, message };
  });

  private statusMessage(kind: DayKind, ratio: number, consumed: number, target: number, goal: Goal): string {
    const diff = Math.round(Math.abs(consumed - target));
    if (kind === 'good') {
      if (goal === 'LOSE') {
        if (ratio >= 0.9) return 'On target';
        return `In deficit — ${diff} kcal under`;
      }
      if (goal === 'MAINTAIN') return 'On target';

      if (consumed > target) return `Hit target — ${diff} kcal over`;
      return 'Hit target';
    }
    if (kind === 'caution') {
      if (goal === 'LOSE') return `Near limit — ${Math.round(target - consumed)} kcal left`;
      if (goal === 'MAINTAIN') return consumed < target ? `Slightly under — ${diff} kcal` : `Slightly over — ${diff} kcal`;

      return `Almost there — ${Math.round(target - consumed)} kcal more`;
    }

    if (goal === 'LOSE') return `Over by ${diff} kcal`;
    if (goal === 'MAINTAIN') return consumed > target ? `Over by ${diff} kcal` : `Under by ${diff} kcal`;

    return `Need ${Math.round(target - consumed)} kcal more`;
  }

  private stateSub: Subscription | null = null;

  constructor() {
    if (!this.profileService.profile()) {
      this.profileService.load().subscribe();
    }

    effect(() => {
      const cal = this.calendar();
      this.stateSub?.unsubscribe();
      this.stateSub = null;
      if (cal) {
        this.stateSub = cal.stateChanges.subscribe(() => {
          const active = cal.activeDate;
          if (!active) return;
          const newMonth = this.firstOfMonth(active);
          if (newMonth.getTime() !== this.monthStart().getTime()) {
            this.monthStart.set(newMonth);
            this.loadMonth(newMonth);
          }
        });
      }
    });

    this.loadMonth(this.monthStart());
  }

  onDateSelected(date: Date | null): void {
    if (!date) return;
    this.selectedDate.set(date);
  }

  deleteMeal(mealId: number, event: Event): void {
    event.stopPropagation();
    this.mealService.delete(mealId).subscribe({
      next: () => this.loadMonth(this.monthStart()),
      error: () => this.errorMessage.set('Could not delete meal. Please try again.')
    });
  }

  formatTime(isoDateTime: string | null): string {
    if (!isoDateTime) return '';
    const d = new Date(isoDateTime);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatSelectedDate(d: Date | null): string {
    if (!d) return '';
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  private loadMonth(monthStart: Date): void {
    const start = monthStart;
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    this.loading.set(true);
    this.errorMessage.set(null);
    this.mealService.range(this.toIso(start), this.toIso(end)).subscribe({
      next: (meals) => {
        this.monthMeals.set(meals);
        this.loading.set(false);

        this.calendarMounted.set(false);
        setTimeout(() => this.calendarMounted.set(true));
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load month data.');
      }
    });
  }

  private firstOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private toIso(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
