import nodemailer from 'nodemailer'
import { env } from '@/env'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
})

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await transporter.sendMail({
    from: env.EMAIL_USER,
    to,
    subject,
    html,
  })
} 