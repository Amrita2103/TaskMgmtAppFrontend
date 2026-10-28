import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly meResult = signal('');

  // Calls a protected endpoint to prove the bearer token + refresh flow work.
  callMe(): void {
    this.auth.getMe().subscribe({
      next: (result) => this.meResult.set(JSON.stringify(result)),
      error: (err) => this.meResult.set(`Failed: ${err.status}`),
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  // Revokes every session of this user on all devices.
  logoutAll(): void {
    this.auth.logoutAll().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
