import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";

const patchSchema = z.object({
  decisionNotes: z.string().max(50000).optional(),
  title: z.string().min(1).max(500).optional(),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const doc = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      case: { select: { id: true, title: true } },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.role || !canManageCases(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const doc = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.decisionNotes !== undefined ? { decisionNotes: parsed.data.decisionNotes } : {}),
    },
  });

  await writeAudit({
    tenantId: session.tenantId,
    userId: session.user.id,
    action: "document.update",
    entityType: "Document",
    entityId: id,
    meta: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json(updated);
}
