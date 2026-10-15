# Forgot Password — later phase

- Input: email; API: POST /auth/forgot-password.
- States: email input, invalid email, loading, success, and server error.
- Use a generic success message that does not disclose whether an account exists.
- Prevent duplicate submissions and handle request limits.
- Current status: placeholder returning null.
