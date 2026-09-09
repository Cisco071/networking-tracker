/**
 * @neondatabase/auth throws an AuthApiError (with __isAuthError: true and a
 * user-facing `message`) for API-level failures like invalid credentials,
 * rather than resolving { data: null, error } the way plain better-fetch
 * does. A genuine network failure (offline, DNS, cold-start connection
 * reset) throws a plain TypeError instead, with no __isAuthError flag.
 * This distinguishes the two so we show the right message for each.
 */
export function getAuthErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "__isAuthError" in err &&
    (err as { __isAuthError?: unknown }).__isAuthError === true &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}
