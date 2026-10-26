# Sign In

- Inputs: email (identifier) and password. Username support is deferred.
- API: POST /auth/sign-in.
- States: empty, validation errors, loading, invalid credentials, unverified email, server error, and success.
- Disable submission while sending; never log passwords or tokens.
- On success, update the session and choose a route based on verification/profile status.
- Do not refresh tokens because a password was entered incorrectly.

## Implemented

SignIn.tsx uses React Native View, Text, TextInput, and Pressable with English labels, native keyboard settings, focus handling, loading feedback, and accessible messages. It preserves validation, duplicate-submission protection, HTTP/network error handling, runtime response validation, and in-memory session storage. The optional onSignedIn callback lets the parent handle navigation and context updates.

Call configureApi(url) before using the form. The backend URL must be absolute and reachable from the device. The opening frontend screen now renders this form after backend selection.

If the backend sets an HttpOnly refresh cookie, JavaScript must not read or create that cookie. If the backend returns refresh_token in JSON, it is currently kept only in memory. Native secure storage and persistent cookie behavior are not implemented. Browser cookies require appropriate Secure/HttpOnly/SameSite, CORS, and CSRF settings.

Confirm EMAIL_NOT_VERIFIED and the example response with the backend. Refresh/retry, session restoration, provider subscriptions, and subsequent routes remain unimplemented.



| Component | Purpose |
|---|---|
| `View` | Groups other elements |
| `Text` | Displays text |
| `TextInput` | Accepts typed input |
| `Pressable` | Creates the tappable button |
| `ActivityIndicator` | Shows the loading spinner |
| `ScrollView` | Allows scrolling on smaller screens |
| `KeyboardAvoidingView` | Helps keep content visible when the keyboard opens |
| `Platform` | Detects the operating system |
| `StyleSheet` | Organizes appearance and layout |
