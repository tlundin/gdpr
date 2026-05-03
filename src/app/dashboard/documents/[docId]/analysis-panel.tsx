"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalysisPanel({ documentId, canRun }: { documentId: string; canRun: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runAnalysis() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/analyze`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; findingsCount?: number };
      if (!res.ok) {
        setMessage(data.error ?? "Analysen misslyckades.");
        return;
      }
      setMessage(data.findingsCount != null ? `Klar: ${data.findingsCount} markering(ar).` : "Klar.");
      router.refresh();
    } catch {
      setMessage("Nätverksfel eller timeout.");
    } finally {
      setPending(false);
    }
  }

  if (!canRun) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Automatisk AI-analys</h2>
      <p className="mt-1 text-sm text-slate-600">
        Startar en ny körning mot OpenAI. Resultatet är <strong>förslag</strong> — kontrollera alltid mot
        originalet. Personuppgifter skickas till OpenAI; säkerställ intern godkännande och DPA.
      </p>
      <button
        type="button"
        onClick={runAnalysis}
        disabled={pending}
        className="mt-4 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? "Analyserar…" : "Starta automatisk analys"}
      </button>
      {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
    </div>
  );
}
