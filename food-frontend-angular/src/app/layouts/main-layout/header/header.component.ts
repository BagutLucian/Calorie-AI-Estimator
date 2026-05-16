import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly username = this.auth.username;
  readonly initials = computed(() => {
    const name = this.username();
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  });

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
