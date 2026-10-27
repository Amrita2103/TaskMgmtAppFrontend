import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Endpoints that must NOT get a bearer token or trigger refresh-on-401.
// (logout-all and me are NOT listed: they need the token.)
const PUBLIC_AUTH_ENDPOINTS = /^\/api\/auth\/(login|signup|refresh|logout)(\?|$)/;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith('/api/') || PUBLIC_AUTH_ENDPOINTS.test(req.url)) {
    return next(req);
  }

  const withToken = (r: HttpRequest<unknown>) => {
    const token = auth.getAccessToken();
    return token ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : r;
  };

  return next(withToken(req)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Access token missing/expired/rejected: refresh once, then retry once.
      return auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          auth.clearSession();
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => refreshError);
        }),
        switchMap(() => next(withToken(req)))
      );
    })
  );
};
