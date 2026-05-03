import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";

const createSchema = z.object({
  title: z.string().min(1).max(500),
  diaryRef: z.string().max(200).optional(),
  notes: z.string().max(20000).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.role || !canManageCases(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const c = await prisma.case.create({
    data: {
      tenantId: session.tenantId,
      title: parsed.data.title,
      diaryRef: parsed.data.diaryRef,
      notes: parsed.data.notes,
    },
  });

  await writeAudit({
    tenantId: session.tenantId,
    userId: session.user.id,
    action: "case.create",
    entityType: "Case",
    entityId: c.id,
    meta: { title: c.title },
  });

  return NextResponse.json({ id: c.id });
}
