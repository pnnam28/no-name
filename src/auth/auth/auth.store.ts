import type { AuthState, SignInResponse } from './auth.types';

/** Initial session state; a reactive subscription mechanism has not been implemented. */
export function createInitialAuthState(): AuthState {
  return { status: 'initializing', accessToken: null, user: null };
}

// Memory only: do not write tokens to localStorage or logs.
let state = createInitialAuthState();
let refreshToken: string | null = null;

export function getAuthState(): Readonly<AuthState> { return { ...state }; }

export function storeSignInSession(session: SignInResponse): void {
  // The onboarding contract is unknown; do not infer email verification or profile completion.
  state = { status: 'authenticated', accessToken: session.accessToken, user: session.user ?? null };
  // If the backend uses an HttpOnly cookie, JavaScript does not read its refresh token.
  // JSON refresh tokens are kept in memory and lost on restart; native secure storage is not implemented.
  refreshToken = session.refreshToken ?? null;
}

export function getRefreshTokenInMemory(): string | null { return refreshToken; }

export function clearAuthSession(): void {
  state = { status: 'signedOut', accessToken: null, user: null };
  refreshToken = null;
}
