import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LangSwitch } from "@/components/LangSwitch";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { pick } from "@/i18n/pick";
import { RegisterForm } from "./ui";

export default async function RegisterPage() {
  const session = await auth();
  const locale = await getLocale();
  const d = await getDictionary(locale);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="absolute right-6 top-6">
        <LangSwitch locale={locale} dict={{ en: pick(d, "lang.en"), sv: pick(d, "lang.sv") }} />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">{pick(d, "register.title")}</h1>
      <p className="mt-2 text-sm text-slate-600">{pick(d, "register.intro")}</p>
      <RegisterForm messages={d} />
      <p className="mt-6 text-center text-xs text-slate-500">
        <Link href="/" className="text-sky-800 hover:text-sky-950">
          {pick(d, "register.footerHome")}
        </Link>
      </p>
    </div>
  );
}
