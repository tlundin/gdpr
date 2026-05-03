import OpenAI from "openai";
import type { z } from "zod";
import { DEFAULT_OPENAI_MODEL } from "@/lib/analysis/constants";
import { systemPrompt, userPromptForChunk } from "@/lib/analysis/build-prompt";
import { chunkResponseSchema } from "@/lib/analysis/schema";

const jsonSchema = {
  name: "chunk_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: {
              type: "string",
              enum: [
                "IDENTIFIER",
                "CONTACT",
                "HEALTH",
                "POLITICAL",
                "UNION",
                "RELIGION",
                "BIOMETRIC",
                "OTHER_SENSITIVE",
                "GENERAL_PERSONAL",
                "LOCATION_WORK",
                "OTHER",
              ],
            },
            riskScore: { type: "integer", minimum: 1, maximum: 5 },
            startOffset: { type: "integer", minimum: 0 },
            endOffset: { type: "integer", minimum: 0 },
            excerpt: { type: "string" },
            rationale: { type: "string" },
            gdprHint: { type: ["string", "null"] },
          },
          required: ["category", "riskScore", "startOffset", "endOffset", "excerpt", "rationale", "gdprHint"],
        },
      },
      chunkNotes: { type: "string" },
    },
    required: ["findings", "chunkNotes"],
  },
} as const;

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export type ChunkResponse = z.infer<typeof chunkResponseSchema>;

export async function analyzeChunk(
  chunk: string,
  chunkIndex: number,
  chunkTotal: number,
): Promise<ChunkResponse> {
  const openai = getClient();
  if (!openai) {
    throw new Error("OPENAI_API_KEY saknas");
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;

  const res = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: userPromptForChunk(chunk, chunkIndex, chunkTotal) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: jsonSchema,
    },
  });

  const content = res.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Tomt svar från modell");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Kunde inte tolka JSON från modell");
  }

  return chunkResponseSchema.parse(parsed);
}
