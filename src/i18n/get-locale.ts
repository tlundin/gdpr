import "server-only";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const raw = (await cookies()).get("i18n-locale")?.value;
  if (raw && isLocale(raw)) return raw;
  return defaultLocale;
}
