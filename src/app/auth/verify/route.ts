import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { prisma } from "@/lib/prisma";

function redirectToLogin(query: string) {
  const base = getAppBaseUrl().replace(/\/$/, "");
  const url = new URL(`${base}/login`);
  url.search = query;
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirectToLogin("error=invalid_token");
  }

  const row = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!row || row.expires < new Date()) {
    return redirectToLogin("error=invalid_token");
  }

  const user = await prisma.user.findUnique({
    where: { email: row.identifier },
  });

  if (!user) {
    await prisma.verificationToken.deleteMany({ where: { token } });
    return redirectToLogin("error=invalid_token");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: row.identifier },
    }),
  ]);

  return redirectToLogin("verified=1");
}
