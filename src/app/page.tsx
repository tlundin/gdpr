import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { pick } from "@/i18n/pick";

export default async function HomePage() {
  const locale = await getLocale();
  const d = await getDictionary(locale);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-sky-800">{pick(d, "home.tagline")}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
        {pick(d, "home.title")}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-600">{pick(d, "home.body")}</p>
      <ul className="mt-8 list-inside list-disc space-y-2 text-slate-700">
        <li>{pick(d, "home.bullet1")}</li>
        <li>{pick(d, "home.bullet2")}</li>
        <li>{pick(d, "home.bullet3")}</li>
        <li>{pick(d, "home.bullet4")}</li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-800"
        >
          {pick(d, "home.login")}
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-800 hover:bg-slate-50"
        >
          {pick(d, "home.register")}
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-800 hover:bg-slate-50"
        >
          {pick(d, "home.workspace")}
        </Link>
      </div>
    </main>
  );
}
