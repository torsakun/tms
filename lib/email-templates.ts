export function generateInviteEmailHtml({
  title = "You've been invited! 🚀",
  greeting,
  roleText,
  inviteLink,
  projectName = "TESSA TMS"
}: {
  title?: string;
  greeting: string;
  roleText: string;
  inviteLink: string;
  projectName?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invitation to ${projectName}</title>
<style>
  body {
    background-color: #f4f7f6;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a2e;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }
  .header {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    color: #ffffff;
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .content {
    padding: 40px 30px;
  }
  .greeting {
    font-size: 22px;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 24px;
    color: #0f172a;
  }
  .message {
    font-size: 16px;
    line-height: 1.6;
    color: #475569;
    margin-bottom: 30px;
  }
  .role-badge {
    display: inline-block;
    background-color: #eff6ff;
    color: #2563eb;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid #bfdbfe;
  }
  .button-container {
    text-align: center;
    margin: 40px 0;
  }
  .button {
    background-color: #2563eb;
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    display: inline-block;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  }
  .footer {
    background-color: #f8fafc;
    padding: 24px 30px;
    text-align: center;
    font-size: 13px;
    color: #94a3b8;
    border-top: 1px solid #f1f5f9;
  }
  .link-fallback {
    word-break: break-all;
    color: #64748b;
    font-size: 13px;
    margin-top: 10px;
    background: #f1f5f9;
    padding: 12px;
    border-radius: 6px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${projectName}</h1>
    </div>
    <div class="content">
      <h2 class="greeting">${title}</h2>
      <p class="message">
        Hello <strong>${greeting}</strong>,<br><br>
        You have been invited to collaborate and help build amazing software quality together. We are excited to have you on the team!
      </p>
      <p class="message">
        You have been assigned the role of: <br><br>
        <span class="role-badge">${roleText}</span>
      </p>
      
      <div class="button-container">
        <a href="${inviteLink}" class="button">Accept Invitation</a>
      </div>
      
      <p class="message" style="font-size: 14px; margin-bottom: 0;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <div class="link-fallback">
        ${inviteLink}
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
      <p style="margin: 5px 0 0 0;">This invitation link will expire in 7 days.</p>
    </div>
  </div>
</body>
</html>
  `;
}
