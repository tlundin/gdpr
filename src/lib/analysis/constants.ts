export const PROMPT_VERSION = "v1";

/** Ca ~8k UTF-16 code units per OpenAI-anrop (chunk + överlapp minskar delningsfel). */
export const CHUNK_SIZE = 7000;
export const CHUNK_OVERLAP = 400;

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
