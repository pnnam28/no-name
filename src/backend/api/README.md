# API layer

## client.ts

- Use one shared HTTP client. Call `configureApi('https://your-backend.example')` before sending requests; native apps require an absolute URL.
- On a physical phone, the backend address must be reachable from that phone; localhost refers to the phone itself.
- Serialize JSON and read responses according to the backend contract, including empty responses.
- Attach Bearer tokens only to authenticated requests to the configured backend.
- Normalize status, code, field errors, and network errors without exposing raw errors or tokens.
- Planned: use one shared refresh operation, make other requests wait, and retry at most once.
- Do not automatically refresh sign-in requests or refresh requests themselves.
- End a session only after a confirmed refresh rejection; distinguish network and server failures.
- Cookie handling depends on the platform. Browser cookies require suitable credentials, CORS, and CSRF configuration. Native cookie persistence must be verified separately.
- Current implementation: JSON requests, status/code errors, optional Bearer authorization, and explicit backend configuration. Field errors, refresh, and retry are not implemented.

## auth.ts

- Each action has one API function; presentation components must not write HTTP requests themselves.
- Preserve the documented endpoints and payloads; do not send confirm_password during registration.
- Do not accept userId from the signed-in user's profile form.
- Confirm unknown response shapes and resend/refresh inputs before implementing those flows.
- Sign-out must call the backend using the agreed session strategy.
