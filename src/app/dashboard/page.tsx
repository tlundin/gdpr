import Link from "next/link";
import { auth } from "@/auth";
import { dateLocaleTag } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { pick } from "@/i18n/pick";
import { prisma } from "@/lib/prisma";

export default async function DashboardHomePage() {
  const session = await auth();
  const tenantId = session!.tenantId!;
  const locale = await getLocale();
  const d = await getDictionary(locale);
  const dateTag = dateLocaleTag(locale);

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
        <h1 className="text-2xl font-semibold text-slate-900">{pick(d, "dashboardHome.title")}</h1>
        <p className="mt-1 text-slate-600">{pick(d, "dashboardHome.intro")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{pick(d, "dashboardHome.casesLabel")}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{caseCount}</p>
          <Link href="/dashboard/cases" className="mt-3 inline-block text-sm font-medium text-sky-800 hover:underline">
            {pick(d, "dashboardHome.casesLink")}
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{pick(d, "dashboardHome.documentsLabel")}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{docCount}</p>
          <p className="mt-3 text-sm text-slate-600">{pick(d, "dashboardHome.documentsBlurb")}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-slate-900">{pick(d, "dashboardHome.activity")}</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {recent.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-500">{pick(d, "dashboardHome.noActivity")}</li>
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
                {row.user?.email ?? pick(d, "dashboard.audit.system")} ·{" "}
                {row.createdAt.toLocaleString(dateTag)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
