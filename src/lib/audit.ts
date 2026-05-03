import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAudit(params: {
  tenantId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      meta: params.meta ?? undefined,
    },
  });
}
