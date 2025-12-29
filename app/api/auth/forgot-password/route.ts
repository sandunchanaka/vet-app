import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const RESET_TOKEN_EXPIRY = process.env.PASSWORD_RESET_TOKEN_TTL || '30m';

function buildResetUrl(request: NextRequest, token: string) {
  const hostOverride = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const baseUrl = hostOverride || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function getMailTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host) {
    throw new Error('SMTP_HOST is not configured');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, email, first_name FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
        [email]
      );

      // If user is not found, still return success to avoid email enumeration
      if (!Array.isArray(users) || users.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'If that email exists in our system, a reset link has been sent'
        });
      }

      const user = users[0] as any;

      const token = jwt.sign(
        { userId: user.id, email: user.email, type: 'password-reset' },
        JWT_SECRET,
        { expiresIn: RESET_TOKEN_EXPIRY }
      );

      const resetUrl = buildResetUrl(request, token);

      const transporter = getMailTransport();
      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@vetcare.local';

      await transporter.sendMail({
        from: fromAddress,
        to: user.email,
        subject: 'VetCare Password Reset Request',
        html: `
          <p>Hello ${user.first_name || ''},</p>
          <p>We received a request to reset your VetCare password.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;">Reset Password</a></p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in ${RESET_TOKEN_EXPIRY}. If you did not request a password reset, you can safely ignore this email.</p>
          <p>– VetCare Team</p>
        `
      });

      return NextResponse.json({
        success: true,
        message: 'If that email exists in our system, a reset link has been sent'
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Unable to process password reset request' },
      { status: 500 }
    );
  }
}
