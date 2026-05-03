import type { ReactNode } from "react";

export type HighlightSpan = {
  id: string;
  start: number;
  end: number;
  riskScore: number;
  /** Nummer som matchar listan «Senaste analys» (dokumentordning). */
  label: string;
};

export function HighlightedDocumentText({
  text,
  spans,
}: {
  text: string;
  spans: HighlightSpan[];
}) {
  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);
  const parts: ReactNode[] = [];
  let pos = 0;
  let k = 0;

  for (const s of sorted) {
    const start = Math.min(Math.max(s.start, 0), text.length);
    const end = Math.min(Math.max(s.end, start), text.length);

    if (start > pos) {
      parts.push(<span key={`t-${k++}`}>{text.slice(pos, start)}</span>);
    }

    if (end > start) {
      const cls =
        s.riskScore >= 4
          ? "bg-red-200/90 text-slate-900 ring-1 ring-red-300/80"
          : s.riskScore === 3
            ? "bg-orange-200/90 text-slate-900 ring-1 ring-orange-300/80"
            : "bg-amber-200/80 text-slate-900 ring-1 ring-amber-300/70";
      parts.push(
        <mark
          key={`h-${s.id}`}
          id={`highlight-${s.id}`}
          className={`group scroll-mt-24 inline rounded-sm px-0.5 ${cls}`}
          title={`Markering ${s.label}`}
        >
          <sup className="mr-0.5 font-sans text-[10px] font-bold text-sky-900">[{s.label}]</sup>
          {text.slice(start, end)}
        </mark>,
      );
      pos = end;
    }
  }

  if (pos < text.length) {
    parts.push(<span key={`t-${k++}`}>{text.slice(pos)}</span>);
  }

  return <div className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{parts}</div>;
}
