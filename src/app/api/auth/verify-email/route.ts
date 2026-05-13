import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { confirmVerificationToken } from "@/lib/verify-email-token";

function redirect(pathWithQuery: string) {
  const base = getAppBaseUrl().replace(/\/$/, "");
  return NextResponse.redirect(new URL(pathWithQuery, base));
}

export async function POST(request: Request) {
  let token = "";
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = (await request.json()) as { token?: string };
      token = String(body.token ?? "").trim();
    } else {
      const form = await request.formData();
      token = String(form.get("token") ?? "").trim();
    }
  } catch {
    return redirect("/login?error=invalid_token");
  }

  if (!token) {
    return redirect("/login?error=invalid_token");
  }

  const result = await confirmVerificationToken(token);
  if (!result.ok) {
    const q = result.reason === "expired" ? "error=expired_token" : "error=invalid_token";
    return redirect(`/login?${q}`);
  }

  return redirect("/login?verified=1");
}
