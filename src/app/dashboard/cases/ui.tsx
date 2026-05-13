"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UiMessages } from "@/i18n/pick";
import { pick } from "@/i18n/pick";

export function CreateCaseForm({ messages }: { messages: UiMessages }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        diaryRef: fd.get("diaryRef") || undefined,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? pick(messages, "casesUi.errCreate"));
      setPending(false);
      return;
    }
    const created = await res.json();
    router.push(`/dashboard/cases/${created.id}`);
    router.refresh();
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{pick(messages, "casesUi.newCaseTitle")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="block text-sm text-slate-700">
            {pick(messages, "casesUi.fieldTitle")}
          </label>
          <input
            id="title"
            name="title"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="diaryRef" className="block text-sm text-slate-700">
            {pick(messages, "casesUi.fieldDiary")}
          </label>
          <input id="diaryRef" name="diaryRef" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? pick(messages, "casesUi.creating") : pick(messages, "casesUi.createSubmit")}
      </button>
    </form>
  );
}
