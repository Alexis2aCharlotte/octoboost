import { Resend } from "resend";
import { getWelcomeEmailHTML } from "./welcome-template";
import { getUpgradeEmailHTML } from "./upgrade-template";

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

const NEWSLETTER_FROM = "OctoBoost <newsletter@octoboost.app>";
const NEWSLETTER_REPLY_TO = "contact@octoboost.app";

export async function sendWelcomeEmail(toEmail: string): Promise<void> {
  const html = getWelcomeEmailHTML();

  const { error } = await getResendClient().emails.send({
    from: NEWSLETTER_FROM,
    replyTo: NEWSLETTER_REPLY_TO,
    to: toEmail,
    subject: "Welcome to OctoBoost 🚀",
    html,
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

export async function sendUpgradeEmail(
  toEmail: string,
  plan: string,
  interval: string,
  amount: string
): Promise<void> {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const html = getUpgradeEmailHTML(plan, interval, amount);

  const { error } = await getResendClient().emails.send({
    from: NEWSLETTER_FROM,
    replyTo: NEWSLETTER_REPLY_TO,
    to: toEmail,
    subject: `Welcome to OctoBoost ${planLabel} 🎉`,
    html,
  });

  if (error) {
    console.error("Error sending upgrade email:", error);
    throw error;
  }
}
