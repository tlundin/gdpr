/**
 * One-off / admin: remove a user by e-post and rensa relaterad data.
 * Kör på servern: npx tsx scripts/delete-user-by-email.ts user@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2]?.toLowerCase().trim();
if (!email) {
  console.error("usage: npx tsx scripts/delete-user-by-email.ts <email>");
  process.exit(1);
}

async function main() {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("No user found:", email);
    return;
  }

  await prisma.auditLog.updateMany({ where: { userId: user.id }, data: { userId: null } });
  await prisma.analysisRun.updateMany({ where: { triggeredById: user.id }, data: { triggeredById: null } });
  await prisma.document.deleteMany({ where: { uploadedById: user.id } });

  const memberships = await prisma.membership.findMany({ where: { userId: user.id } });
  const tenantIds = [...new Set(memberships.map((m) => m.tenantId))];

  await prisma.membership.deleteMany({ where: { userId: user.id } });

  for (const tenantId of tenantIds) {
    const remaining = await prisma.membership.count({ where: { tenantId } });
    if (remaining === 0) {
      await prisma.tenant.delete({ where: { id: tenantId } });
    }
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log("Deleted user:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
