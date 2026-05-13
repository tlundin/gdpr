"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UiMessages } from "@/i18n/pick";
import { pick } from "@/i18n/pick";

export function CaseUploadForm({ caseId, messages }: { caseId: string; messages: UiMessages }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("caseId", caseId);
    const res = await fetch("/api/documents", { method: "POST", body: fd });
    setPending(false);
    if (res.ok) {
      const j = (await res.json()) as { id: string };
      router.push(`/dashboard/documents/${j.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{pick(messages, "upload.title")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="block text-sm text-slate-700">
            {pick(messages, "upload.fieldTitle")}
          </label>
          <input id="title" name="title" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="file" className="block text-sm text-slate-700">
            {pick(messages, "upload.fileLabel")}
          </label>
          <input id="file" name="file" type="file" required className="mt-1 block w-full text-sm text-slate-700" />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? pick(messages, "upload.uploading") : pick(messages, "upload.submit")}
      </button>
    </form>
  );
}
