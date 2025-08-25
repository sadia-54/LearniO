const nodemailer = require('nodemailer');

function getTransport() {
  // Prefer full SMTP URL if provided, otherwise host/user/pass
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: !!(process.env.SMTP_SECURE === 'true'),
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransport();
  const from = process.env.EMAIL_FROM || 'no-reply@learniO.local';
  const info = await transporter.sendMail({ from, to, subject, html, text });
  return info;
}

module.exports = { sendEmail };
