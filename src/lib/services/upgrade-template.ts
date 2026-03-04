export function getUpgradeEmailHTML(plan: string, interval: string, amount: string): string {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const intervalLabel = interval === "yearly" ? "year" : "month";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>Welcome to OctoBoost ${planLabel}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0f; padding: 48px 16px">
      <tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px">
            <!-- Main Card -->
            <tr>
              <td style="background: #111118; border-radius: 16px; border: 1px solid #1e1e2e; padding: 48px 40px; text-align: center">
                <p style="margin: 0 0 24px; font-size: 13px; font-weight: 600; color: #6c5ce7; letter-spacing: 2px; text-transform: uppercase">OctoBoost</p>

                <!-- Plan badge -->
                <div style="display: inline-block; background: linear-gradient(135deg, #6c5ce7 0%, #a855f7 100%); border-radius: 8px; padding: 6px 20px; margin-bottom: 24px">
                  <span style="font-size: 13px; font-weight: 700; color: #ffffff; letter-spacing: 1px; text-transform: uppercase">${planLabel} Plan</span>
                </div>

                <h1 style="margin: 0 0 12px; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2">You're all set!</h1>
                <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.7; color: #888">Your <strong style="color: #ffffff">${planLabel}</strong> plan is now active.</p>
                <p style="margin: 0 0 32px; font-size: 14px; color: #555">${amount}/${intervalLabel}</p>

                <div style="width: 40px; height: 1px; background: #1e1e2e; margin: 0 auto 32px"></div>

                <!-- CTA Button -->
                <a href="https://octoboost.app/dashboard" style="display: inline-block; background: #6c5ce7; color: #ffffff; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 10px; text-decoration: none; letter-spacing: 0.3px">Go to Dashboard →</a>

                <p style="margin: 28px 0 0; font-size: 13px; color: #555; line-height: 1.6">Unlimited articles, auto-publishing,<br>and full keyword data — unlocked.</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="text-align: center; padding: 24px 16px 0">
                <p style="margin: 0; font-size: 11px; color: #444">OctoBoost · <a href="https://octoboost.app" style="color: #6c5ce7; text-decoration: none">octoboost.app</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
