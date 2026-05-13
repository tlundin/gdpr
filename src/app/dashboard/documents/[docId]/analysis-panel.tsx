"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UiMessages } from "@/i18n/pick";
import { fill, pick } from "@/i18n/pick";

export function AnalysisPanel({
  documentId,
  canRun,
  messages,
}: {
  documentId: string;
  canRun: boolean;
  messages: UiMessages;
}) {
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
        setMessage(data.error ?? pick(messages, "analysis.errFailed"));
        return;
      }
      setMessage(
        data.findingsCount != null
          ? fill(pick(messages, "analysis.doneCount"), { count: String(data.findingsCount) })
          : pick(messages, "analysis.done"),
      );
      router.refresh();
    } catch {
      setMessage(pick(messages, "analysis.errNetwork"));
    } finally {
      setPending(false);
    }
  }

  if (!canRun) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{pick(messages, "analysis.title")}</h2>
      <p className="mt-1 text-sm text-slate-600">{pick(messages, "analysis.body")}</p>
      <button
        type="button"
        onClick={runAnalysis}
        disabled={pending}
        className="mt-4 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? pick(messages, "analysis.analyzing") : pick(messages, "analysis.run")}
      </button>
      {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
    </div>
  );
}
