import "server-only";
import pdfParse from "pdf-parse";

export async function extractTextFromUpload(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
  const lower = filename.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const result = await pdfParse(buffer);
    return result.text?.trim() ?? "";
  }

  if (mimeType.startsWith("text/") || lower.endsWith(".txt")) {
    return buffer.toString("utf8");
  }

  return "";
}
