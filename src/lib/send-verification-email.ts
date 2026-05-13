import { getAppBaseUrl } from "@/lib/app-base-url";

type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Skickar verifieringslänk via Resend när RESEND_API_KEY och EMAIL_FROM är satta.
 * Annars: i utveckling, eller om ALLOW_EMAIL_LOG_FALLBACK=true, loggas länken och anropet lyckas
 * (använd endast på privat/staging-maskin — länken syns i serverlogg).
 */
export async function sendVerificationEmail(to: string, token: string): Promise<SendResult> {
  const base = getAppBaseUrl();
  if (
    process.env.NODE_ENV === "production" &&
    (base.startsWith("http://localhost") || base.startsWith("http://127.0.0.1"))
  ) {
    return {
      ok: false,
      error:
        "AUTH_URL saknas eller pekar på en lokal adress. Sätt AUTH_URL till den publika HTTPS-adressen (t.ex. https://gdpr.synkserver.net).",
    };
  }
  const url = `${base}/auth/verify?token=${encodeURIComponent(token)}`;
  const subject = "Bekräfta din e-postadress";
  const text = `Öppna denna länk för att bekräfta din e-postadress (gäller i 24 timmar):\n\n${url}\n\nOm du inte skapat konto kan du ignorera meddelandet.`;
  const html = `<p>Hej,</p><p><a href="${url}">Klicka här för att bekräfta din e-postadress</a> (gäller i 24 timmar).</p><p>Om du inte skapat konto kan du ignorera meddelandet.</p>`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const logFallback =
    process.env.NODE_ENV === "development" || process.env.ALLOW_EMAIL_LOG_FALLBACK === "true";

  if (!apiKey || !from) {
    if (logFallback) {
      console.info(
        "[send-verification-email] Resend ej konfigurerat. Verifieringslänk (till",
        to,
        "):\n",
        url,
      );
      return { ok: true };
    }
    return {
      ok: false,
      error:
        "E-post är inte konfigurerad. Sätt RESEND_API_KEY och EMAIL_FROM på servern, eller tillfälligt ALLOW_EMAIL_LOG_FALLBACK=true (länk loggas — se systemd/journal).",
    };
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
    return { ok: false, error: "Kunde inte skicka e-post just nu." };
  }

  return { ok: true };
}
