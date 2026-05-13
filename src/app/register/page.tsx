import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "./ui";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Skapa konto</h1>
      <p className="mt-2 text-sm text-slate-600">
        Registrera dig med e-post. Du måste bekräfta adressen via länken i mejlet innan du kan logga in. Om du inte
        får mejl, kontrollera skräppost eller registrera igen med samma adress för att skicka om länken.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-xs text-slate-500">
        <Link href="/" className="text-sky-800 hover:text-sky-950">
          Till startsidan
        </Link>
      </p>
    </div>
  );
}
