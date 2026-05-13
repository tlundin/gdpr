import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function redirectToLogin(request: NextRequest, query: string) {
  const url = new URL("/login", request.url);
  url.search = query;
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirectToLogin(request, "error=invalid_token");
  }

  const row = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!row || row.expires < new Date()) {
    return redirectToLogin(request, "error=invalid_token");
  }

  const user = await prisma.user.findUnique({
    where: { email: row.identifier },
  });

  if (!user) {
    await prisma.verificationToken.deleteMany({ where: { token } });
    return redirectToLogin(request, "error=invalid_token");
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

  return redirectToLogin(request, "verified=1");
}
