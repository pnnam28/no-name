# Sign Up

- Inputs: email, password, and confirm_password.
- Validate email, password requirements, and matching passwords.
- API: POST /auth/sign-up; do not send confirm_password.
- States: empty, validation errors, password mismatch, email already registered, loading, server error, and success.
- On success, show instructions to check email when verification is required.
- Do not assume successful registration grants a session.
- Implemented: native registration form with matching-password validation, loading and duplicate-submit protection, and auth_api.signUp integration. Password policy is validated by the backend. Registration does not automatically sign in.
