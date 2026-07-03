import { emailService } from "@/services/email.service";

export { emailService };

export async function sendEmail({ siteId, to, subject, html, text }) {
  const { transporter, fromEmail } =
    await emailService.getTransporterForSite(siteId);
  return transporter.sendMail({ from: fromEmail, to, subject, html, text });
}
