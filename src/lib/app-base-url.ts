/**
 * Base URL for absolute links (e-postverifiering, m.m.).
 * Sätt AUTH_URL i produktion (t.ex. https://gdpr.example.se).
 */
export function getAppBaseUrl(): string {
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
