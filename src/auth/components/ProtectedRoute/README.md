# Protected Route

- During initialization, show a loading state and do not redirect yet.
- Send signed-out users to Sign In.
- Send users with unverified email or incomplete profiles to the appropriate step without redirect loops.
- Render protected content for authenticated users using Expo Router when this guard is implemented.
- This component only protects the interface; the backend must still check authorization.
- Current status: placeholder returning null. It is not wired into the app.
