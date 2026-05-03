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
    update: { passwordHash },
    create: {
      email: "demo@example.com",
      name: "Demo användare",
      passwordHash,
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

  console.log("Seed klar: demo@example.com / demo12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
