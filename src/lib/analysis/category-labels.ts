import type { FindingCategory } from "@prisma/client";

const labels: Record<FindingCategory, string> = {
  IDENTIFIER: "Identifierare (t.ex. personnummer)",
  CONTACT: "Kontaktuppgifter",
  HEALTH: "Hälsa / hälso- och sjukvård",
  POLITICAL: "Politiska åsikter",
  UNION: "Fackliga förhållanden",
  RELIGION: "Religion eller livsåskådning",
  BIOMETRIC: "Biometri",
  OTHER_SENSITIVE: "Annan särskilt känslig kategori",
  GENERAL_PERSONAL: "Allmän personuppgift",
  LOCATION_WORK: "Plats / arbets-/tjänsteförhållanden",
  OTHER: "Övrigt",
};

export function categoryLabel(c: FindingCategory): string {
  return labels[c] ?? c;
}

export function riskLabel(n: number): string {
  if (n <= 1) return "Låg";
  if (n === 2) return "Relativt låg";
  if (n === 3) return "Medel";
  if (n === 4) return "Hög";
  return "Mycket hög";
}
