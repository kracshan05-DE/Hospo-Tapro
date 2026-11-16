// Short-lived, httpOnly cookie set by /auth/callback after a password-reset
// link is opened. Its value is the user id; /admin/reset-password only lets
// that user set a new password without the current one while it exists.
export const RESET_COOKIE = 'pw_reset_ok';
export const RESET_COOKIE_MAX_AGE = 15 * 60;
