import { NextResponse } from "next/server";
import { BillingSource, ProductType } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe är inte konfigurerat" }, { status: 501 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Saknar signatur" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (e) {
    console.error("Stripe webhook signature verification failed", e);
    return NextResponse.json({ error: "Ogiltig signatur" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const tenantId = session.metadata?.tenantId;
      const productType = session.metadata?.productType as "ONE_TIME" | "ANNUAL" | undefined;

      if (customerId && tenantId) {
        const pt =
          productType === "ONE_TIME"
            ? ProductType.ONE_TIME
            : productType === "ANNUAL"
              ? ProductType.ANNUAL
              : undefined;

        await prisma.tenant.updateMany({
          where: { id: tenantId },
          data: {
            billingSource: BillingSource.STRIPE,
            stripeCustomerId: customerId,
            ...(pt ? { productType: pt } : {}),
            invoicePaidAt: new Date(),
          },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) break;

      const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } });
      if (!tenant) break;

      const active = sub.status === "active" || sub.status === "trialing";
      const cpe = (sub as unknown as { current_period_end?: number }).current_period_end;
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          stripeSubscriptionId: sub.id,
          validUntil: active && typeof cpe === "number" ? new Date(cpe * 1000) : new Date(),
        },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
