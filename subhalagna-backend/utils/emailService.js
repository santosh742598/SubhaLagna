"use strict";

/**
 * @file SubhaLagna v3.2.0 — Email Service
 * @description   Nodemailer-based email service with pre-built templates for:
 *                - Email verification (OTP)
 *                - Password reset link
 *                - New interest received notification
 *                - Payment Success / Membership activation [v2.4.0]
 *                Gracefully degrades (logs to console) if SMTP is not configured.
 *               - v3.1.5 changes:
 *                 - Integrated dynamic branding (appName, brandPrimary, brandSecondary) from environment variables.
 *                 - Fixed SyntaxError in buildEmailHTML template.
 *                 - Added ESLint overrides for intentional development console logging.
 *                 - Resolved project-wide JSDoc documentation warnings by adding proper @returns descriptions.
 * @author        SubhaLagna Team
 * @version      3.2.0
 */

const nodemailer = require('nodemailer');

// Branding
const appName = process.env.APP_NAME || 'SubhaLagna';
const brandPrimary = process.env.BRAND_PRIMARY || 'Subha';
const brandSecondary = process.env.BRAND_SECONDARY || 'Lagna';

// ── Create transporter (lazy init so missing config doesn't crash startup) ────
let transporter = null;

/**
 * Initialize the Nodemailer transporter.
 * Falls back to Ethereal test account in development if no SMTP config found.
 * @returns {import('nodemailer').Transporter} The initialized Nodemailer transporter object.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: parseInt(port),
      secure: port == 465, // true for 465, false for other ports
      auth: {
        user: user,
        pass: pass,
      },
    });
  } else {
    // Development: log emails to console instead of sending
    /* eslint-disable no-console */
    console.warn('⚠️  Email SMTP not configured. Emails will be logged to console only.');
    transporter = {
      sendMail: async (options) => {
        console.log('\n📧 [DEV EMAIL LOG]');
        console.log('   To:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Body:', options.text || options.html);
        return { messageId: 'dev-mode' };
      },
    };
    /* eslint-enable no-console */
  }

  return transporter;
};

// ── HTML email wrapper template ───────────────────────────────────────────────
const buildEmailHTML = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #fdf2f8; margin: 0; padding: 20px; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 560px; margin: 0 auto; box-shadow: 0 4px 24px rgba(244,63,94,0.08); }
    .header { padding-bottom: 20px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: #1e293b; text-decoration: none; }
    .logo span { color: #ec4899; }
    h2   { color: #1f2937; font-size: 22px; margin-bottom: 12px; }
    p    { color: #6b7280; line-height: 1.7; }
    .otp { font-size: 40px; font-weight: 800; color: #f43f5e; letter-spacing: 8px; margin: 24px 0; text-align: center; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f43f5e, #ec4899); color: white !important;
           text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; margin: 20px 0; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">${brandPrimary}<span>${brandSecondary}</span></div>
    </div>
    <h2>${title}</h2>
    ${body}
    <div class="footer">
      © ${new Date().getFullYear()} ${appName}. All rights reserved.
    </div>
  </div>
</body>
</html>`;

// ── Email Senders ─────────────────────────────────────────────────────────────

/**
 * Send email verification OTP to a newly registered user.
 * @param {string} email      - Recipient email
 * @param {string} name       - Recipient name
 * @param {string} otp        - 6-digit OTP code
 * @returns {Promise<void>} Resolves when the verification email is successfully sent.
 */
const sendVerificationEmail = async (email, name, otp) => {
  const html = buildEmailHTML(
    'Verify your email address 🎉',
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Welcome to ${appName}! Use the OTP below to verify your email address. It expires in <strong>15 minutes</strong>.</p>
     <div class="otp">${otp}</div>
     <p>If you didn't create an account, please ignore this email.</p>`,
  );

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `${appName} <noreply@subhalagna.com>`,
    to: email,
    subject: `${otp} — Verify your ${appName} email`,
    text: `Your ${appName} OTP is: ${otp}. It expires in 15 minutes.`,
    html,
  });
};

/**
 * Send a password reset link to the user.
 * @param {string} email      - Recipient email
 * @param {string} name       - Recipient name
 * @param {string} resetUrl   - Full reset URL with token
 * @returns {Promise<void>} Resolves when the password reset email is successfully sent.
 */
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const html = buildEmailHTML(
    'Reset your password 🔐',
    `<p>Hi <strong>${name}</strong>,</p>
     <p>We received a request to reset your ${appName} password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
     <a href="${resetUrl}" class="btn">Reset My Password</a>
     <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
     <p style="font-size:12px;color:#9ca3af;">Or copy this link: ${resetUrl}</p>`,
  );

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `${appName} <noreply@subhalagna.com>`,
    to: email,
    subject: `Reset your ${appName} password`,
    text: `Reset your password: ${resetUrl}`,
    html,
  });
};

/**
 * Send a notification email when someone sends an interest.
 * @param {string} email        - Recipient email
 * @param {string} name         - Recipient name
 * @param {string} senderName   - Name of the person who sent interest
 * @returns {Promise<void>} Resolves when the interest notification email is successfully sent.
 */
const sendInterestNotificationEmail = async (email, name, senderName) => {
  const html = buildEmailHTML(
    `${senderName} is interested in you! 💌`,
    `<p>Hi <strong>${name}</strong>,</p>
     <p><strong>${senderName}</strong> has sent you an interest on ${appName}. Log in to view their full profile and respond.</p>
     <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/matches" class="btn">View Profile</a>`,
  );

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `${appName} <noreply@subhalagna.com>`,
    to: email,
    subject: `${senderName} sent you an interest on ${appName} 💌`,
    text: `${senderName} is interested in connecting with you on ${appName}. Log in to respond.`,
    html,
  });
};

/**
 * Send a notification email when a user goes premium.
 * @param {string} email      - Recipient email
 * @param {string} name       - Recipient name
 * @param {string} planName   - Name of the plan (Gold/Platinum)
 * @param {number} amount     - Amount paid
 * @param {string} expiryDate - Formatted expiry date
 * @returns {Promise<void>} Resolves when the payment success email is successfully sent.
 */
const sendPaymentSuccessEmail = async (email, name, planName, amount, expiryDate) => {
  const html = buildEmailHTML(
    `Welcome to ${appName} Premium! 👑`,
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Congratulations! Your payment of <strong>₹${amount}</strong> was successful, and your <strong>${planName.toUpperCase()}</strong> membership is now active.</p>
     <div style="background:#fef2f2; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #fee2e2;">
        <p style="margin:0; font-size:12px; font-weight:bold; color:#f43f5e; text-transform:uppercase;">Subscription Details</p>
        <p style="margin:8px 0 0 0; font-size:18px; color:#1f2937;"><strong>Plan:</strong> ${planName}</p>
        <p style="margin:4px 0 0 0; font-size:14px; color:#6b7280;"><strong>Expires on:</strong> ${expiryDate}</p>
     </div>
     <p>You can now reveal contact details, send unlimited interests, and enjoy priority visibility in search results.</p>
     <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">Go to Dashboard</a>`,
  );

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `${appName} <noreply@subhalagna.com>`,
    to: email,
    subject: `👑 Your ${appName} ${planName} Membership is Active!`,
    text: `Hi ${name}, your ${planName} membership is now active until ${expiryDate}. Welcome to ${appName} Premium!`,
    html,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInterestNotificationEmail,
  sendPaymentSuccessEmail,
};
