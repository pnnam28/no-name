/** TODO: Token lifetime helpers based on the backend contract; these do not validate tokens. */
export const TOKEN_REQUIREMENTS = {
  accessLifetime: '5–15 minutes is suggested in the requirements; the backend decides',
  refreshLifetime: '15–30 days is suggested in the requirements; the backend decides',
} as const;
