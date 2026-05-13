"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";

/** Preserves existing query string except replaces `lang`. */
function hrefWithLang(pathname: string, search: URLSearchParams, lang: Locale): string {
  const next = new URLSearchParams(search.toString());
  next.set("lang", lang);
  const q = next.toString();
  return q ? `${pathname}?${q}` : `${pathname}?lang=${lang}`;
}

const FLAG: Record<Locale, string> = {
  en: "\u{1F1EC}\u{1F1E7}",
  sv: "\u{1F1F8}\u{1F1EA}",
};

export function LangSwitch({ locale, dict }: { locale: Locale; dict: { en: string; sv: string } }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const other: Locale = locale === "sv" ? "en" : "sv";
  const label = other === "en" ? dict.en : dict.sv;
  return (
    <Link
      href={hrefWithLang(pathname, search, other)}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-sky-800"
      prefetch={false}
      aria-label={label}
    >
      <span className="text-base leading-none" aria-hidden>
        {FLAG[other]}
      </span>
      {label}
    </Link>
  );
}
