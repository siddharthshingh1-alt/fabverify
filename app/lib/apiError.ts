// Supabase throws plain PostgrestError objects ({message, details, hint,
// code}), not Error instances, so `error instanceof Error` misses them and
// falls through to a useless "Unknown error". Handle both shapes.
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
}
