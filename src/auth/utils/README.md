# Token utilities

- Handle token lifetimes using information supplied by the backend.
- Do not assume every access token is a JWT.
- Reading a JWT exp claim for user experience does not verify its signature or authorization.
- Never log tokens or default to storing refresh tokens in localStorage.
- Refresh concurrency and retry belong in the API layer; session state belongs in the auth layer.
- token.ts currently contains suggested lifetimes only; these are not enforced expiration rules.
