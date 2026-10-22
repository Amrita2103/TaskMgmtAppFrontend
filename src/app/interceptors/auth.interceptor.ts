import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

// Runs on every HttpClient request.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
const auth = inject(AuthService);

// Never attach our token to requests going to other websites.
if (!req.url.startsWith(environment.apiUrl)) {
return next(req);
}

const token = auth.getToken();

// Requests are immutable, so clone with the extra header. No token means send it unchanged.
const authReq = token
? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
: req;

return next(authReq).pipe(
catchError((error: HttpErrorResponse) => {
// 401 while holding a token means it is expired or invalid: 
if (error.status === 401 && token) {
auth.logout();
}
return throwError(() => error); // pass the error on so components can still react to it
})
);
};
