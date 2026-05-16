import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';

interface PasswordRule {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./auth-form.scss']
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);

  @Output() registered = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  username = '';
  password = '';
  confirmPassword = '';

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly passwordRules: ReadonlyArray<PasswordRule> = [
    { key: 'minLength', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { key: 'lowercase', label: 'At least one lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
    { key: 'uppercase', label: 'At least one uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { key: 'digit', label: 'At least one number (0-9)', test: (p) => /\d/.test(p) }
  ];

  passes(rule: PasswordRule): boolean {
    return rule.test(this.password);
  }

  passwordValid(): boolean {
    return this.passwordRules.every((rule) => rule.test(this.password));
  }

  passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
  }

  submit(form: NgForm): void {
    if (form.invalid || !this.passwordValid() || this.passwordMismatch() || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const syntheticEmail = `${this.username.toLowerCase()}@calorieai.local`;

    this.auth
      .register({ username: this.username, email: syntheticEmail, password: this.password })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Account created. You can now sign in.');
          setTimeout(() => this.registered.emit(), 800);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(this.extractError(err));
        }
      });
  }

  private extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const body = (err as { error: unknown }).error;
      if (typeof body === 'string' && body.length > 0) {
        return body;
      }
    }
    return 'Registration failed. Please try again.';
  }
}
