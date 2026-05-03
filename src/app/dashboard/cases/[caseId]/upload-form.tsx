"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CaseUploadForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Välj en fil.");
      setPending(false);
      return;
    }
    const upload = new FormData();
    upload.append("file", file);
    upload.append("caseId", caseId);
    const title = fd.get("title");
    if (typeof title === "string" && title.trim()) upload.append("title", title.trim());

    const res = await fetch("/api/documents", { method: "POST", body: upload });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Uppladdning misslyckades.");
      setPending(false);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Ladda upp handling</h2>
      <p className="mt-1 text-sm text-slate-600">
        PDF och textfiler stöds i MVP. Bearbeta endast uppgifter ni har rättslig grund att behandla.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="block text-sm text-slate-700">
            Rubrik (valfritt)
          </label>
          <input id="title" name="title" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="file" className="block text-sm text-slate-700">
            Fil
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            className="mt-1 w-full text-sm text-slate-800 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? "Laddar upp…" : "Ladda upp"}
      </button>
    </form>
  );
}
