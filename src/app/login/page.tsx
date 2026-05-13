import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; callbackUrl?: string; verified?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) {
    redirect(params.callbackUrl ?? "/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Logga in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Logga in med e-post och lösenord. Lokalt: demo enligt README.
      </p>
      {params.verified === "1" && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          E-postadressen är bekräftad. Du kan logga in nu.
        </p>
      )}
      {params.error === "no_tenant" && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Ditt konto saknar organisationstillhörighet. Kontakta administratören.
        </p>
      )}
      {params.error === "invalid_token" && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Bekräftelselänken är ogiltig eller har gått ut. Registrera dig igen eller be om nytt mejl.
        </p>
      )}
      {params.error === "CredentialsSignin" && params.code === "unverified" && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Bekräfta din e-postadress via länken i mejlet innan du loggar in. Registrera igen med samma adress om du
          behöver ett nytt mejl.
        </p>
      )}
      {params.error === "CredentialsSignin" && params.code !== "unverified" && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Fel e-post eller lösenord.
        </p>
      )}
      <LoginForm callbackUrl={params.callbackUrl} />
    </div>
  );
}
