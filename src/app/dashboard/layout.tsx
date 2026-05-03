import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!session.tenantId) {
    redirect("/login?error=no_tenant");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, slug: true },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Tenant</p>
            <p className="font-medium text-slate-900">{tenant?.name ?? "—"}</p>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-slate-700 hover:text-sky-800">
              Översikt
            </Link>
            <Link href="/dashboard/cases" className="text-slate-700 hover:text-sky-800">
              Ärenden
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      <footer className="border-t border-slate-200 bg-slate-100/80">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-600">
          Verktyget ger struktur och spårbarhet; juridisk bedömning och beslut om utlämning ansvarar er
          organisation alltid för.
        </div>
      </footer>
    </div>
  );
}
