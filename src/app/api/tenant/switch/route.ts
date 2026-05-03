import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  tenantId: z.string().min(1),
});

/**
 * Växlar aktiv tenant i sessionen (kräver att användaren har membership).
 * Klienten bör anropa `getSession().update({ tenantId })` via SessionProvider — denna route validerar åtkomst.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const mem = await prisma.membership.findFirst({
    where: { userId: session.user.id, tenantId: parsed.data.tenantId },
    include: { tenant: { select: { name: true, slug: true } } },
  });

  if (!mem) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    tenantId: mem.tenantId,
    role: mem.role,
    tenantName: mem.tenant.name,
  });
}
