import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
async function test() {
  const { data, error } = await resend.emails.send({
    from: 'TESSA TMS <onboarding@resend.dev>',
    to: 'towsakun@gmail.com',
    subject: 'Test',
    html: '<p>Test</p>'
  });
  console.log({ data, error });
}
test();
