"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UiMessages } from "@/i18n/pick";
import { pick } from "@/i18n/pick";

export function DecisionNotesForm({
  documentId,
  initialNotes,
  readOnly,
  messages,
}: {
  documentId: string;
  initialNotes: string;
  readOnly: boolean;
  messages: UiMessages;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSave() {
    setPending(true);
    setSaved(false);
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisionNotes: notes }),
    });
    setPending(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  if (readOnly) {
    return (
      <p className="mt-4 whitespace-pre-wrap text-sm text-slate-800">
        {notes.trim() ? notes : pick(messages, "notes.readonlyEmpty")}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder={pick(messages, "notes.placeholder")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {pending ? pick(messages, "notes.saving") : pick(messages, "notes.save")}
        </button>
        {saved && <span className="text-sm text-emerald-700">{pick(messages, "notes.saved")}</span>}
      </div>
    </div>
  );
}
