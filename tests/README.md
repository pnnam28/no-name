# Authentication verification

Run from the Expo project root (Node 24+):

```powershell
npm test
npm run test:storage
npm run test:auth
npm run test:ui
npx tsc --noEmit
npm run lint
```

No new dependencies: Node's test runner uses the existing TypeScript compiler to transpile the actual application modules into isolated test modules. Networking, Expo SecureStore, native host views and theme/config are mocked; tests never contact your backend or create accounts. UI tests use actual React server rendering with native view shims, not a simulator or interactive React Native renderer. A focused hook harness additionally executes the provider effect and Retry handler to verify read-error recovery; it does not simulate React Native scheduling. These checks do not prove device layout, touch behavior, keychain persistence or browser CORS.

## Development panel

Run npm start and open the app. In development, **Auth diagnostics** appears above the auth provider, so startup storage errors do not prevent access. Open it, run safe tests, inspect PASS/FAIL results and matching [AUTH-DEBUG] console messages. On web, UNAVAILABLE is expected for the current native-only adapter; this work does not add a browser persistence policy.

All panel writes target no-name.debug.auth.v1. Production retains no-name.auth. Only fake credentials are used. Full fake diagnostic tokens, fake user ID, storage key, raw diagnostic JSON, and parsed records are logged for each operation. Real production credentials, passwords, raw errors and backend bodies are never read or logged by the panel. Each selection clears previous on-screen results and calls console.clear(); disable Preserve log in browser DevTools if old console entries remain visible. Test-only account creation and real logout are never part of Run safe storage tests. Closing the modal is disabled while a test runs. Ordinary tests clean up the diagnostic key; restart preparation deliberately leaves it saved.

## Real-device restart test

1. Run safe tests first.
2. Press Prepare restart test.
3. Fully close and reopen the same Expo app/project on iOS or Android. Merely rereading in the same session does not prove persistence.
4. Open diagnostics and immediately press Verify restart. Do not run other storage tests between preparation and verification.
5. Expect PASS; verification then removes the diagnostic record. The panel cannot establish that a restart happened; that is a manual step.

## Manual UI / runtime acceptance checklist

- Startup: loading appears while storage is pending, then form/account; a storage error shows Retry, success does not show an error.
- Sign-in: invalid email/empty password blocks submission; rapid double taps make one request; pending API/storage disables inputs and shows loading; success follows completed persistence; write failure shows a storage error.
- Sign-up: mismatch blocks requests; successful signup transitions to signin with the email; it does not store a login session automatically.
- Logout: success is shown only after backend logout and local deletion. Server/network failure retains credentials for retry. A 401 can trigger local cleanup; deletion failure remains visible.
- Account A -> logout -> B: no A token/email remains in B's session.
- Restart after actual logout: signin appears. Restored credentials alone do not establish that the backend still accepts them.
- Real devices: inspect small-screen scrolling, keyboard coverage, focus, light/dark mode and accessibility announcements.
- Release: __DEV__ is false; no diagnostic button/panel is accessible. The root uses a development-only require.

## Scope and known boundaries

The pre-existing auth.store listener architecture is retained; no new UI listeners were added to storage. Removing those existing listeners is a separate architecture refactor. This change fixes the provider's inverted .then error handler and aligns parser behavior with optional fields in StoredSession. Endpoints, real token key, signup/signin payloads and logout policy are preserved. Automatic refresh still needs its confirmed backend contract.

The older src/auth/tests/sign-in.test.mjs remains available as a compatibility launcher for npm run test:auth. Root tests are now authoritative.

## Live account sign-in output (development only)

After a real successful sign-in response, the form clears previous console output and logs [LIVE-AUTH][SIGNIN][BACKEND_RESPONSE] with the actual access_token, refresh_token and returned user id/email/username. After saving, [SECURESTORE_READBACK] logs the actual no-name.auth record fields and comparisons with backend and memory. The separate fake-data diagnostic panel is unchanged. Missing backend user/refresh fields are shown as null, never fabricated.

A failed extra readback is logged separately and does not undo a successful login. If only BACKEND_RESPONSE appears followed by a storage error in the UI, saving did not complete. Release mode performs no live-auth logging or diagnostic storage reads. These logs contain real credentials: use a local development console and clear them before sharing screenshots/logs. Passwords and password hashes are never included in the user field whitelist. The app itself does not contact the backend until you submit the real sign-in form.
