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
</head>
<body style="background-color: #f4f7f6; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a2e; -webkit-font-smoothing: antialiased;">
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <table width="600" border="0" cellspacing="0" cellpadding="0"><tr><td align="center">
        <![endif]-->
        
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); margin: 0 auto;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px 30px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">${projectName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 24px; color: #0f172a;">${title}</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 20px;">
                Hello <strong>${greeting}</strong>,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 30px;">
                You have been invited to collaborate and help build amazing software quality together. We are excited to have you on the team!
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 30px;">
                You have been assigned the role of: <br><br>
                <span style="display: inline-block; background-color: #eff6ff; color: #2563eb; padding: 6px 12px; border-radius: 999px; font-size: 14px; font-weight: 600; border: 1px solid #bfdbfe;">${roleText}</span>
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${inviteLink}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="17%" stroke="f" fillcolor="#2563eb">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Accept Invitation</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${inviteLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">Accept Invitation</a>
                <!--<![endif]-->
              </div>
              
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 10px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <div style="word-break: break-all; color: #64748b; font-size: 13px; background-color: #f1f5f9; padding: 12px; border-radius: 6px;">
                ${inviteLink}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 24px 30px; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
              <p style="margin: 5px 0 0 0;">This invitation link will expire in 7 days.</p>
            </td>
          </tr>
          
        </table>
        
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
  
</body>
</html>
  `;
}

export function generateResetEmailHtml({
  greeting,
  resetLink,
  projectName = "TESSA TMS",
  expiresHours = 2,
}: {
  greeting: string;
  resetLink: string;
  projectName?: string;
  expiresHours?: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset your ${projectName} password</title></head>
<body style="background-color:#f0f2f8;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1d2e;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f2f8;padding:40px 20px;"><tr><td align="center">
    <table width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e7f0;">
      <tr><td style="padding:32px 40px 0;">
        <div style="font-size:20px;font-weight:800;background:linear-gradient(135deg,#4f46e5,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent;">⚡ ${projectName}</div>
      </td></tr>
      <tr><td style="padding:24px 40px;">
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;color:#1a1d2e;">Reset your password</h1>
        <p style="font-size:15px;line-height:1.6;color:#52597a;margin:0 0 8px;">${greeting}</p>
        <p style="font-size:15px;line-height:1.6;color:#52597a;margin:0 0 24px;">We received a request to reset your password. Click the button below to choose a new one. This link expires in ${expiresHours} hours.</p>
        <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">Reset password</a>
        <p style="font-size:13px;line-height:1.6;color:#7880a0;margin:24px 0 0;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="font-size:12px;color:#9aa0bd;margin:16px 0 0;word-break:break-all;">Or paste this link into your browser:<br>${resetLink}</p>
      </td></tr>
      <tr><td style="padding:0 40px 32px;"><hr style="border:none;border-top:1px solid #eef0f6;margin:0 0 16px;"><p style="font-size:12px;color:#9aa0bd;margin:0;">© 2026 ${projectName}</p></td></tr>
    </table>
  </td></tr></table>
</body>
</html>
  `;
}
