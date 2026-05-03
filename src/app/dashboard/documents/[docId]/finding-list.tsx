"use client";

import type { FindingCategory } from "@prisma/client";
import { categoryLabel, riskLabel } from "@/lib/analysis/category-labels";

export type FindingRowProps = {
  id: string;
  number: number;
  category: FindingCategory;
  riskScore: number;
  rationale: string;
  gdprHint: string | null;
  excerpt: string;
  shownInExtractedText: boolean;
};

export function FindingList({ items }: { items: FindingRowProps[] }) {
  function scrollToHighlight(id: string) {
    const el = document.getElementById(`highlight-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-2", "ring-sky-600");
    window.setTimeout(() => el?.classList.remove("ring-2", "ring-sky-600"), 1600);
  }

  return (
    <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
      {items.map((f) => (
        <li key={f.id} id={`finding-${f.id}`} className="px-3 py-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium text-slate-900">
              <span className="mr-2 inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded bg-sky-100 px-1.5 font-mono text-xs text-sky-900">
                {f.number}
              </span>
              {categoryLabel(f.category)}
            </span>
            <span className="text-xs text-slate-500">
              Risk {f.riskScore}/5 ({riskLabel(f.riskScore)})
            </span>
          </div>

          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 font-mono text-xs text-slate-800">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Markerad text
            </span>
            <p className="mt-1 whitespace-pre-wrap">{f.excerpt || "(tom passage)"}</p>
          </div>

          <p className="mt-2 text-slate-700">{f.rationale}</p>
          {f.gdprHint && <p className="mt-1 text-xs text-slate-600">{f.gdprHint}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {f.shownInExtractedText ? (
              <button
                type="button"
                onClick={() => scrollToHighlight(f.id)}
                className="text-sm font-medium text-sky-800 underline hover:text-sky-950"
              >
                Visa i extraherad text ↓
              </button>
            ) : (
              <span className="text-xs text-slate-500">
                Passagen visas som citat ovan; i texten döljs den av en överlappande markering med högre risk.
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
