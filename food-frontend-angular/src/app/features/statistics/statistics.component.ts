import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartConfiguration,
  type ChartData
} from 'chart.js';

import { MealService } from '../../core/services/meal.service';
import { ProfileService } from '../../core/services/profile.service';
import { Meal } from '../../core/types/meal';
import { categorizeDay } from '../../core/utils/categorize-day';

Chart.register(
  BarController, BarElement,
  LineController, LineElement, PointElement,
  DoughnutController, ArcElement,
  CategoryScale, LinearScale, Tooltip, Legend
);

type WindowDays = 7 | 30 | 90;

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [DecimalPipe, BaseChartDirective],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent {
  private readonly mealService = inject(MealService);
  private readonly profileService = inject(ProfileService);

  readonly profile = this.profileService.profile;

  readonly windowOptions: ReadonlyArray<{ value: WindowDays; label: string }> = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' }
  ];

  readonly windowDays = signal<WindowDays>(30);
  readonly meals = signal<Meal[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly days = computed<string[]>(() => {
    const n = this.windowDays();
    const out: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      out.push(this.toIso(d));
    }
    return out;
  });

  readonly dailyCalories = computed(() => {
    const grouped = this.groupByDate(this.meals());
    return this.days().map((d) => grouped.get(d) ?? 0);
  });

  readonly daysWithData = computed(() => this.dailyCalories().filter((c) => c > 0).length);

  readonly avgCalories = computed(() => {
    const totals = this.dailyCalories().filter((c) => c > 0);
    if (totals.length === 0) return 0;
    return Math.round(totals.reduce((s, v) => s + v, 0) / totals.length);
  });

  readonly adherence = computed(() => {
    const target = this.profile()?.dailyCalorieGoal ?? 0;
    const goal = this.profile()?.goal;
    if (target === 0 || !goal) return { good: 0, caution: 0, bad: 0, logged: 0 };

    let good = 0, caution = 0, bad = 0;
    for (const c of this.dailyCalories()) {
      if (c === 0) continue;
      const kind = categorizeDay(c / target, goal);
      if (kind === 'good') good++;
      else if (kind === 'caution') caution++;
      else bad++;
    }
    return { good, caution, bad, logged: good + caution + bad };
  });

  readonly avgMacros = computed(() => {
    const meals = this.meals();
    const grouped = new Map<string, { p: number; c: number; f: number }>();
    for (const m of meals) {
      const cur = grouped.get(m.date) ?? { p: 0, c: 0, f: 0 };
      cur.p += m.protein ?? 0;
      cur.c += m.carbs ?? 0;
      cur.f += m.fats ?? 0;
      grouped.set(m.date, cur);
    }
    const totals = Array.from(grouped.values());
    if (totals.length === 0) return { protein: 0, carbs: 0, fats: 0 };
    return {
      protein: Math.round(totals.reduce((s, v) => s + v.p, 0) / totals.length),
      carbs: Math.round(totals.reduce((s, v) => s + v.c, 0) / totals.length),
      fats: Math.round(totals.reduce((s, v) => s + v.f, 0) / totals.length)
    };
  });

  readonly trendChartData = computed<ChartData<'line'>>(() => {
    const data = this.dailyCalories();
    const labels = this.days().map((d) => this.shortLabel(d));
    const profile = this.profile();
    const target = profile?.dailyCalorieGoal ?? 0;
    const goal = profile?.goal;

    const pointColors = data.map((c) => {
      if (c === 0) return 'rgba(0,0,0,0)';
      if (target === 0 || !goal) return 'rgba(255, 255, 255, 0.7)';
      const kind = categorizeDay(c / target, goal);
      if (kind === 'good') return 'rgba(87, 126, 101, 0.95)';
      if (kind === 'caution') return 'rgba(245, 158, 11, 0.95)';
      return 'rgba(255, 188, 175, 0.95)';
    });

    const datasets: ChartData<'line'>['datasets'] = [
      {
        label: 'kcal',
        data,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: pointColors,
        pointBorderWidth: 0,
        tension: 0.25,
        fill: true
      }
    ];

    if (target > 0) {
      datasets.push({
        label: 'Target',
        data: this.days().map(() => target),
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0
      });
    }

    return { labels, datasets };
  });

  readonly trendChartOptions: ChartConfiguration<'line'>['options'] = {
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
      x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { family: 'Roboto Mono, monospace', size: 10 }, maxRotation: 0, autoSkip: true } },
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { family: 'Roboto Mono, monospace', size: 10 } } }
    }
  };

  readonly adherenceChartData = computed<ChartData<'doughnut'>>(() => {
    const a = this.adherence();
    return {
      labels: ['On track', 'Caution', 'Off track'],
      datasets: [
        {
          data: [a.good, a.caution, a.bad],
          backgroundColor: [
            'rgba(87, 126, 101, 0.85)',
            'rgba(245, 158, 11, 0.75)',
            'rgba(255, 188, 175, 0.75)'
          ],
          borderColor: '#18181b',
          borderWidth: 2
        }
      ]
    };
  });

  readonly adherenceChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#a1a1aa',
          font: { family: 'Roboto Mono, monospace', size: 10 },
          padding: 12,
          boxWidth: 10,
          boxHeight: 10
        }
      },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        padding: 10,
        boxPadding: 8,
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.parsed} ${ctx.parsed === 1 ? 'day' : 'days'}`
        }
      }
    }
  };

  readonly macrosChartData = computed<ChartData<'bar'>>(() => {
    const actual = this.avgMacros();
    const p = this.profile();
    const tgt = {
      protein: p?.proteinGrams ?? 0,
      carbs: p?.carbGrams ?? 0,
      fats: p?.fatGrams ?? 0
    };

    return {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [
        {
          label: 'Average',
          data: [actual.protein, actual.carbs, actual.fats],
          backgroundColor: 'rgba(167, 139, 250, 0.7)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 44,
          categoryPercentage: 0.55,
          barPercentage: 1.0
        },
        {
          label: 'Target',
          data: [tgt.protein, tgt.carbs, tgt.fats],
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 44,
          categoryPercentage: 0.55,
          barPercentage: 1.0
        }
      ]
    };
  });

  readonly macrosChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#a1a1aa',
          font: { family: 'Roboto Mono, monospace', size: 10 },
          padding: 12,
          boxWidth: 10,
          boxHeight: 10
        }
      },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        padding: 10,
        boxPadding: 8,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y ?? 0)}g`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { family: 'Roboto Mono, monospace', size: 10 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { family: 'Roboto Mono, monospace', size: 10 } } }
    }
  };

  constructor() {
    if (!this.profileService.profile()) {
      this.profileService.load().subscribe();
    }
    this.loadWindow();
  }

  setWindow(n: WindowDays): void {
    if (this.windowDays() === n) return;
    this.windowDays.set(n);
    this.loadWindow();
  }

  private loadWindow(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const days = this.days();
    const start = days[0];
    const end = days[days.length - 1];
    this.mealService.range(start, end).subscribe({
      next: (meals) => {
        this.meals.set(meals);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load statistics.');
      }
    });
  }

  private groupByDate(meals: Meal[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const m of meals) {
      map.set(m.date, (map.get(m.date) ?? 0) + (m.totalCalories ?? 0));
    }
    return map;
  }

  private toIso(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private shortLabel(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
