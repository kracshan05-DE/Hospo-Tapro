// Centralised server-side error logging.
// Swap the console.error calls for Sentry/Logtail/etc. in one place instead of
// scattering console.error across every server action.
export function logServerError(context: string, error: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, error instanceof Error ? error.message : error);
}
