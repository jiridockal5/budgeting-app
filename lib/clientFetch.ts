/**
 * Typed fetch helper for client components calling app JSON APIs.
 * Validates HTTP status and `{ success, data?, error? }` envelope.
 */

type ApiSuccess<T> = { success: true; data: T };
type ApiFail = { success: false; error?: string };

export async function fetchJsonEnvelope<T>(
  input: RequestInfo | URL
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const res = await fetch(input);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return {
      ok: false,
      error: res.ok ? "Invalid JSON response" : `Request failed (${res.status})`,
    };
  }
  const b = body as ApiFail | ApiSuccess<T>;
  if (!res.ok) {
    const msg =
      b && typeof b === "object" && "error" in b && typeof b.error === "string"
        ? b.error
        : `Request failed (${res.status})`;
    return { ok: false, error: msg };
  }
  if (!b || typeof b !== "object" || !("success" in b)) {
    return { ok: false, error: "Unexpected response shape" };
  }
  if (!b.success) {
    const msg = typeof b.error === "string" ? b.error : "Request failed";
    return { ok: false, error: msg };
  }
  return { ok: true, data: b.data };
}
