import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// 1) Load from project root .env if present
dotenv.config();
// 2) Also try loading from src/backend/.env if present (will not override existing)
const backendEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

const app = express();

const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
if (allowedOrigins.length > 0 && !allowedOrigins.includes('*')) {
  app.use(cors({ origin: allowedOrigins }));
} else {
  app.use(cors()); // Allow all if not specified
}

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Test endpoint for debugging
app.get('/test', (_req, res) => {
  res.json({ 
    ok: true, 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

// Simple validators
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);

function sanitizeInput(input) {
  return String(input).replace(/[\r\n]+/g, ' ').trim();
}

function getTransporter() {
  // Prefer explicit SMTP configuration if provided
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback to well-known service (e.g., Gmail). Requires app password for Gmail.
  const service = process.env.EMAIL_SERVICE || 'gmail';
  return nodemailer.createTransport({
    service,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

app.post('/contact', async (req, res) => {
  try {
    let { name, email, message } = req.body || {};

    // Basic presence and type checks
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(message)) {
      return res.status(400).json({ ok: false, error: 'All fields (name, email, message) are required.' });
    }

    // Normalize and sanitize
    name = sanitizeInput(name);
    email = sanitizeInput(email).toLowerCase();
    message = String(message).trim();

    // Length and format validation
    if (name.length > 100) return res.status(400).json({ ok: false, error: 'Name is too long.' });
    if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: 'Invalid email format.' });
    if (message.length < 5) return res.status(400).json({ ok: false, error: 'Message is too short.' });
    if (message.length > 5000) return res.status(400).json({ ok: false, error: 'Message is too long.' });

    // Ensure required env vars exist
    const toEmail = process.env.TO_EMAIL || process.env.EMAIL_USER;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !toEmail) {
      return res.status(500).json({ ok: false, error: 'Email service is not configured on the server.' });
    }

    const transporter = getTransporter();

    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
      from: fromEmail, // Use authenticated sender address
      to: toEmail,
      replyTo: email, // Allow replying directly to the user
      subject: `📧 New Contact Form Submission - ${name}`,
      text: `
📧 NEW CONTACT FORM SUBMISSION

Name: ${name}
Email: ${email}
Date: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from your portfolio contact form.
Reply directly to this email to respond to ${name}.
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #DF8908, #B415FF); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📧 New Contact Form Submission</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 25px;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Contact Details</h2>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #DF8908;">
                <p style="margin: 5px 0; color: #555;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 5px 0; color: #555;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #B415FF; text-decoration: none;">${email}</a></p>
                <p style="margin: 5px 0; color: #555;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Message</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #B415FF;">
                <p style="margin: 0; color: #555; line-height: 1.6; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              </div>
            </div>
            
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin: 0;">
                This message was sent from your portfolio contact form.<br>
                <strong>Reply directly to this email to respond to ${name}.</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`Contact form submitted successfully from ${name} (${email})`);
    return res.status(200).json({ ok: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Error handling /contact:', err);
    
    // Provide more specific error messages for common issues
    let errorMessage = 'Failed to send message. Please try again later.';
    if (err.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check email configuration.';
    } else if (err.code === 'ECONNECTION') {
      errorMessage = 'Unable to connect to email server.';
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = 'Email server timeout. Please try again.';
    }
    
    return res.status(500).json({ ok: false, error: errorMessage });
  }
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
  console.log(`📨 From email: ${process.env.FROM_EMAIL || process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`📬 To email: ${process.env.TO_EMAIL || process.env.EMAIL_USER || 'Not configured'}`);
  
  // Check if email configuration is complete
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Warning: Email configuration incomplete. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
  } else {
    console.log('✅ Email configuration looks good!');
  }
});
