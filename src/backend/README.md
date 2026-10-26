# Backend integration and authentication state

- auth.types.ts defines requests, example responses, users, and errors. Confirm these with the backend before integration.
- auth.store.ts holds session state in memory; reactive subscriptions are not implemented.
- On startup, check or restore the session before choosing a route.
- Distinguish signed-out users, unverified email, incomplete profiles, and authenticated users.
- Access tokens currently live in memory. Choose refresh-token storage for the platform rather than defaulting to localStorage.
- Native secure storage and session persistence are not implemented. Restarting the app loses the in-memory session.
- Sign-out should clear access tokens, users, and private caches and coordinate backend revocation or refresh-cookie removal.
- Frontend state must never determine backend authorization.
- Do not infer profile completion from a username alone; a backend contract is required.
