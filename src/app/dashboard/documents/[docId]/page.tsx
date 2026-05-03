import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";
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

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Extraherad text</h2>
            <p className="mt-1 text-sm text-slate-600">
              Använd som stöd vid sekretess- och proportioneringsbedömning. Kontrollera alltid mot originalet.
            </p>
          </div>
          <a
            href={`/api/documents/${doc.id}/export`}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
          >
            Ladda ner som .txt
          </a>
        </div>
        <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
          {doc.textContent?.trim() ? doc.textContent : "Ingen text kunde extraheras (typen stöds ev. inte ännu)."}
        </pre>
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
