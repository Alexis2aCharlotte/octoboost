export function getWelcomeEmailHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>Welcome to OctoBoost</title>
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
                <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2">You're on the list.</h1>
                <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.7; color: #888">We'll let you know when OctoBoost is ready. You'll be among the first to try it.</p>
                <div style="width: 40px; height: 1px; background: #1e1e2e; margin: 0 auto 32px"></div>
                <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6">Turn your SaaS into a content machine.<br>SEO articles, backlinks, and traffic — on autopilot.</p>
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
