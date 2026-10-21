import { Component, OnInit, inject, signal } from '@angular/core';
import { UserProfile } from './models/auth.models';

import { AuthService } from './services/auth.service';


@Component({
  selector: 'app-root',
 
  standalone: false,
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
})
export class App implements OnInit {
protected readonly auth = inject(AuthService); // protected so the template can read auth.isLoggedIn()

readonly profile = signal<UserProfile | null>(null); // user data returned by /me
readonly error = signal<string | null>(null); // message if /me fails

ngOnInit(): void {
// Runs once when the app starts. After a page refresh with a stored token, load the profile.
if (this.auth.isLoggedIn()) {
this.loadProfile();
}
}

// Calls GET /api/auth/me. Also called by the sign-up form after a successful sign-up.
loadProfile(): void {
this.profile.set(null); // clear any old user so it never flashes on screen
this.error.set(null);
this.auth.getMe().subscribe({
next: profile => this.profile.set(profile),
error: () => this.error.set('Could not load your profile.')
});
}

logout(): void {
this.profile.set(null);
this.error.set(null);
this.auth.logout(); // clears the token; the template switches to the sign-up form
}
}