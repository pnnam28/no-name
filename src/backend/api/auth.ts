import type {
  AccessTokenResponse,
  CompleteProfileRequest,
  ForgotPasswordRequest,
  RefreshTokenResponse,
  ResetPasswordRequest,
  SignInRequest, SignInResponse, SignUpRequest,
  VerifyEmailRequest,
  TokenValidationResponse,
} from '../auth.types';
import { request, refreshSession } from './client';

// Endpoint and request definitions from the source requirements. Requests run only when called.
export const auth_api = {
  signIn: (body: SignInRequest) => request<SignInResponse>('/auth/signin', { method: 'POST', body }),
  signUp: (body: SignUpRequest) => request<unknown>('/auth/signup', { method: 'POST', body }),
  completeProfile: (body: CompleteProfileRequest) => request<unknown>('/users/profile', { method: 'POST', body, authenticated: true }),
  verifyEmail: (body: VerifyEmailRequest) => request<unknown>('/auth/verify-email', { method: 'POST', body }),
  // TODO: Confirm resend input before adding parameters.
  resendVerification: () => request<unknown>('/auth/resend-verification', { method: 'POST' }),
  // TODO: Supply refresh credentials once the token strategy is agreed.
  signInViaToken: () =>
    request<TokenValidationResponse>(
      '/auth/sign-in-via-token',
      {
        method: 'GET',
        authenticated: true,
      },
    ),

  requestRefreshToken: () => refreshSession(),
  signOut: () => request<unknown>('/auth/signout', { method: 'POST', authenticated: true }),
  // Later phase.
  forgotPassword: (body: ForgotPasswordRequest) => request<unknown>('/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body: ResetPasswordRequest) => request<unknown>('/auth/reset-password', { method: 'POST', body }),
};
