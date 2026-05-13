import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-sky-800">Verktyg för svenska myndigheter</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
        Analys och hantering av handlingar med känsliga personuppgifter
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-600">
        Strukturera beslutsunderlag vid utlämning av allmänna handlingar, dokumentera bedömningar enligt
        dataskyddsförordningen och få spårbarhet i processen. Verktyget ersätter inte juridisk rådgivning;
        ansvaret för bedömning ligger alltid hos er organisation.
      </p>
      <ul className="mt-8 list-inside list-disc space-y-2 text-slate-700">
        <li>Ärenden, dokument och versionshistorik</li>
        <li>Textextraktion och anteckningar för sekretess-/proportioneringsbedömning</li>
        <li>Revisionslogg för åtgärder per tenant</li>
        <li>Fakturering: engångsavgift eller årsabonnemang (självbetjäning eller avtal)</li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-800"
        >
          Logga in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-800 hover:bg-slate-50"
        >
          Skapa konto
        </Link>
        <Link href="/dashboard" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-800 hover:bg-slate-50">
          Öppna arbetsyta
        </Link>
      </div>
    </main>
  );
}
