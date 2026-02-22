import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/services/email";
import { notifyTelegram } from "@/lib/services/telegram";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: normalizedEmail });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Already registered" });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process welcome email + Telegram notification in background (don't block response)
    processNewWaitlistEntry(normalizedEmail).catch((err) => {
      console.error(`Error processing waitlist entry ${normalizedEmail}:`, err);
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function processNewWaitlistEntry(email: string): Promise<void> {
  try {
    console.log(`📧 New waitlist entry: ${email}`);

    await sendWelcomeEmail(email);
    console.log(`✅ Welcome email sent to ${email}`);

    await notifyTelegram(`New waitlist signup! 📧`);
    console.log(`✅ Telegram notification sent`);
  } catch (error) {
    console.error(`Error in processNewWaitlistEntry:`, error);
    await notifyTelegram(`⚠️ OctoBoost — New waitlist signup, but email sending failed`);
    throw error;
  }
}
