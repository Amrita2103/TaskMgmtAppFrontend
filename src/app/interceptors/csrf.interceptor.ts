import { HttpInterceptorFn } from '@angular/common/http';

// The backend rejects POSTs to /api/auth without "X-CSRF: 1".
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const isMutating = req.method !== 'GET' && req.method !== 'HEAD';
  if (isMutating && req.url.startsWith('/api/')) {
    req = req.clone({ setHeaders: { 'X-CSRF': '1' } });
  }
  return next(req);
};
