import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { sendUpgradeEmail } from "@/lib/services/email";
import { notifyTelegram } from "@/lib/services/telegram";

export async function POST(request: NextRequest) {
  try {
    const { email, password, sessionId } = (await request.json()) as {
      email: string;
      password: string;
      sessionId: string;
    };

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Email and password (min 6 chars) are required." },
        { status: 400 }
      );
    }
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing checkout session." },
        { status: 400 }
      );
    }

    /* ── Retrieve Stripe checkout session ── */
    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid checkout session." },
        { status: 400 }
      );
    }

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment is still processing. Please wait and try again." },
        { status: 400 }
      );
    }

    const stripeCustomerId = checkoutSession.customer as string;
    const subscription =
      typeof checkoutSession.subscription === "object"
        ? checkoutSession.subscription
        : null;

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found for this session." },
        { status: 400 }
      );
    }

    const plan = subscription.metadata.plan ?? "explore";
    const interval = subscription.metadata.interval ?? "monthly";
    const item = subscription.items.data[0];
    const periodStart = item?.current_period_start;
    const periodEnd = item?.current_period_end;

    /* ── Create or retrieve Supabase user ── */
    const admin = createServiceClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await admin.auth.admin.updateUserById(userId, { password });
    } else {
      const { data: newUser, error: createErr } =
        await admin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
        });
      if (createErr || !newUser.user) {
        return NextResponse.json(
          { error: createErr?.message ?? "Failed to create account." },
          { status: 400 }
        );
      }
      userId = newUser.user.id;
    }

    /* ── Upsert profile with Stripe data ── */
    await admin.from("profiles").upsert(
      {
        user_id: userId,
        email: normalizedEmail,
        plan,
        interval,
        status: subscription.status,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: subscription.id,
        has_password: true,
        ...(periodStart && {
          current_period_start: new Date(periodStart * 1000).toISOString(),
        }),
        ...(periodEnd && {
          current_period_end: new Date(periodEnd * 1000).toISOString(),
        }),
      },
      { onConflict: "user_id" }
    );

    /* ── Update Stripe metadata with Supabase user ID ── */
    await stripe.customers.update(stripeCustomerId, {
      metadata: { supabase_user_id: userId },
    });
    await stripe.subscriptions.update(subscription.id, {
      metadata: { ...subscription.metadata, supabase_user_id: userId },
    });

    /* ── Sign in the user via Supabase Admin ── */
    const { data: signInData, error: signInError } =
      await admin.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (signInError || !signInData.session) {
      return NextResponse.json(
        { error: "Account created but sign-in failed. Please log in manually." },
        { status: 200 }
      );
    }

    /* ── Send welcome email + Telegram (fire-and-forget) ── */
    const amount = checkoutSession.amount_total
      ? `$${(checkoutSession.amount_total / 100).toFixed(0)}`
      : "—";
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

    sendUpgradeEmail(normalizedEmail, plan, interval, amount).catch((err) =>
      console.error("Failed to send upgrade email:", err)
    );
    notifyTelegram(
      `💳 ${planLabel} ${interval} — ${amount}\nConfirmation email sent ✅`
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
    });
  } catch (err) {
    console.error("Create-account error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
