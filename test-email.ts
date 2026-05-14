import 'dotenv/config';
import { sendEmail } from "./lib/mailer";

async function test() {
  console.log("Testing email to budsara.s@socket9.com...");
  const res = await sendEmail({
    to: "budsara.s@socket9.com",
    subject: "TESSA Test Email",
    html: "<h1>This is a test from TESSA</h1>",
  });
  console.log("Result:", res);
}

test();
