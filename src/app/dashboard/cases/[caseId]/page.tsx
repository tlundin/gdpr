import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";
import { CaseUploadForm } from "./upload-form";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const session = await auth();
  const tenantId = session!.tenantId!;
  const role = session!.role!;
  const { caseId } = await params;

  const c = await prisma.case.findFirst({
    where: { id: caseId, tenantId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          originalFilename: true,
          createdAt: true,
        },
      },
    },
  });

  if (!c) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/cases" className="text-sm font-medium text-sky-800 hover:underline">
          ← Alla ärenden
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{c.title}</h1>
        {c.diaryRef && <p className="mt-1 text-sm text-slate-600">Diarium: {c.diaryRef}</p>}
        {c.notes && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800">
            {c.notes}
          </p>
        )}
      </div>

      {canManageCases(role) && <CaseUploadForm caseId={c.id} />}

      <div>
        <h2 className="text-lg font-medium text-slate-900">Handlingar</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {c.documents.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-500">Inga handlingar uppladdade.</li>
          )}
          {c.documents.map((d) => (
            <li key={d.id}>
              <Link
                href={`/dashboard/documents/${d.id}`}
                className="flex flex-col gap-1 px-4 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-slate-900">{d.title}</span>
                <span className="text-sm text-slate-500">
                  {d.originalFilename} · {d.createdAt.toLocaleString("sv-SE")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
