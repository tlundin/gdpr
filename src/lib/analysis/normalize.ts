import type { ChunkFindingInput } from "@/lib/analysis/schema";

export type NormalizedFinding = {
  category: ChunkFindingInput["category"];
  riskScore: number;
  startOffset: number;
  endOffset: number;
  excerpt: string;
  rationale: string;
  gdprHint: string | null;
};

export function normalizeFindingToDocument(
  fullText: string,
  chunkBase: number,
  chunkLength: number,
  f: ChunkFindingInput,
): NormalizedFinding | null {
  const chunkMax = chunkLength;
  let rs = Math.max(0, Math.min(f.startOffset, chunkMax));
  let re = Math.max(0, Math.min(f.endOffset, chunkMax));
  if (re < rs) {
    const t = rs;
    rs = re;
    re = t;
  }

  let start = chunkBase + rs;
  let end = chunkBase + re;
  const len = fullText.length;
  start = Math.max(0, Math.min(start, len));
  end = Math.max(0, Math.min(end, len));
  if (end < start) {
    const t = start;
    start = end;
    end = t;
  }

  if (start === end) {
    return null;
  }

  const slice = fullText.slice(start, end);
  const excerpt = slice.length > 800 ? `${slice.slice(0, 800)}…` : slice;

  return {
    category: f.category,
    riskScore: f.riskScore,
    startOffset: start,
    endOffset: end,
    excerpt: excerpt || f.excerpt.slice(0, 800),
    rationale: f.rationale,
    gdprHint: f.gdprHint ?? null,
  };
}

/** Välj icke-överlappande markeringar för visning: högre risk prioriteras. */
export function pickDisplayFindings<T extends { startOffset: number; endOffset: number; riskScore: number }>(
  items: T[],
): T[] {
  const sorted = [...items].sort((a, b) => b.riskScore - a.riskScore || a.startOffset - b.startOffset);
  const chosen: T[] = [];
  const blocks: { start: number; end: number }[] = [];

  function overlaps(s: number, e: number): boolean {
    return blocks.some((b) => s < b.end && e > b.start);
  }

  for (const item of sorted) {
    const { startOffset: s, endOffset: e } = item;
    if (e <= s) continue;
    if (overlaps(s, e)) continue;
    chosen.push(item);
    blocks.push({ start: s, end: e });
  }

  chosen.sort((a, b) => a.startOffset - b.startOffset);
  return chosen;
}
