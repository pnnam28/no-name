import { request } from './client';
import type {
  SignInRequest, SignInResponse, SignUpRequest, CompleteProfileRequest,
  VerifyEmailRequest, AccessTokenResponse, RefreshTokenResponse,
  ForgotPasswordRequest, ResetPasswordRequest,
} from '../auth/auth.types';

// Endpoint and request definitions from the source requirements. Requests run only when called.
export const authApi = {
  signIn: (body: SignInRequest) => request<SignInResponse>('/auth/sign-in', { method: 'POST', body }),
  signUp: (body: SignUpRequest) => request<unknown>('/auth/sign-up', { method: 'POST', body }),
  completeProfile: (body: CompleteProfileRequest) => request<unknown>('/users/profile', { method: 'POST', body, authenticated: true }),
  verifyEmail: (body: VerifyEmailRequest) => request<unknown>('/auth/verify-email', { method: 'POST', body }),
  // TODO: Confirm resend input before adding parameters.
  resendVerification: () => request<unknown>('/auth/resend-verification', { method: 'POST' }),
  // TODO: Supply refresh credentials once the token strategy is agreed.
  requestAccessToken: () => request<AccessTokenResponse>('/auth/token/access', { method: 'POST' }),
  requestRefreshToken: () => request<RefreshTokenResponse>('/auth/token/refresh', { method: 'POST' }),
  signOut: () => request<unknown>('/auth/sign-out', { method: 'POST', authenticated: true }),
  // Later phase.
  forgotPassword: (body: ForgotPasswordRequest) => request<unknown>('/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body: ResetPasswordRequest) => request<unknown>('/auth/reset-password', { method: 'POST', body }),
};
