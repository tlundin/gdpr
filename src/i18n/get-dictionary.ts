import "server-only";
import type { Locale } from "./config";
import type { UiMessages } from "./pick";

const loaders: Record<Locale, () => Promise<UiMessages>> = {
  en: () => import("@/messages/en.json").then((m) => m.default as UiMessages),
  sv: () => import("@/messages/sv.json").then((m) => m.default as UiMessages),
};

export async function getDictionary(locale: Locale): Promise<UiMessages> {
  return loaders[locale]();
}
