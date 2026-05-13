import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = token?.trim();
  if (!t) {
    redirect("/login?error=invalid_token");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Bekräfta e-post</h1>
      <p className="mt-2 text-sm text-slate-600">
        Klicka på knappen nedan för att slutföra registreringen. (E-posttjänster öppnar ibland länkar i förväg; därför
        krävs ett uttryckligt steg här.)
      </p>
      <form method="POST" action="/api/auth/verify-email" className="mt-8 space-y-4">
        <input type="hidden" name="token" value={t} />
        <button
          type="submit"
          className="w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white hover:bg-sky-800"
        >
          Bekräfta min e-postadress
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-sky-800 hover:text-sky-950">
          Till inloggning
        </Link>
      </p>
    </div>
  );
}
