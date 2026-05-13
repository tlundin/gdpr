import { prisma } from "@/lib/prisma";

export type ConfirmEmailResult = { ok: true } | { ok: false; reason: "invalid" | "expired" };

/**
 * Validerar token, sätter emailVerified och tar bort verifieringstoken.
 * Anropas endast från POST (inte GET) så att e-postskanners som prefetchar GET inte förbrukar länken.
 */
export async function confirmVerificationToken(rawToken: string): Promise<ConfirmEmailResult> {
  const token = rawToken.trim();
  if (!token) return { ok: false, reason: "invalid" };

  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row) return { ok: false, reason: "invalid" };
  if (row.expires < new Date()) return { ok: false, reason: "expired" };

  const user = await prisma.user.findUnique({
    where: { email: row.identifier },
  });
  if (!user) {
    await prisma.verificationToken.deleteMany({ where: { token } });
    return { ok: false, reason: "invalid" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: row.identifier },
    }),
  ]);

  return { ok: true };
}
