import type { SignInResponse, UserSummary } from '../backend/auth.types';
import { getAuthState, getRefreshTokenInMemory } from '../backend/auth.store';
import { backend_url } from '../backend/config';
import { loadTokens } from '../backend/utils/token-storage';

// Explicit development-only logging of real credentials, requested for local debugging.
// Whitelist user fields so an unexpected password/password_hash is never printed.
function userDetails(user: UserSummary | null | undefined) {
  return user ? { id: user.id, email: user.email, username: user.username ?? null } : null;
}
export function logSignInResponse(response: SignInResponse): void {
  if (!__DEV__) return;
  console.clear();
  console.info('[LIVE-AUTH][SIGNIN][BACKEND_RESPONSE]', JSON.stringify({
    access_token: response.access_token,
    refresh_token: response.refresh_token ?? null,
    user: userDetails(response.user),
  }, null, 2));
}
export async function logSavedSession(response: SignInResponse): Promise<void> {
  if (!__DEV__) return;
  try {
    const stored = await loadTokens(backend_url.replace(/\/+$/, ''));
    const memory = getAuthState();
    console.info('[LIVE-AUTH][SIGNIN][SECURESTORE_READBACK]', JSON.stringify({
      storage_key: 'no-name.auth',
      record_exists: stored !== null,
      server_url: stored?.server_url ?? null,
      access_token: stored?.access_token ?? null,
      refresh_token: stored?.refresh_token ?? null,
      user: userDetails(stored?.user),
      access_token_matches_backend: stored?.access_token === response.access_token,
      refresh_token_matches_backend: stored !== null && (stored.refresh_token ?? null) === (response.refresh_token ?? null),
      user_id_matches_backend: stored !== null && (stored.user?.id ?? null) === (response.user?.id ?? null),
      access_token_matches_memory: stored !== null && stored.access_token === memory.access_token,
      refresh_token_matches_memory: stored !== null && (stored.refresh_token ?? null) === getRefreshTokenInMemory(),
    }, null, 2));
  } catch {
    // A diagnostic read failure must not turn a successful sign-in/save into a failure.
    console.info('[LIVE-AUTH][SIGNIN][SECURESTORE_READBACK_FAILED]', 'Login save completed, but the additional debug read failed.');
  }
}
