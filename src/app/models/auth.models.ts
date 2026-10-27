// Body sent to POST
export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

// Body returned by sign-up
export interface AuthResponse {
  userId: number;
  name: string;
  email: string;
  accessToken: string; // the JWT
  expiresAtUtc: string; // ISO date string
}

// Body returned by GET /api/auth/me
export interface UserProfile {
  userId: number;
  email: string;
  name: string;
}

// Error shape the API returns (ProblemDetails / ValidationProblemDetails).
export interface ApiProblem {
  title?: string;
  status?: number;
  detail?: string; // used by our 409 and 500 responses
  errors?: Record<string, string[]>; // used by 400 validation responses
}
