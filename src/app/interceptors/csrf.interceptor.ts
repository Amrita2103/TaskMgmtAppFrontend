import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

// The backend rejects POSTs to /api/auth without "X-CSRF: 1".
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Limit cookies and the CSRF header to the configured auth API.
  if (req.url.startsWith(`${environment.apiUrl}/auth/`)) {
    req = req.clone({
      withCredentials: true,
      ...(req.method === 'POST' ? { setHeaders: { 'X-CSRF': '1' } } : {}),
    });
  }
  return next(req);
};
