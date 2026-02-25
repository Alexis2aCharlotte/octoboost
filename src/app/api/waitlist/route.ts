import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/services/email";
import { notifyTelegram } from "@/lib/services/telegram";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const isFormSubmit = !contentType.includes("application/json");

    let email: string | undefined;

    if (isFormSubmit) {
      const formData = await req.formData();
      email = formData.get("email")?.toString();
    } else {
      try {
        const body = await req.json();
        email = body.email;
      } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
      }
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      if (isFormSubmit) {
        return NextResponse.redirect(new URL("/waitlist?error=invalid", req.url));
      }
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars");
      if (isFormSubmit) {
        return NextResponse.redirect(new URL("/waitlist?error=server", req.url));
      }
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: normalizedEmail });

    if (error) {
      if (error.code === "23505") {
        if (isFormSubmit) {
          return NextResponse.redirect(new URL("/waitlist?success=true", req.url));
        }
        return NextResponse.json({ success: true, message: "Already registered" });
      }
      console.error("Supabase waitlist insert error:", error);
      if (isFormSubmit) {
        return NextResponse.redirect(new URL("/waitlist?error=failed", req.url));
      }
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

    if (isFormSubmit) {
      return NextResponse.redirect(new URL("/waitlist?success=true", req.url));
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist API unexpected error:", err);
    if ((req.headers.get("content-type") || "").includes("application/json")) {
      return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/waitlist?error=server", req.url));
  }
}
