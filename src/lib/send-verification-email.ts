import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { fill, pick, type UiMessages } from "@/i18n/pick";
import { getAppBaseUrl } from "@/lib/app-base-url";

type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Sends verification link via Resend when configured; otherwise dev log or ALLOW_EMAIL_LOG_FALLBACK.
 * Copy follows `locale` (en/sv).
 */
export async function sendVerificationEmail(to: string, token: string, locale: Locale): Promise<SendResult> {
  const dict = await getDictionary(locale);
  const base = getAppBaseUrl();
  if (
    process.env.NODE_ENV === "production" &&
    (base.startsWith("http://localhost") || base.startsWith("http://127.0.0.1"))
  ) {
    return { ok: false, error: pick(dict, "email.errAuthUrl") };
  }
  const url = `${base}/auth/verify?token=${encodeURIComponent(token)}`;
  const subject = pick(dict, "email.verify.subject");
  const text = fill(pick(dict, "email.verify.text"), { url });
  const html = buildVerifyHtml(dict, url);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const logFallback =
    process.env.NODE_ENV === "development" || process.env.ALLOW_EMAIL_LOG_FALLBACK === "true";

  if (!apiKey || !from) {
    if (logFallback) {
      console.info(
        "[send-verification-email] Resend not configured. Verification link (to",
        to,
        "):\n",
        url,
      );
      return { ok: true };
    }
    return { ok: false, error: pick(dict, "email.errNotConfigured") };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[send-verification-email] Resend error:", res.status, body);
    return { ok: false, error: pick(dict, "email.errSendFailed") };
  }

  return { ok: true };
}

function buildVerifyHtml(dict: UiMessages, url: string): string {
  const hello = pick(dict, "email.verify.htmlHello");
  const linkText = pick(dict, "email.verify.htmlLink");
  const valid = pick(dict, "email.verify.htmlValid");
  const ignore = pick(dict, "email.verify.htmlIgnore");
  return `<p>${escapeHtml(hello)}</p><p><a href="${url}">${escapeHtml(linkText)}</a> ${escapeHtml(valid)}</p><p>${escapeHtml(ignore)}</p>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
