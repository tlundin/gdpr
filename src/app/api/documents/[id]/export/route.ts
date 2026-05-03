import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/** MVP: exportera extraherad text som .txt. PDF/svartstryk kan läggas till senare. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.tenantId || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const doc = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = doc.textContent?.trim() ?? "";
  const filename = `${doc.title.replace(/[^\w\-åäöÅÄÖ]+/g, "_").slice(0, 80) || "handling"}.txt`;

  await writeAudit({
    tenantId: session.tenantId,
    userId: session.user.id,
    action: "document.export_txt",
    entityType: "Document",
    entityId: doc.id,
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
