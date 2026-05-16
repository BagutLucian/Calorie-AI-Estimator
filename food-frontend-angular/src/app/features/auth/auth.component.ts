import { Component, signal } from '@angular/core';

import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [LoginComponent, RegisterComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  readonly mode = signal<AuthMode>('login');

  switchTo(mode: AuthMode): void {
    this.mode.set(mode);
  }
}
