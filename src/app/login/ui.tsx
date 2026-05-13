"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import type { UiMessages } from "@/i18n/pick";
import { pick } from "@/i18n/pick";

export function LoginForm({ messages, callbackUrl }: { messages: UiMessages; callbackUrl?: string }) {
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      callbackUrl: callbackUrl ?? "/dashboard",
    });
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          {pick(messages, "login.email")}
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
          {pick(messages, "login.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? pick(messages, "login.submitting") : pick(messages, "login.submit")}
      </button>
      <p className="text-center text-sm text-slate-600">
        {pick(messages, "login.createAccountLead")}{" "}
        <Link href="/register" className="font-medium text-sky-800 hover:text-sky-950">
          {pick(messages, "login.createAccount")}
        </Link>
      </p>
    </form>
  );
}
