import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
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

    after(async () => {
      try {
        console.log(`📧 New waitlist entry: ${normalizedEmail}`);

        await sendWelcomeEmail(normalizedEmail);
        console.log(`✅ Welcome email sent to ${normalizedEmail}`);

        await notifyTelegram(`New waitlist signup! 📧`);
        console.log(`✅ Telegram notification sent`);
      } catch (err) {
        console.error(`Error processing waitlist entry:`, err);
        await notifyTelegram(`⚠️ OctoBoost — New waitlist signup, but email sending failed`);
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
