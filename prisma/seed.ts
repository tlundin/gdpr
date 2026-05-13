import { BillingSource, ProductType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-myndighet" },
    update: {},
    create: {
      name: "Demo myndighet",
      slug: "demo-myndighet",
      billingSource: BillingSource.INVOICE,
      contractReference: "DEMO-1",
      invoicePaidAt: new Date(),
      productType: ProductType.ANNUAL,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      seats: 10,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: { passwordHash, emailVerified: new Date() },
    create: {
      email: "demo@example.com",
      name: "Demo användare",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_tenantId: { userId: user.id, tenantId: tenant.id },
    },
    update: { role: Role.ADMIN },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: Role.ADMIN,
    },
  });

  const janHash = await bcrypt.hash("banan", 12);
  const janUser = await prisma.user.upsert({
    where: { email: "jan@example.com" },
    update: { passwordHash: janHash, name: "Jan", emailVerified: new Date() },
    create: {
      email: "jan@example.com",
      name: "Jan",
      passwordHash: janHash,
      emailVerified: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_tenantId: { userId: janUser.id, tenantId: tenant.id },
    },
    update: { role: Role.HANDLAGGARE },
    create: {
      userId: janUser.id,
      tenantId: tenant.id,
      role: Role.HANDLAGGARE,
    },
  });

  console.log("Seed klar: demo@example.com / demo12345 · jan@example.com / banan");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
