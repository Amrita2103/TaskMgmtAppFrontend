import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, SignUpRequest, UserProfile } from '../models/auth.models';

const TOKEN_KEY = 'tm_access_token'; // localStorage key for the JWT
const EXPIRY_KEY = 'tm_token_expiry'; // localStorage key for its expiry time

@Injectable({ providedIn: 'root' }) // one shared instance for the whole app
export class AuthService {
private readonly http = inject(HttpClient);
private readonly baseUrl = `${environment.apiUrl}/auth`; 

// Writable login state
private readonly loggedIn = signal(false);

// Read-only view for everyone else. 
readonly isLoggedIn = this.loggedIn.asReadonly();

constructor() {
// On app start (including a page refresh), check whether a valid token is already stored.
this.loggedIn.set(this.getToken() !== null);
}

// POST /api/auth/signup. On success, save the token so the user is signed in immediately.
signUp(request: SignUpRequest): Observable<AuthResponse> {
return this.http
.post<AuthResponse>(`${this.baseUrl}/signup`, request)
.pipe(tap(response => this.saveSession(response)));
}

// GET /api/auth/me. The interceptor adds the Bearer header automatically.
getMe(): Observable<UserProfile> {
return this.http.get<UserProfile>(`${this.baseUrl}/me`);
}

// Returns the stored token, or null if missing or expired.
getToken(): string | null {
const token = localStorage.getItem(TOKEN_KEY);
const expiry = localStorage.getItem(EXPIRY_KEY);
if (!token || !expiry) return null;

const expiresAt = Date.parse(expiry);
if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
this.clearSession(); // expired or unreadable: remove it and flip the UI to logged-out
return null;
}
return token;
}

// Clears the session. The UI switches back to the sign-up form because the signal changes.
logout(): void {
this.clearSession();
}

private saveSession(response: AuthResponse): void {
localStorage.setItem(TOKEN_KEY, response.accessToken);
localStorage.setItem(EXPIRY_KEY, response.expiresAtUtc);
this.loggedIn.set(true); // UI switches to the logged-in view
}

private clearSession(): void {
localStorage.removeItem(TOKEN_KEY);
localStorage.removeItem(EXPIRY_KEY);
this.loggedIn.set(false); // UI switches to the sign-up form
}
}