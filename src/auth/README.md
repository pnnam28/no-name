# React Native authentication module

English translation and native adaptation of all five folders from the original project's src directory. The original source is unchanged.

## Layout

- api/: shared HTTP client and authentication endpoints.
- auth/: session types, in-memory state, and the provider placeholder.
- auth-components/: native Sign In and placeholders for the remaining account flows.
- components/: protected-route placeholder and shared UI requirements.
- utils/: token requirements.

The nested auth/auth directory intentionally preserves the original five-folder layout and relative imports.

## Using Sign In

Configure the backend once during startup, then render SignIn inside a route with appropriate safe-area handling:

```tsx
import { configureApi, SignIn } from '@/auth';

// Replace this with your real backend address before making requests.
configureApi('https://your-backend.example');

export default function SignInScreen() {
  return <SignIn onSignedIn={() => { /* Navigate after checking backend onboarding state. */ }} />;
}
```

No routes or existing Home/Explore screens were changed by this migration. SignIn uses native controls, keyboard handling, theme colors, and English feedback. API payload names and backend error codes are preserved.

## Remaining work

The original unfinished features remain explicitly unfinished: SignUp, VerifyEmail, CompleteProfile, ForgotPassword, ResetPassword, ThirdPartyAuth, AuthProvider, and ProtectedRoute return null. Do not use the provider or guard as app wrappers yet. Confirm backend response contracts, onboarding state, resend/refresh inputs, native token storage, session restoration, refresh/retry, and logout integration before using this module as complete authentication.

Tokens currently live only in memory and are lost on app restart. Cookie credentials do not establish a complete native persistence strategy.

Conversion references: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [React Native TextInput](https://reactnative.dev/docs/textinput), and [React Native Pressable](https://reactnative.dev/docs/pressable).

## Validation

Run `node src/auth/tests/sign-in.test.mjs` from the project root (Node 24+). It checks request payloads, backend URL requirements, response validation, error mapping, and in-memory session cleanup with mocked networking. It does not test native UI rendering or a real backend.

At migration time, the full TypeScript check reports the two existing CSS declaration errors in src/components/animated-icon.web.tsx and src/constants/theme.ts, with no errors in this module. Project linting is unavailable until ESLint and its Expo configuration are installed and configured.
