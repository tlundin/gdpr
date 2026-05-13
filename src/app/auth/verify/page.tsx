import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { pick } from "@/i18n/pick";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = token?.trim();
  if (!t) {
    redirect("/login?error=invalid_token");
  }

  const locale = await getLocale();
  const d = await getDictionary(locale);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">{pick(d, "verify.title")}</h1>
      <p className="mt-2 text-sm text-slate-600">{pick(d, "verify.intro")}</p>
      <form method="POST" action="/api/auth/verify-email" className="mt-8 space-y-4">
        <input type="hidden" name="token" value={t} />
        <button
          type="submit"
          className="w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white hover:bg-sky-800"
        >
          {pick(d, "verify.submit")}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-sky-800 hover:text-sky-950">
          {pick(d, "verify.toLogin")}
        </Link>
      </p>
    </div>
  );
}
