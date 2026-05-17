import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ProfileService } from './profile.service';

interface LoginPayload {
  username: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

const TOKEN_KEY = 'calorie_ai_token';
const USERNAME_KEY = 'calorie_ai_username';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly profileService = inject(ProfileService);
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly usernameSignal = signal<string | null>(localStorage.getItem(USERNAME_KEY));

  readonly token = this.tokenSignal.asReadonly();
  readonly username = this.usernameSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  login(payload: LoginPayload): Observable<string> {
    return this.http
      .post(`${this.apiUrl}/login`, payload, { responseType: 'text' })
      .pipe(tap((token) => this.persistSession(token, payload.username)));
  }

  register(payload: RegisterPayload): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, payload, { responseType: 'text' });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    this.tokenSignal.set(null);
    this.usernameSignal.set(null);
    this.profileService.clear();
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private persistSession(token: string, username: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
    this.tokenSignal.set(token);
    this.usernameSignal.set(username);
  }
}
