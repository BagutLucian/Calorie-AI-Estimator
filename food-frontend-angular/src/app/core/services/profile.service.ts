import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ProfileDto, ProfileUpdatePayload } from '../types/profile';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/profile`;

  private readonly profileSignal = signal<ProfileDto | null>(null);
  readonly profile = this.profileSignal.asReadonly();
  readonly isComplete = computed(() => {
    const p = this.profileSignal();
    return p !== null && p.goal !== null;
  });

  load(): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${this.apiUrl}/me`).pipe(
      tap((p) => this.profileSignal.set(p))
    );
  }

  update(payload: ProfileUpdatePayload): Observable<ProfileDto> {
    return this.http.post<ProfileDto>(`${this.apiUrl}/update`, payload).pipe(
      tap((p) => this.profileSignal.set(p))
    );
  }

  clear(): void {
    this.profileSignal.set(null);
  }
}
