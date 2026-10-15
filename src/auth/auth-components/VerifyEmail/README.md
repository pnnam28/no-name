# Verify Email

- Receive a token/code from a link according to the backend contract; POST /auth/verify-email with token.
- States: verifying, success, invalid token, expired token, already verified, and server error.
- Include instructions to check email and support POST /auth/resend-verification.
- Confirm whether resend uses email or session identity; handle loading, cooldown, and 429 responses.
- On success, continue to CompleteProfile after obtaining a valid session.
- Confirm session issuance after verification and links opened in another browser or device.
- Current status: placeholder returning null.
