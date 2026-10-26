# Authentication forms

SignIn and SignUp are the active reusable native forms. The actual frontend route lives in src/app/index.tsx and displays these forms immediately at startup. Successful signup returns to sign-in with the email filled in; it does not create a login session. Successful sign-in displays the account view; logout returns to sign-in.

Server-integration functions and in-memory session state live in src/backend. Backend configuration lives in src/backend/config.ts. No server-selection interface is shown to users.

Unused placeholder account screens, provider, route guard, and the temporary test screen were removed. Email verification, profile completion, password recovery, OAuth, persistent login, and automatic refresh are not implemented.

Run `node src/auth/tests/sign-in.test.mjs` for mocked API regression tests.
