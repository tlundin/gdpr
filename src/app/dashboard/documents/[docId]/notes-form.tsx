"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DecisionNotesForm({
  documentId,
  initialNotes,
  readOnly,
}: {
  documentId: string;
  initialNotes: string;
  readOnly: boolean;
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
        {notes.trim() ? notes : "Inga anteckningar."}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
        placeholder="Ex: Bedömning av utlämning enligt OSL/kompletterande sekretess, proportionering enligt GDPR …"
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {pending ? "Sparar…" : "Spara anteckningar"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Sparat.</span>}
      </div>
    </div>
  );
}
