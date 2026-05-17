import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  type ChartConfiguration,
  type ChartData
} from 'chart.js';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { MealService } from '../../core/services/meal.service';
import { ProfileService } from '../../core/services/profile.service';
import { Meal } from '../../core/types/meal';
import { AddMealDialogComponent } from '../meals/add-meal-dialog.component';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

type StatusKind = 'on-track' | 'caution' | 'over' | 'behind' | 'hit';

interface StatusBanner {
  kind: StatusKind;
  message: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, BaseChartDirective],
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
  readonly weekMeals = signal<Meal[]>([]);
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
    const ratio = consumed / target;

    if (p.goal === 'LOSE' || p.goal === 'MAINTAIN') {
      if (ratio > 1) {
        return { kind: 'over', message: `Over by ${Math.round(consumed - target)} kcal today` };
      }
      if (ratio >= 0.85) {
        return { kind: 'caution', message: `Almost at limit — ${Math.round(remaining)} kcal left` };
      }
      return { kind: 'on-track', message: `On track — ${Math.round(remaining)} kcal left` };
    }

    if (ratio >= 1) {
      return { kind: 'hit', message: `Hit your target. ${Math.round(consumed - target)} kcal over` };
    }
    if (ratio >= 0.85) {
      return { kind: 'caution', message: `Almost there — ${Math.round(remaining)} more kcal` };
    }
    return { kind: 'behind', message: `Need ${Math.round(remaining)} more kcal to hit your bulk target` };
  });

  readonly weekChartData = computed<ChartData<'bar'>>(() => {
    const grouped = this.groupByDate(this.weekMeals());
    const days = this.last7Days();
    const todayIdx = days.length - 1;
    const data = days.map((d) => grouped.get(d) ?? 0);
    const labels = days.map((d, i) =>
      i === todayIdx ? `${this.shortDay(d)} · today` : this.shortDay(d)
    );

    return {
      labels,
      datasets: [
        {
          label: 'Calories',
          data,
          backgroundColor: data.map((_, i) =>
            i === todayIdx ? 'rgba(167, 139, 250, 0.95)' : 'rgba(167, 139, 250, 0.4)'
          ),
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 38
        }
      ]
    };
  });

  readonly weekChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        padding: 10,
        boxPadding: 8,
        callbacks: {
          label: (ctx) => `${Math.round(ctx.parsed.y ?? 0)} kcal`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#a1a1aa', font: { family: 'JetBrains Mono, monospace', size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#a1a1aa', font: { family: 'JetBrains Mono, monospace', size: 11 } }
      }
    }
  };

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

  private loadMeals(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin({
      today: this.mealService.forDate(MealService.todayIso()),
      week: this.mealService.week()
    }).subscribe({
      next: ({ today, week }) => {
        this.todayMeals.set(today);
        this.weekMeals.set(week);
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

  private groupByDate(meals: Meal[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const m of meals) {
      map.set(m.date, (map.get(m.date) ?? 0) + (m.totalCalories ?? 0));
    }
    return map;
  }

  private last7Days(): string[] {
    const days: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
    return days;
  }

  private shortDay(isoDate: string): string {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString([], { weekday: 'short' });
  }

  private barColor(_value: number): string {
    return 'rgba(167, 139, 250, 0.7)';
  }
}
