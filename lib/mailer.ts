import nodemailer from 'nodemailer';

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user,
    pass,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!user || !pass) {
    console.warn("EMAIL_USER or EMAIL_PASS is not set in environment variables. Email was not sent.");
    return { success: false, error: "Email configuration missing" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"TESSA TMS" <${user}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Failed to send email via Nodemailer:", error);
    return { success: false, error: error.message };
  }
}
