import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const customerId = session.customer as string | null;
    const customerEmail =
      session.customer_details?.email ?? session.customer_email;
    const subscription =
      typeof session.subscription === "object" ? session.subscription : null;

    const plan = subscription?.metadata?.plan ?? "explore";
    const interval = subscription?.metadata?.interval ?? "monthly";
    const amount = session.amount_total
      ? `$${(session.amount_total / 100).toFixed(0)}`
      : null;

    return NextResponse.json({
      email: customerEmail,
      customerId,
      subscriptionId: subscription?.id ?? null,
      plan,
      interval,
      amount,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
