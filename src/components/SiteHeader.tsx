import Link from "next/link";
import { Suspense } from "react";
import { LangSwitch } from "@/components/LangSwitch";
import { SiteMark } from "@/components/SiteMark";
import type { Locale } from "@/i18n/config";
import type { UiMessages } from "@/i18n/pick";
import { pick } from "@/i18n/pick";

export function SiteHeader({ locale, messages }: { locale: Locale; messages: UiMessages }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-slate-900 hover:text-sky-900">
          <SiteMark className="h-7 w-7 shrink-0 text-sky-700 sm:h-8 sm:w-8" />
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
            {pick(messages, "site.brandTitle")}
          </span>
        </Link>
        <Suspense fallback={<span className="h-4 w-20 shrink-0 rounded bg-slate-100" aria-hidden />}>
          <LangSwitch locale={locale} dict={{ en: pick(messages, "lang.en"), sv: pick(messages, "lang.sv") }} />
        </Suspense>
      </div>
    </header>
  );
}
