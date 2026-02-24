import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/services/email";
import { notifyTelegram } from "@/lib/services/telegram";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: normalizedEmail });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Already registered" });
      }
      console.error("Supabase waitlist insert error:", error);
      return NextResponse.json({ error: "Failed to register. Please try again." }, { status: 500 });
    }

    after(async () => {
      try {
        console.log(`New waitlist entry: ${normalizedEmail}`);

        await sendWelcomeEmail(normalizedEmail);
        console.log(`Welcome email sent to ${normalizedEmail}`);

        await notifyTelegram(`New waitlist signup!`);
        console.log(`Telegram notification sent`);
      } catch (err) {
        console.error(`Error processing waitlist entry:`, err);
        try {
          await notifyTelegram(`OctoBoost — New waitlist signup, but email sending failed`);
        } catch {
          console.error("Failed to send Telegram fallback notification");
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist API unexpected error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
