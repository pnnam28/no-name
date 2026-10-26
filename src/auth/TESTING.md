# Testing the frontend

1. Run npm start from the Expo project root. Sign in and Sign up appear immediately; the demo tabs and server-entry form are no longer the opening interface.
2. The default server is http://100.88.83.99:3000. Override EXPO_PUBLIC_API_URL before starting Expo if needed. The device must have access to the server, including Tailscale when required.
3. Sign up calls POST /auth/signup with email/password only. On success, the frontend switches to Sign in and fills in the email. Complete external email verification if required by your server.
4. Sign in calls POST /auth/signin with identifier/password. It expects access_token at the top level, with optional user/refresh_token matching auth.types.ts. A successful response opens the signed-in account view.
5. Log out calls POST /auth/signout with Bearer access_token. Successful logout or HTTP 401 clears the local session; other errors allow retry.
6. Check invalid input, password mismatch, duplicate accounts, incorrect credentials, network failures, and repeated taps.

Tokens currently exist in memory only. App restart loses the session. No client route guard or session-restoration feature is being claimed. The existing Explore route remains demo content and is not a protected account resource.

Run node src/auth/tests/sign-in.test.mjs for mocked API checks. Live-server account creation/sign-in and native rendering are separate manual checks.
