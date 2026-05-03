import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
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
        Använd det konto som administratören skapat. Lokalt: demo enligt README.
      </p>
      {params.error === "CredentialsSignin" && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Fel e-post eller lösenord.
        </p>
      )}
      <LoginForm callbackUrl={params.callbackUrl} />
    </div>
  );
}
