// Node 24+: API/session and helper checks; does not replace native UI testing.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

async function loadSource(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}
function moduleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source, { mode: 'transform' })).toString('base64')}`;
}
const storeUrl = moduleUrl((await loadSource('../auth/auth.store.ts')).replace(/^import type .*;\r?\n/gm, ''));
const store = await import(storeUrl);
const clientUrl = moduleUrl((await loadSource('../api/client.ts')).replace("'../auth/auth.store'", JSON.stringify(storeUrl)));
const client = await import(clientUrl);
const authSource = (await loadSource('../api/auth.ts'))
  .replace("'./client'", JSON.stringify(clientUrl))
  .replace(/import type \{[\s\S]*?\} from '[^']+';/, '');
const { authApi } = await import(moduleUrl(authSource));

const originalFetch = globalThis.fetch;
try {
  let call;
  globalThis.fetch = async (url, options) => {
    call = { url, options };
    return new Response(JSON.stringify({ accessToken: 'sample-access', user: { id: '1', email: 'a@example.com' } }));
  };
  await assert.rejects(authApi.signIn({ identifier: 'a@example.com', password: 'a' }), error => error.code === 'API_NOT_CONFIGURED');
  assert.throws(() => client.configureApi('/relative-backend'));
  client.configureApi('https://backend.example/');
  await assert.rejects(client.request('//outside.example', { method: 'GET' }), error => error.code === 'INVALID_API_PATH');
  const result = await authApi.signIn({ identifier: 'a@example.com', password: 'password with spaces ' });
  assert.equal(call.url, 'https://backend.example/auth/sign-in');
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.credentials, 'include');
  assert.equal(call.options.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(call.options.body), { identifier: 'a@example.com', password: 'password with spaces ' });
  store.storeSignInSession(result);
  assert.equal(store.getAuthState().accessToken, 'sample-access');
  assert.equal(store.getRefreshTokenInMemory(), null);
  store.storeSignInSession({ ...result, refreshToken: 'sample-refresh' });
  assert.equal(store.getRefreshTokenInMemory(), 'sample-refresh');
  store.clearAuthSession();
  assert.equal(store.getAuthState().accessToken, null);
  assert.equal(store.getRefreshTokenInMemory(), null);

  const helperSource = (await loadSource('../auth-components/SignIn/SignIn.tsx'))
    .split('export function SignIn(')[0].replace(/^import .*;\r?\n/gm, '')
    + '\nexport { errorMessage, isSignInResponse };';
  const helpers = await import(moduleUrl(`import { ApiError } from ${JSON.stringify(clientUrl)};\n${helperSource}`));
  assert.equal(helpers.isSignInResponse(result), true);
  assert.equal(helpers.isSignInResponse({ accessToken: '' }), false);
  assert.equal(helpers.isSignInResponse({ accessToken: 'a', user: { id: 123 } }), false);
  assert.equal(helpers.errorMessage(new client.ApiError(401)).status, 'invalidCredentials');
  assert.equal(helpers.errorMessage(new client.ApiError(403, 'EMAIL_NOT_VERIFIED')).status, 'unverifiedEmail');
  assert.equal(helpers.errorMessage(new client.ApiError(403)).status, 'serverError');
  assert.equal(helpers.errorMessage(new TypeError('network')).status, 'serverError');

  globalThis.fetch = async () => new Response(JSON.stringify({ code: 'EMAIL_NOT_VERIFIED', message: 'private backend detail' }), { status: 403 });
  await assert.rejects(authApi.signIn({ identifier: 'a@example.com', password: 'a' }),
    error => error instanceof client.ApiError && error.status === 403 && error.code === 'EMAIL_NOT_VERIFIED' && !error.message.includes('private'));
  globalThis.fetch = async () => new Response('<html>bad gateway</html>', { status: 502 });
  await assert.rejects(authApi.signIn({ identifier: 'a@example.com', password: 'a' }), error => error.status === 502);
  globalThis.fetch = async () => new Response('not-json', { status: 200 });
  await assert.rejects(authApi.signIn({ identifier: 'a@example.com', password: 'a' }), error => error.code === 'INVALID_RESPONSE');
  console.log('PASS: sign-in request, cookie credentials, session cleanup, response validation and error handling.');
} finally {
  globalThis.fetch = originalFetch;
  store.clearAuthSession();
}
