# Complete Profile

- Required: username and display name. Optional: avatar.
- API: POST /users/profile; payload: username, display_name, avatar_url?.
- Requires an access token. The backend derives identity; do not send userId from the form.
- States: empty, username/display-name validation, username taken, loading, server error, and success.
- On success, update profile/state and enter the app.
- Confirm avatar upload versus URL, response shape, and handling of resubmission or existing profiles.
- Current status: placeholder returning null.
