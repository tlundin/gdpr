"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-slate-600 hover:text-slate-900"
    >
      {label}
    </button>
  );
}
