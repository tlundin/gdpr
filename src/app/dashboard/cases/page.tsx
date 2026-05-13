import Link from "next/link";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { fill, pick } from "@/i18n/pick";
import { prisma } from "@/lib/prisma";
import { canManageCases } from "@/lib/tenant";
import { CreateCaseForm } from "./ui";

export default async function CasesPage() {
  const session = await auth();
  const tenantId = session!.tenantId!;
  const role = session!.role!;
  const locale = await getLocale();
  const d = await getDictionary(locale);

  const cases = await prisma.case.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { documents: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{pick(d, "cases.title")}</h1>
        <p className="mt-1 text-slate-600">{pick(d, "cases.intro")}</p>
      </div>

      {canManageCases(role) && <CreateCaseForm messages={d} />}

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {cases.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">{pick(d, "cases.empty")}</li>
        )}
        {cases.map((c) => (
          <li key={c.id}>
            <Link
              href={`/dashboard/cases/${c.id}`}
              className="flex flex-col gap-1 px-4 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-slate-900">{c.title}</span>
              <span className="text-sm text-slate-500">
                {fill(pick(d, "cases.list.recordCount"), { count: String(c._count.documents) })}
                {c.diaryRef ? ` · ${c.diaryRef}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
