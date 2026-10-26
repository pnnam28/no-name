/** Requests follow the requirements; unspecified responses use unknown until confirmed with the backend. */
export interface SignInRequest { identifier: string; password: string; }
export interface SignUpRequest { email: string; password: string }
export interface CompleteProfileRequest {
  username: string;
  display_name: string;
  avatar_url?: string;
}
export interface VerifyEmailRequest { token: string }
export interface ForgotPasswordRequest { email: string }
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

/** Example response shape; refresh_token may be delivered in a cookie instead of JSON. */
export interface UserSummary { id: string; email: string; username?: string }
export interface SignInResponse {
  access_token: string;
  refresh_token?: string;
  user?: UserSummary;
}
export interface AccessTokenResponse { access_token: string }
export interface RefreshTokenResponse extends AccessTokenResponse { refresh_token?: string }

/** initializing prevents navigation before session checks; onboarding statuses are proposed. */
export type AuthStatus = 'initializing' | 'signedOut' | 'needsEmailVerification' | 'needsProfile' | 'authenticated';
export interface AuthState {
  status: AuthStatus;
  access_token: string | null;
  user: UserSummary | null;
}
export interface AuthError {
  status?: number;
  code?: string;
  message: string;
  field_errors?: Record<string, string>;
}
