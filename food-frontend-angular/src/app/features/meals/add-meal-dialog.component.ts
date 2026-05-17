import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { MealService } from '../../core/services/meal.service';
import { FoodSearchResult, FoodSearchService } from '../../core/services/food-search.service';
import { AiPrediction, MealSavePayload } from '../../core/types/meal';

type AddMode = 'photo' | 'search';

@Component({
  selector: 'app-add-meal-dialog',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './add-meal-dialog.component.html',
  styleUrl: './add-meal-dialog.component.scss'
})
export class AddMealDialogComponent {
  private readonly mealService = inject(MealService);
  private readonly foodSearch = inject(FoodSearchService);
  private readonly dialogRef = inject(MatDialogRef<AddMealDialogComponent>);

  readonly mode = signal<AddMode>('photo');

  // Form fields (always editable)
  readonly foodName = signal('');
  readonly caloriesPer100g = signal<number | null>(null);
  readonly protein = signal<number | null>(null);
  readonly carbs = signal<number | null>(null);
  readonly fats = signal<number | null>(null);
  readonly weightInGrams = signal<number | null>(null);

  // Photo path
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);
  readonly analyzing = signal(false);
  readonly aiPredictions = signal<AiPrediction[] | null>(null);
  readonly aiError = signal<string | null>(null);

  // Search path
  readonly searchTerm = signal('');
  readonly searchLoading = signal(false);
  readonly searchError = signal<string | null>(null);
  private readonly searchInput$ = new Subject<string>();
  readonly searchResults = toSignal(
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        const t = term.trim();
        if (t.length < 2) {
          this.searchLoading.set(false);
          this.searchError.set(null);
          return of([] as FoodSearchResult[]);
        }
        this.searchLoading.set(true);
        this.searchError.set(null);
        return this.foodSearch.search(t).pipe(
          catchError(() => {
            this.searchError.set('Search failed. Try again.');
            return of([] as FoodSearchResult[]);
          }),
          finalize(() => this.searchLoading.set(false))
        );
      })
    ),
    { initialValue: [] as FoodSearchResult[] }
  );

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly totalCalories = computed(() => {
    const kcal = this.caloriesPer100g();
    const grams = this.weightInGrams();
    if (kcal == null || grams == null) return 0;
    return Math.round((kcal * grams) / 100);
  });

  /** Atwater factors: 4 kcal/g for protein & carbs, 9 kcal/g for fat. */
  readonly theoreticalKcal = computed(() => {
    const p = this.protein();
    const c = this.carbs();
    const f = this.fats();
    if (p == null || c == null || f == null) return null;
    if (p + c + f === 0) return null;
    return Math.round(4 * p + 4 * c + 9 * f);
  });

  readonly kcalMismatch = computed(() => {
    const theo = this.theoreticalKcal();
    const actual = this.caloriesPer100g();
    if (theo === null || actual == null || actual === 0) return false;
    return Math.abs(actual - theo) / theo > 0.15;
  });

  readonly kcalTooltip = computed(() => {
    const theo = this.theoreticalKcal();
    if (theo === null) {
      return '4·P + 4·C + 9·F kcal\n(per 100g)';
    }
    if (this.kcalMismatch()) {
      return `Expected ≈ ${theo} kcal\n (4·P + 4·C + 9·F)`;
    }
    return `4·P + 4·C + 9·F\n= ${theo} kcal`;
  });

  readonly canSave = computed(() =>
    this.foodName().trim().length > 0 &&
    this.caloriesPer100g() != null && this.caloriesPer100g()! >= 0 &&
    this.weightInGrams() != null && this.weightInGrams()! > 0
  );

  constructor() {
    // Auto-fill kcal/100g from macros when user typed all 3 macros and kcal is still empty.
    effect(() => {
      const theo = this.theoreticalKcal();
      const currentKcal = untracked(() => this.caloriesPer100g());
      if (theo !== null && currentKcal === null) {
        this.caloriesPer100g.set(theo);
      }
    });
  }

  setMode(m: AddMode): void {
    this.mode.set(m);
  }

  // --- Photo ---

  onImagePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedImage.set(file);
    this.aiPredictions.set(null);
    this.aiError.set(null);

    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);

    this.analyzing.set(true);
    this.mealService.analyzeImage(file).subscribe({
      next: (preds) => {
        this.aiPredictions.set(preds);
        this.analyzing.set(false);
      },
      error: () => {
        this.aiError.set('AI could not analyze the image. Enter the meal manually.');
        this.analyzing.set(false);
      }
    });
  }

  pickPrediction(pred: AiPrediction): void {
    this.foodName.set(this.prettifyName(pred.food));
    this.caloriesPer100g.set(pred.calories_per_100g);
    this.protein.set(pred.protein_per_100g);
    this.carbs.set(pred.carbs_per_100g);
    this.fats.set(pred.fats_per_100g);
    if (this.weightInGrams() == null) this.weightInGrams.set(100);
  }

  clearImage(): void {
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    this.aiPredictions.set(null);
    this.aiError.set(null);
  }

  // --- Search ---

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.searchInput$.next(value);
  }

  pickSearchResult(r: FoodSearchResult): void {
    this.foodName.set(r.brand ? `${r.name} (${r.brand})` : r.name);
    this.caloriesPer100g.set(r.caloriesPer100g);
    this.protein.set(r.proteinPer100g);
    this.carbs.set(r.carbsPer100g);
    this.fats.set(r.fatsPer100g);
    if (this.weightInGrams() == null) this.weightInGrams.set(100);
  }

  // --- Save ---

  save(): void {
    if (!this.canSave() || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);

    const payload: MealSavePayload = {
      foodName: this.foodName().trim(),
      caloriesPer100g: this.caloriesPer100g()!,
      weightInGrams: this.weightInGrams()!,
      protein: this.protein() ?? 0,
      carbs: this.carbs() ?? 0,
      fats: this.fats() ?? 0
    };

    this.mealService.save(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Could not save the meal. Please try again.');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private prettifyName(slug: string): string {
    return slug
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
