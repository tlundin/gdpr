/**
 * Base URL for absolute links (e-postverifiering, omdirigeringar efter verify, m.m.).
 * Sätt AUTH_URL till den **publika** HTTPS-adressen (t.ex. https://gdpr.example.se), inte 0.0.0.0 eller 127.0.0.1.
 */

const BAD_HOSTS = new Set([
  "0.0.0.0",
  "127.0.0.1",
  "localhost",
  "::1",
  "[::1]",
]);

function originFromUrlString(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim().replace(/\/$/, ""));
    if (BAD_HOSTS.has(u.hostname.toLowerCase())) return null;
    return u.origin;
  } catch {
    return null;
  }
}

export function getAppBaseUrl(): string {
  const fromAuth = originFromUrlString(process.env.AUTH_URL);
  if (fromAuth) return fromAuth;

  const vercelRaw = process.env.VERCEL_URL?.trim();
  if (vercelRaw) {
    const fromVercel = originFromUrlString(`https://${vercelRaw.replace(/\/$/, "")}`);
    if (fromVercel) return fromVercel;
  }

  return "http://localhost:3000";
}
