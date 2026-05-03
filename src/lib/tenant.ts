import type { Role } from "@prisma/client";

const roleRank: Record<Role, number> = {
  LASARE: 0,
  HANDLAGGARE: 1,
  ADMIN: 2,
};

export function canManageCases(role: Role): boolean {
  return roleRank[role] >= roleRank.HANDLAGGARE;
}

export function canAdminTenant(role: Role): boolean {
  return role === "ADMIN";
}
