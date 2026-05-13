"use client";

import Link from "next/link";
import { useState } from "react";

export function RegisterForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const form = e.currentTarget;
    const body = {
      email: String(form.email.value).trim(),
      password: String(form.password.value),
      name: String(form.name.value).trim() || undefined,
      organization: String(form.organization.value).trim() || undefined,
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
        setError("Den här e-postadressen är redan registrerad och verifierad.");
      } else if (data.error === "validation_error") {
        setError("Kontrollera att e-post och lösenord (minst 8 tecken) är korrekt ifyllda.");
      } else if (res.status === 503) {
        setError(data.message ?? "Kunde inte skicka bekräftelsemejl. Försök igen senare.");
      } else {
        setError("Något gick fel. Försök igen.");
      }
      return;
    }

    setMessage("Vi har skickat ett mejl med en bekräftelselänk. Kontrollera inkorgen och skräpposten.");
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Namn <span className="font-normal text-slate-500">(valfritt)</span>
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
          Organisationsnamn <span className="font-normal text-slate-500">(valfritt)</span>
        </label>
        <input
          id="organization"
          name="organization"
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
        <p className="mt-1 text-xs text-slate-500">Används som tenant-namn i verktyget.</p>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          E-post
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
          Lösenord
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
        <p className="mt-1 text-xs text-slate-500">Minst 8 tecken.</p>
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
        {pending ? "Skapar konto…" : "Skapa konto"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Har du redan konto?{" "}
        <Link href="/login" className="font-medium text-sky-800 hover:text-sky-950">
          Logga in
        </Link>
      </p>
    </form>
  );
}
