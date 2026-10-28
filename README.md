# Task Management UI

Angular application using NgModules, routing, Reactive Forms and SCSS.

## Local development

```powershell
npm.cmd ci
npm.cmd start
```

Open `http://localhost:4200`. Run the backend at `http://localhost:5005`.
`src/environments/environment.development.ts` configures its `/api` base URL.
Use `localhost` for both applications for the SameSite=Strict cookie.
The backend must allow exactly `http://localhost:4200` with credentialed CORS.
HTTP non-Secure HttpOnly cookies are permitted only for localhost Development.

## Authentication

- Access tokens stay in memory. The browser manages the HttpOnly refresh cookie;
  the frontend never reads it or writes tokens to browser storage.
- Auth requests include `withCredentials: true`. Auth POSTs carry `X-CSRF: 1`.
- Startup refreshes the session before routing. Protected requests send a bearer
  token; a 401 triggers a shared refresh and one retry. Failed refresh clears
  local state and redirects to login.
- Refresh and current-session logout send no body and need no bearer token.
  Logout-all requires bearer authentication. Logout actions clear local state
  on completion or failure; server revocation requires a successful API response.
- The backend owns the 15-minute JWT expiry, fixed seven-day session expiry,
  token rotation, three-session limit and oldest-session eviction. Logout does
  not invalidate issued JWTs before expiry. Failed refresh never modifies the
  HttpOnly cookie from frontend code.

## Production and verification

Production uses `/api` on the frontend origin. Configure a reverse proxy or set
an explicit HTTPS API URL in `src/environments/environment.ts` before building.
Use HTTPS and explicitly configured backend allowed origins.

```powershell
npm.cmd run build
npm.cmd run build -- --configuration development
```

With the API and SQL Server running, verify signup/login, refresh after reload,
`/me`, logout, logout-all, cookie rotation and fourth-login eviction in a browser.
Inspect credentialed CORS and CSRF headers in Network tools. Confirm revoked or
rotated tokens are rejected. The refresh cookie must not be readable by JavaScript.

The `.spec.ts` files remain intentionally empty at the user's request. Builds
verify compilation, not end-to-end authentication or database behavior.
