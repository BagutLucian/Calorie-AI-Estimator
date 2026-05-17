import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface FoodSearchResult {
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  imageUrl: string | null;
}

/**
 * Talks to the Java backend, which proxies the Open Food Facts search.
 * We don't hit OFF directly from the browser — CORS + JWT-leak avoidance.
 */
@Injectable({ providedIn: 'root' })
export class FoodSearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/foods`;

  search(term: string, pageSize = 12): Observable<FoodSearchResult[]> {
    const params = new HttpParams()
      .set('term', term)
      .set('pageSize', String(pageSize));
    return this.http.get<FoodSearchResult[]>(`${this.apiUrl}/search`, { params });
  }
}
