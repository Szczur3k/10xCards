/** Lokalny dev bez GoTrue: MOCK_AUTH=true + prosty użytkownik z env. */

function envString(key: string, fallback: string): string {
  const p =
    typeof process !== "undefined" && process.env[key] !== undefined && process.env[key] !== ""
      ? process.env[key]
      : undefined;
  if (p !== undefined) return p;
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return v ?? fallback;
}

export function isMockAuth(): boolean {
  const v = envString("MOCK_AUTH", "");
  return v === "true" || v === "1";
}

export function getMockUserId(): string {
  return envString("MOCK_USER_ID", "00000000-0000-4000-8000-000000000001");
}

/** Domyślnie = pierwszy użytkownik z seed-simple.sql */
export function getMockUserEmail(): string {
  return envString("MOCK_USER_EMAIL", "test@10xdevs.pl");
}
