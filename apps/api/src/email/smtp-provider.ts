import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  pool: true,
  // optional tls settings
  tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' },
})

export async function sendBulkEmail(recipients: string[], subject: string, html: string, text?: string) {
  // split into chunks to avoid very large recipients header
  const CHUNK = 200
  const results: any[] = []
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK)
    const info = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME || 'Rosrest'} <${process.env.EMAIL_FROM || 'newsletter@rosrest.com'}>`,
      to: chunk.join(','),
      subject,
      text,
      html,
    })
    results.push(info)
  }
  // naive summary
  return { sent: results.length, results }
}
