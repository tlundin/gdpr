import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { BillingSource, Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { getLocale } from "@/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/send-verification-email";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().max(120).optional(),
  organization: z.string().trim().max(200).optional(),
});

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

async function ensureTenantAndAdmin(
  tx: Prisma.TransactionClient,
  userId: string,
  tenantName: string,
) {
  const existing = await tx.membership.findFirst({ where: { userId } });
  if (existing) return;

  const tenant = await tx.tenant.create({
    data: {
      name: tenantName,
      slug: `org-${userId}`,
      billingSource: BillingSource.STRIPE,
    },
  });

  await tx.membership.create({
    data: {
      userId,
      tenantId: tenant.id,
      role: Role.ADMIN,
    },
  });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const { email: rawEmail, password, name, organization } = parsed.data;
  const email = rawEmail.toLowerCase();
  const tenantName = organization?.trim() || name?.trim() || "Min organisation";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.emailVerified) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  const userId = await prisma.$transaction(async (tx) => {
    let uid: string;

    if (existing && !existing.emailVerified) {
      await tx.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          ...(name !== undefined && name.trim() !== "" ? { name: name.trim() } : {}),
        },
      });
      uid = existing.id;
    } else {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name?.trim() || null,
          emailVerified: null,
        },
      });
      uid = user.id;
    }

    await ensureTenantAndAdmin(tx, uid, tenantName);

    await tx.verificationToken.deleteMany({ where: { identifier: email } });
    await tx.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    return uid;
  });

  const send = await sendVerificationEmail(email, token, await getLocale());
  if (!send.ok) {
    console.error("[register] user", userId, send.error);
    return NextResponse.json({ error: "email_send_failed", message: send.error }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
