import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { dateLocaleTag } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { pick } from "@/i18n/pick";
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
  const locale = await getLocale();
  const d = await getDictionary(locale);
  const dateTag = dateLocaleTag(locale);

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
          {doc.originalFilename} · {pick(d, "document.uploadedPrefix")} {doc.createdAt.toLocaleString(dateTag)}{" "}
          {pick(d, "document.uploadedBy")} {doc.uploadedBy.name ?? doc.uploadedBy.email}
        </p>
      </div>

      <AnalysisPanel documentId={doc.id} canRun={editable} messages={d} />

      {latestAttempt?.status === "FAILED" && latestAttempt.errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">{pick(d, "document.analysisFailedTitle")}</p>
          <p className="mt-1">{latestAttempt.errorMessage}</p>
        </div>
      )}

      {findings.length > 0 && latestSuccess && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">{pick(d, "document.latestTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {pick(d, "document.latestMetaModel")} {latestSuccess.model} ·{" "}
            {latestSuccess.completedAt?.toLocaleString(dateTag) ?? ""}
          </p>
          <p className="mt-2 text-sm text-slate-600">{pick(d, "document.latestHint")}</p>
          {latestSuccess.summary && <p className="mt-3 text-sm text-slate-800">{latestSuccess.summary}</p>}
          <FindingList items={findingListItems} messages={d} />
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{pick(d, "document.extractedTitle")}</h2>
            <p className="mt-1 text-sm text-slate-600">{pick(d, "document.extractedHint")}</p>
          </div>
          <a
            href={`/api/documents/${doc.id}/export`}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
          >
            {pick(d, "document.exportTxt")}
          </a>
        </div>
        <div className="mt-4 max-h-[480px] overflow-auto rounded-lg bg-slate-50 p-4">
          {bodyText.trim() ? (
            <HighlightedDocumentText text={bodyText} spans={displaySpans} />
          ) : (
            <p className="text-sm text-slate-600">{pick(d, "document.noText")}</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{pick(d, "document.notesTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{pick(d, "document.notesIntro")}</p>
        <DecisionNotesForm documentId={doc.id} initialNotes={doc.decisionNotes ?? ""} readOnly={!editable} messages={d} />
      </section>
    </div>
  );
}
