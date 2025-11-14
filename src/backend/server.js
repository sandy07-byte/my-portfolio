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
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong></p>
             <p style="white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ ok: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Error handling /contact:', err);
    return res.status(500).json({ ok: false, error: 'Failed to send message. Please try again later.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
