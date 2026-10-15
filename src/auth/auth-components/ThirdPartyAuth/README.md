# Third-Party Auth — later phase

- Show only providers supported by the backend.
- Flow: provider → authentication → app callback → exchange result with backend → receive session.
- The backend distinguishes new users from existing accounts.
- Handle loading, cancellation/errors, and navigation to the profile step or the app.
- The backend must define endpoints, callbacks, and flow protection before implementation.
- Current status: placeholder returning null.
