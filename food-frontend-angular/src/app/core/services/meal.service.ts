import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AiPrediction, Meal, MealSavePayload } from '../types/meal';

@Injectable({ providedIn: 'root' })
export class MealService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/meals`;

  forDate(date: string): Observable<Meal[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Meal[]>(`${this.apiUrl}/my-history`, { params });
  }

  week(): Observable<Meal[]> {
    return this.http.get<Meal[]>(`${this.apiUrl}/my-history/week`);
  }

  save(meal: MealSavePayload): Observable<string> {
    return this.http.post(`${this.apiUrl}/save`, meal, { responseType: 'text' });
  }

  analyzeImage(image: File): Observable<AiPrediction[]> {
    const form = new FormData();
    form.append('image', image);
    return this.http.post<AiPrediction[]>(`${this.apiUrl}/analyze-image`, form);
  }

  delete(mealId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete/${mealId}`, { responseType: 'text' });
  }

  static todayIso(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
