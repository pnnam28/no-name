# Reset Password — later phase

- Inputs: new password, confirm password, and reset token.
- API: POST /auth/reset-password; retain the example payload from the requirements.
- States: invalid/expired token, password validation, mismatch, loading, success, and server error.
- On success, navigate to Sign In.
- Confirm whether the backend needs confirmPassword and how existing sessions are handled.
- Current status: placeholder returning null.
