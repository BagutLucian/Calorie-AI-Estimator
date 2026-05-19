export interface Meal {
  id: number;
  foodName: string;
  caloriesPer100g: number;
  weightInGrams: number | null;
  totalCalories: number | null;
  consumedAt: string | null;
  date: string;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealSavePayload {
  foodName: string;
  caloriesPer100g: number;
  weightInGrams: number;
  protein: number;
  carbs: number;
  fats: number;
  date?: string;
}

export interface AiPrediction {
  rank: number;
  food: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  confidence_percentage: number;
}
