import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Observable, finalize, firstValueFrom, shareReplay, tap } from 'rxjs';
import { loginRequest } from '../models/login-request';
import { signupRequest } from '../models/signup-request';
import { loginResponse } from '../models/login-response';
import { UserProfile } from '../models/auth.models';
import { environment } from '../../environments/environment';

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
}

interface SessionData {
  accessToken: string;
  expiresAtUtc: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Access token lives in memory only. The refresh token is an HttpOnly cookie.
  private accessToken: string | null = null;
  private expiresAtUtc: number | null = null;

  // Shared by all callers so concurrent 401s trigger ONE refresh.
  // Required because the backend rotates refresh tokens: a second parallel
  // refresh would present an already-used token and fail.
  private refreshInFlight$: Observable<loginResponse> | null = null;

  readonly user = signal<AuthUser | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);

  constructor(private http: HttpClient) {}

  login(credentials: loginRequest): Observable<loginResponse> {
    return this.http
      .post<loginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((response) => this.storeSession(response)));
  }

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  // Creates the account; the backend logs the new user in (201 + refresh cookie).
  signup(request: signupRequest): Observable<loginResponse> {
    return this.http
      .post<loginResponse>(`${this.apiUrl}/signup`, request)
      .pipe(tap((response) => this.storeSession(response)));
  }

  // Uses the refresh cookie to get a new access token.
  refresh(): Observable<loginResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http.post<loginResponse>(`${this.apiUrl}/refresh`, null).pipe(
        tap((response) => this.storeSession(response)),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshInFlight$;
  }

  // Runs once at app startup: restores the session after a page reload.
  async initialize(): Promise<void> {
    try {
      await firstValueFrom(this.refresh());
    } catch {
      // No valid refresh cookie: user simply isn't logged in.
      this.clearSession();
    }
  }

  // Tells the server to revoke the session, then clears local state either way.
  logout(): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/logout`, null).pipe(finalize(() => this.clearSession()));
  }
  
 private saveSession(response: SessionData): void {
    //  reject bad or already-expired responses
    const expiration = Date.parse(response.expiresAtUtc);
    if (!response.accessToken || !Number.isFinite(expiration) || expiration <= Date.now()) {
      throw new Error('Invalid authentication response');
    }

    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(EXPIRY_KEY, response.expiresAtUtc);
    this.loggedIn.set(true);
  }


 private clearSession(): void {
   localStorage.removeItem(TOKEN_KEY);
   localStorage.removeItem(EXPIRY_KEY);
   this.loggedIn.set(false); // UI switches to the sign-up form
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  // Local only (no server call).
  clearSession(): void {
    this.accessToken = null;
    this.expiresAtUtc = null;
    this.user.set(null);
  }

  private storeSession(response: loginResponse): void {
    const expiration = Date.parse(response.expiresAtUtc);

    if (!response.accessToken || !Number.isFinite(expiration) || expiration <= Date.now()) {
      throw new Error('Invalid authentication response');
    }

    this.accessToken = response.accessToken;
    this.expiresAtUtc = expiration;
    this.user.set({ userId: response.userId, name: response.name, email: response.email });
  }
}
