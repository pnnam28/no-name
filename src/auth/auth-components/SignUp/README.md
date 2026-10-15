# Sign Up

- Inputs: email, password, and confirmPassword.
- Validate email, password requirements, and matching passwords.
- API: POST /auth/sign-up; do not send confirmPassword.
- States: empty, validation errors, password mismatch, email already registered, loading, server error, and success.
- On success, show instructions to check email when verification is required.
- Do not assume successful registration grants a session.
- Current status: placeholder returning null.
