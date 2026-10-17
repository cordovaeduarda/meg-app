// Turns anything caught in a `catch` into text for the screen.
// Supabase errors can arrive as plain objects ({ message, code, details, hint }),
// not `Error` instances, so `instanceof Error` alone would hide their message.
export function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String(err.message)
  }
  return fallback
}
