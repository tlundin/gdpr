import { getAppBaseUrl } from "@/lib/app-base-url";

type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Skickar verifieringslänk. Kräver RESEND_API_KEY + EMAIL_FROM i produktion.
 * Lokalt (NODE_ENV=development) loggas länken om Resend saknas.
 */
export async function sendVerificationEmail(to: string, token: string): Promise<SendResult> {
  const base = getAppBaseUrl();
  const url = `${base}/auth/verify?token=${encodeURIComponent(token)}`;
  const subject = "Bekräfta din e-postadress";
  const text = `Öppna denna länk för att bekräfta din e-postadress (gäller i 24 timmar):\n\n${url}\n\nOm du inte skapat konto kan du ignorera meddelandet.`;
  const html = `<p>Hej,</p><p><a href="${url}">Klicka här för att bekräfta din e-postadress</a> (gäller i 24 timmar).</p><p>Om du inte skapat konto kan du ignorera meddelandet.</p>`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "development") {
      console.info("[send-verification-email] RESEND_API_KEY eller EMAIL_FROM saknas. Länk:\n", url);
      return { ok: true };
    }
    return { ok: false, error: "E-post är inte konfigurerad (RESEND_API_KEY och EMAIL_FROM)." };
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
