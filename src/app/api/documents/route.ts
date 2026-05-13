import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { pick } from "@/i18n/pick";
import { writeAudit } from "@/lib/audit";
import { extractTextFromUpload } from "@/lib/extractText";
import { tenantUploadDir } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.role || !canManageCases(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const caseId = form.get("caseId");
  const title = form.get("title");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: pick(dict, "api.fileMissing") }, { status: 400 });
  }

  const safeTitle =
    typeof title === "string" && title.trim().length > 0 ? title.trim() : file.name;

  if (typeof caseId === "string" && caseId.length > 0) {
    const c = await prisma.case.findFirst({
      where: { id: caseId, tenantId: session.tenantId },
    });
    if (!c) {
      return NextResponse.json({ error: pick(dict, "api.caseNotFound") }, { status: 404 });
    }
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  const doc = await prisma.document.create({
    data: {
      tenantId: session.tenantId,
      caseId: typeof caseId === "string" && caseId.length > 0 ? caseId : null,
      title: safeTitle,
      originalFilename: file.name,
      mimeType,
      storageKey: "",
      uploadedById: session.user.id,
    },
  });

  const ext = path.extname(file.name) || (mimeType === "application/pdf" ? ".pdf" : "");
  const relativePath = path.join("uploads", session.tenantId, `${doc.id}${ext}`);

  await mkdir(tenantUploadDir(session.tenantId), { recursive: true });
  await writeFile(path.join(process.cwd(), relativePath), buf);

  const textContent = await extractTextFromUpload(file.name, buf, mimeType);

  await prisma.document.update({
    where: { id: doc.id },
    data: { storageKey: relativePath, textContent },
  });

  await writeAudit({
    tenantId: session.tenantId,
    userId: session.user.id,
    action: "document.upload",
    entityType: "Document",
    entityId: doc.id,
    meta: { filename: file.name, mimeType },
  });

  return NextResponse.json({ id: doc.id });
}
