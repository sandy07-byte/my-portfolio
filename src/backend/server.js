import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

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

// MongoDB Atlas setup (no local fallback)
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB;
let mongoClient;
let contactsCollection;

// Helper to (re)connect to MongoDB on-demand
async function ensureMongoConnected() {
  if (contactsCollection) return;
  if (!MONGO_URI) {
    console.warn('❌ MONGO_URI is not set. Please check your .env file.');
    return;
  }
  try {
    console.log('Attempting to connect to MongoDB (on-demand)...');
    mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    await mongoClient.connect();
    const db = mongoClient.db(MONGO_DB);
    contactsCollection = db.collection('contacts');
    console.log('✅ Connected to MongoDB at', MONGO_URI, 'db:', MONGO_DB);
  } catch (err) {
    console.warn('⚠️  Could not connect to MongoDB (on-demand). Contacts will not be saved. Error:', err && err.message ? err.message : err);
  }
}

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

// Email sending removed — backend stores contacts in MongoDB only.

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

    // Store the contact in MongoDB (if available). Try on-demand connect if not already connected.
    await ensureMongoConnected();
    const contactDoc = {
      name,
      email,
      message,
      createdAt: new Date()
    };
    if (req.body.phone) contactDoc.phone = String(req.body.phone).trim();

    let insertResult = null;
      if (contactsCollection) {
        try {
          console.log('Inserting contact document into MongoDB:', contactDoc);
          insertResult = await contactsCollection.insertOne(contactDoc);
          console.log('Mongo insertResult:', insertResult);
        } catch (dbErr) {
          console.error('Failed to save contact to MongoDB:', dbErr && dbErr.message ? dbErr.message : dbErr);
          return res.status(500).json({ ok: false, error: 'Failed to save contact to database.' });
        }
      } else {
        // If we couldn't connect to MongoDB, tell the client so they can retry later.
        console.warn('⚠️  No MongoDB connection available; cannot save contact.');
        return res.status(500).json({ ok: false, error: 'Database unavailable. Please try again later.' });
      }

      console.log(`Contact form saved to DB (id=${insertResult.insertedId}) from ${name} (${email}).`);
      return res.status(200).json({ ok: true, message: 'Message submitted successfully.' });
  } catch (err) {
    console.error('Error handling /contact:', err && err.stack ? err.stack : err);

    // Provide more specific error messages for common issues
    let errorMessage = 'Failed to send message. Please try again later.';
    if (err && err.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check email configuration.';
    } else if (err && err.code === 'ECONNECTION') {
      errorMessage = 'Unable to connect to email server.';
    } else if (err && err.code === 'ETIMEDOUT') {
      errorMessage = 'Email server timeout. Please try again.';
    }

    // In non-production return the underlying error message for easier debugging
    const clientMessage = process.env.NODE_ENV === 'production' ? errorMessage : `${errorMessage} (${err && err.message ? err.message : 'no additional details'})`;
    return res.status(500).json({ ok: false, error: clientMessage });
  }
});

// Error handler for malformed JSON (body-parser) and other errors
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    // body-parser JSON parse error
    console.warn('Invalid JSON payload received');
    return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
  }

  // If it's a SyntaxError from JSON.parse
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('SyntaxError parsing JSON:', err.message);
    return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
  }

  if (err) {
    console.error('Unhandled error in request pipeline:', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }

  return next();
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Connect to MongoDB then start server
async function start() {
  try {
    mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    await mongoClient.connect();
    const db = mongoClient.db(MONGO_DB);
    contactsCollection = db.collection('contacts');
    console.log('✅ Connected to MongoDB at', MONGO_URI, 'db:', MONGO_DB);
  } catch (err) {
    console.warn('⚠️  Could not connect to MongoDB at', MONGO_URI, '. Contacts will not be saved. Error:', err && err.message ? err.message : err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('✅ Backend started. Contacts will be saved to MongoDB when submitted.');
  });
}

start();

