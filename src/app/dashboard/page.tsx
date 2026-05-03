import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardHomePage() {
  const session = await auth();
  const tenantId = session!.tenantId!;

  const [caseCount, docCount, recent] = await Promise.all([
    prisma.case.count({ where: { tenantId } }),
    prisma.document.count({ where: { tenantId } }),
    prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Översikt</h1>
        <p className="mt-1 text-slate-600">
          Arbeta med ärenden, ladda upp handlingar och dokumentera bedömningar. All åtkomst loggas per
          organisation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Ärenden</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{caseCount}</p>
          <Link href="/dashboard/cases" className="mt-3 inline-block text-sm font-medium text-sky-800 hover:underline">
            Hantera ärenden →
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Handlingar</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{docCount}</p>
          <p className="mt-3 text-sm text-slate-600">Uppladdade dokument i er tenant.</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-slate-900">Senaste händelser</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {recent.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-500">Ingen aktivitet ännu.</li>
          )}
          {recent.map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm">
              <span className="text-slate-800">
                <span className="font-medium">{row.action}</span>{" "}
                <span className="text-slate-500">
                  {row.entityType}
                  {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ""}
                </span>
              </span>
              <span className="text-xs text-slate-500">
                {row.user?.email ?? "system"} · {row.createdAt.toLocaleString("sv-SE")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
