import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { pickDisplayFindings } from "@/lib/analysis/normalize";
import { HighlightedDocumentText } from "@/components/HighlightedDocumentText";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";
import { AnalysisPanel } from "./analysis-panel";
import { FindingList } from "./finding-list";
import { DecisionNotesForm } from "./notes-form";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const session = await auth();
  const tenantId = session!.tenantId!;
  const role = session!.role!;
  const { docId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: docId, tenantId },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      case: { select: { id: true, title: true } },
    },
  });

  if (!doc) {
    notFound();
  }

  const editable = canManageCases(role);

  const [latestSuccess, latestAttempt] = await Promise.all([
    prisma.analysisRun.findFirst({
      where: { documentId: doc.id, tenantId, status: "SUCCEEDED" },
      orderBy: { completedAt: "desc" },
      include: {
        findings: { orderBy: [{ riskScore: "desc" }, { startOffset: "asc" }] },
      },
    }),
    prisma.analysisRun.findFirst({
      where: { documentId: doc.id, tenantId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const findings = latestSuccess?.findings ?? [];
  /** Numreringsordning = dokumentets läsordning (position). */
  const findingsByPosition = [...findings].sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);
  const numberById = new Map(findingsByPosition.map((f, i) => [f.id, i + 1]));

  const displayedInText = new Set(pickDisplayFindings(findings).map((f) => f.id));

  const displaySpans = pickDisplayFindings(findings).map((f) => ({
    id: f.id,
    start: f.startOffset,
    end: f.endOffset,
    riskScore: f.riskScore,
    label: String(numberById.get(f.id) ?? ""),
  }));

  const bodyText = doc.textContent ?? "";

  const findingListItems = findingsByPosition.map((f) => ({
    id: f.id,
    number: numberById.get(f.id) ?? 0,
    category: f.category,
    riskScore: f.riskScore,
    rationale: f.rationale,
    gdprHint: f.gdprHint,
    excerpt: f.excerpt,
    shownInExtractedText: displayedInText.has(f.id),
  }));

  return (
    <div className="space-y-8">
      <div>
        {doc.case && (
          <Link
            href={`/dashboard/cases/${doc.case.id}`}
            className="text-sm font-medium text-sky-800 hover:underline"
          >
            ← {doc.case.title}
          </Link>
        )}
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{doc.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {doc.originalFilename} · Uppladdad {doc.createdAt.toLocaleString("sv-SE")} av{" "}
          {doc.uploadedBy.name ?? doc.uploadedBy.email}
        </p>
      </div>

      <AnalysisPanel documentId={doc.id} canRun={editable} />

      {latestAttempt?.status === "FAILED" && latestAttempt.errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">Senaste analys misslyckades</p>
          <p className="mt-1">{latestAttempt.errorMessage}</p>
        </div>
      )}

      {findings.length > 0 && latestSuccess && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Senaste analys</h2>
          <p className="mt-1 text-sm text-slate-600">
            Modell {latestSuccess.model} · {latestSuccess.completedAt?.toLocaleString("sv-SE") ?? ""}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Varje rad har samma nummer som{" "}
            <span className="font-mono text-slate-800">[N]</span> i den extraherade texten nedan. Under «Markerad text»
            visas exakt den passage modellen avsett.
          </p>
          {latestSuccess.summary && <p className="mt-3 text-sm text-slate-800">{latestSuccess.summary}</p>}
          <FindingList items={findingListItems} />
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Extraherad text</h2>
            <p className="mt-1 text-sm text-slate-600">
              Markeringar med <span className="font-mono">[N]</span> motsvarar punkten med samma nummer i listan ovan.
              Vid överlapp visas högst risk; övriga finns kvar som citat i listan.
            </p>
          </div>
          <a
            href={`/api/documents/${doc.id}/export`}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
          >
            Ladda ner som .txt
          </a>
        </div>
        <div className="mt-4 max-h-[480px] overflow-auto rounded-lg bg-slate-50 p-4">
          {bodyText.trim() ? (
            <HighlightedDocumentText text={bodyText} spans={displaySpans} />
          ) : (
            <p className="text-sm text-slate-600">Ingen text kunde extraheras (typen stöds ev. inte ännu).</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Besluts- och bedömningsanteckningar</h2>
        <p className="mt-1 text-sm text-slate-600">
          Dokumentera skäl, balanceringsintressen och eventuella utlämningsbeslut enligt er interna process.
        </p>
        <DecisionNotesForm documentId={doc.id} initialNotes={doc.decisionNotes ?? ""} readOnly={!editable} />
      </section>
    </div>
  );
}
