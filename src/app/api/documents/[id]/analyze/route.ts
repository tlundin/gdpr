import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeAudit } from "@/lib/audit";
import { iterateTextChunks } from "@/lib/analysis/chunks";
import { PROMPT_VERSION } from "@/lib/analysis/constants";
import { analyzeChunk } from "@/lib/analysis/openai-chunk";
import type { NormalizedFinding } from "@/lib/analysis/normalize";
import { normalizeFindingToDocument } from "@/lib/analysis/normalize";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.role || !canManageCases(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenantId = session.tenantId!;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY är inte satt. Lägg till den i .env på servern." },
      { status: 501 },
    );
  }

  const { id: documentId } = await context.params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, tenantId },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const text = doc.textContent?.trim() ?? "";
  if (!text.length) {
    return NextResponse.json({ error: "Dokument saknar extraherad text att analysera." }, { status: 400 });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const run = await prisma.analysisRun.create({
    data: {
      tenantId,
      documentId: doc.id,
      status: "RUNNING",
      model,
      promptVersion: PROMPT_VERSION,
      triggeredById: session.user.id,
    },
  });

  await writeAudit({
    tenantId,
    userId: session.user.id,
    action: "document.analyze.start",
    entityType: "AnalysisRun",
    entityId: run.id,
  });

  try {
    const chunks = [...iterateTextChunks(text)];
    const chunkTotal = chunks.length || 1;
    const normalized: NormalizedFinding[] = [];
    const notes: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const { chunk, baseOffset } = chunks[i];
      const parsed = await analyzeChunk(chunk, i, chunkTotal);
      if (parsed.chunkNotes?.trim()) {
        notes.push(parsed.chunkNotes.trim());
      }

      for (const finding of parsed.findings) {
        const n = normalizeFindingToDocument(text, baseOffset, chunk.length, finding);
        if (n) normalized.push(n);
      }
    }

    const summary =
      notes.length > 0
        ? notes.join(" ")
        : `Identifierade ${normalized.length} markering(ar). Granska listan och originalet — analyser är förslag, inte beslut.`;

    await prisma.$transaction(async (tx) => {
      for (const n of normalized) {
        await tx.analysisFinding.create({
          data: {
            tenantId,
            documentId: doc.id,
            runId: run.id,
            category: n.category,
            riskScore: n.riskScore,
            startOffset: n.startOffset,
            endOffset: n.endOffset,
            excerpt: n.excerpt,
            rationale: n.rationale,
            gdprHint: n.gdprHint,
          },
        });
      }

      await tx.analysisRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          summary,
          completedAt: new Date(),
        },
      });
    });

    await writeAudit({
      tenantId,
      userId: session.user.id,
      action: "document.analyze.complete",
      entityType: "AnalysisRun",
      entityId: run.id,
      meta: { findings: normalized.length },
    });

    return NextResponse.json({
      runId: run.id,
      findingsCount: normalized.length,
      summary,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: message.slice(0, 5000),
        completedAt: new Date(),
      },
    });

    await writeAudit({
      tenantId,
      userId: session.user.id,
      action: "document.analyze.failed",
      entityType: "AnalysisRun",
      entityId: run.id,
      meta: { error: message.slice(0, 500) },
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
