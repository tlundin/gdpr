import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LangSwitch } from "@/components/LangSwitch";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { pick } from "@/i18n/pick";
import { LoginForm } from "./ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; callbackUrl?: string; verified?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const locale = await getLocale();
  const d = await getDictionary(locale);

  if (session?.user) {
    redirect(params.callbackUrl ?? "/dashboard");
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="absolute right-6 top-6">
        <LangSwitch locale={locale} dict={{ en: pick(d, "lang.en"), sv: pick(d, "lang.sv") }} />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">{pick(d, "login.title")}</h1>
      <p className="mt-2 text-sm text-slate-600">{pick(d, "login.intro")}</p>
      {params.verified === "1" && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {pick(d, "login.verified")}
        </p>
      )}
      {params.error === "no_tenant" && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {pick(d, "login.noTenant")}
        </p>
      )}
      {params.error === "expired_token" && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {pick(d, "login.expiredToken")}
        </p>
      )}
      {params.error === "invalid_token" && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {pick(d, "login.invalidToken")}
        </p>
      )}
      {params.error === "CredentialsSignin" && params.code === "unverified" && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {pick(d, "login.unverified")}
        </p>
      )}
      {params.error === "CredentialsSignin" && params.code !== "unverified" && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {pick(d, "login.badCredentials")}
        </p>
      )}
      <LoginForm messages={d} callbackUrl={params.callbackUrl} />
    </div>
  );
}
