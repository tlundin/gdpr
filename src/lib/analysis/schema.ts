import { FindingCategory } from "@prisma/client";
import { z } from "zod";

export const chunkFindingSchema = z.object({
  category: z.nativeEnum(FindingCategory),
  riskScore: z.number().int().min(1).max(5),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  excerpt: z.string().max(2000),
  rationale: z.string().max(2000),
  gdprHint: z.string().max(1000).optional().nullable(),
});

export const chunkResponseSchema = z.object({
  findings: z.array(chunkFindingSchema),
  chunkNotes: z.string().max(2000).optional(),
});

export type ChunkFindingInput = z.infer<typeof chunkFindingSchema>;
