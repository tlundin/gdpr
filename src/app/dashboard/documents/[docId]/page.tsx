import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { categoryLabel, riskLabel } from "@/lib/analysis/category-labels";
import { pickDisplayFindings } from "@/lib/analysis/normalize";
import { HighlightedDocumentText } from "@/components/HighlightedDocumentText";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";
import { AnalysisPanel } from "./analysis-panel";
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
  const displaySpans = pickDisplayFindings(findings).map((f) => ({
    id: f.id,
    start: f.startOffset,
    end: f.endOffset,
    riskScore: f.riskScore,
  }));

  const bodyText = doc.textContent ?? "";

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
          {latestSuccess.summary && <p className="mt-3 text-sm text-slate-800">{latestSuccess.summary}</p>}
          <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
            {findings.map((f) => (
              <li key={f.id} className="px-3 py-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-900">{categoryLabel(f.category)}</span>
                  <span className="text-xs text-slate-500">
                    Risk {f.riskScore}/5 ({riskLabel(f.riskScore)})
                  </span>
                </div>
                <p className="mt-1 text-slate-700">{f.rationale}</p>
                {f.gdprHint && <p className="mt-1 text-xs text-slate-600">{f.gdprHint}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Extraherad text</h2>
            <p className="mt-1 text-sm text-slate-600">
              Markeringar visar icke-överlappande passager med högst risk först. Kontrollera alltid mot
              originalet.
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
