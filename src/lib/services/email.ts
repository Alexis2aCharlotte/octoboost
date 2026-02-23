import { Resend } from "resend";
import { getWelcomeEmailHTML } from "./welcome-template";

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = "OctoBoost <contact@octoboost.app>";

export async function sendWelcomeEmail(toEmail: string): Promise<void> {
  const html = getWelcomeEmailHTML();

  const { error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Welcome to OctoBoost 🚀",
    html,
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}
