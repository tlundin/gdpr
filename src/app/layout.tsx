import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { pick } from "@/i18n/pick";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const d = await getDictionary(locale);
  return {
    title: pick(d, "meta.title"),
    description: pick(d, "meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const htmlLang = locale === "sv" ? "sv" : "en";
  const messages = await getDictionary(locale);

  return (
    <html lang={htmlLang}>
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <Providers>
          <SiteHeader locale={locale} messages={messages} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
