"use client";

import Link from "next/link";
import { useState } from "react";
import type { UiMessages } from "@/i18n/pick";
import { pick } from "@/i18n/pick";

export function RegisterForm({ messages }: { messages: UiMessages }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const nameRaw = String(fd.get("name") ?? "").trim();
    const orgRaw = String(fd.get("organization") ?? "").trim();
    const body = {
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      ...(nameRaw ? { name: nameRaw } : {}),
      ...(orgRaw ? { organization: orgRaw } : {}),
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

    setPending(false);

    if (!res.ok) {
      if (res.status === 409) {
        setError(pick(messages, "register.err409"));
      } else if (data.error === "validation_error") {
        setError(pick(messages, "register.errValidation"));
      } else if (res.status === 503) {
        setError(data.message ?? pick(messages, "register.err503"));
      } else {
        setError(pick(messages, "register.errGeneric"));
      }
      return;
    }

    setMessage(pick(messages, "register.success"));
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          {pick(messages, "register.nameOptional")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
      </div>
      <div>
        <label htmlFor="organization" className="block text-sm font-medium text-slate-700">
          {pick(messages, "register.orgOptional")}
        </label>
        <input
          id="organization"
          name="organization"
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
        <p className="mt-1 text-xs text-slate-500">{pick(messages, "register.orgHint")}</p>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          {pick(messages, "register.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          {pick(messages, "register.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
        <p className="mt-1 text-xs text-slate-500">{pick(messages, "register.passwordHint")}</p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      {message && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? pick(messages, "register.submitting") : pick(messages, "register.submit")}
      </button>
      <p className="text-center text-sm text-slate-600">
        {pick(messages, "register.hasAccount")}{" "}
        <Link href="/login" className="font-medium text-sky-800 hover:text-sky-950">
          {pick(messages, "register.toLogin")}
        </Link>
      </p>
    </form>
  );
}
