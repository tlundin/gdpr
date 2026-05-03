import { CHUNK_OVERLAP, CHUNK_SIZE } from "@/lib/analysis/constants";

export function* iterateTextChunks(text: string): Generator<{ chunk: string; baseOffset: number }> {
  if (!text.length) return;

  let base = 0;
  while (base < text.length) {
    const end = Math.min(base + CHUNK_SIZE, text.length);
    yield { chunk: text.slice(base, end), baseOffset: base };
    if (end >= text.length) break;
    const nextBase = end - CHUNK_OVERLAP;
    base = nextBase > base ? nextBase : end;
  }
}
