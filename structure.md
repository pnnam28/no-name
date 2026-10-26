# Frontend project structure

- src/app/_layout.tsx: theme, startup splash, and route stack.
- src/app/index.tsx: real opening frontend with sign-in/sign-up, account state, and logout.
- src/app/explore.tsx: retained standalone Expo demo route; not part of the opening account flow.
- src/auth/SignIn and src/auth/SignUp: reusable authentication forms.
- src/auth/tests: mocked server-integration regression tests.
- src/backend/config.ts: frontend server address configuration.
- src/backend/api: HTTP client and server endpoint functions.
- src/backend/auth.store.ts: in-memory frontend session.
- src/backend/auth.types.ts: request/response/state types.
- src/backend/utils: token requirements.
- src/components, src/hooks, src/constants: shared UI, behavior, and appearance.

Flow: app/index -> authentication form -> backend/api/auth -> backend/api/client -> remote server. Sign-in response -> session store -> account frontend. Signup success -> sign-in. Logout success -> clear local session -> sign-in.

The backend folder means the frontend's server-integration layer; it does not contain the remote server implementation. SecureStore persistence, token refresh, onboarding, and route protection remain unimplemented. Placeholder exports and temporary test UI were removed.
