#!/usr/bin/env node
/**
 * Creates the `contacts` collection in the local MongoDB with JSON Schema validation.
 * Usage:
 *   node scripts/create_contacts_collection.js
 * Or set MONGO_URI and MONGO_DB env vars before running.
 */
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.1';
const DB_NAME = process.env.MONGO_DB || 'my_portfolio';

async function main() {
  console.log('Connecting to', MONGO_URI, 'db:', DB_NAME);
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    const collName = 'contacts';

    const schema = {
      bsonType: 'object',
      required: ['name', 'email', 'message', 'createdAt'],
      additionalProperties: false,
      properties: {
        name: { bsonType: 'string', description: 'Name is required', minLength: 1, maxLength: 100 },
        email: { bsonType: 'string', description: 'Valid email required', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$' },
        phone: { bsonType: ['string', 'null'], description: 'Optional phone', pattern: '^[0-9+()\\s-]{7,20}$' },
        message: { bsonType: 'string', minLength: 5, maxLength: 5000 },
        createdAt: { bsonType: 'date' }
      }
    };

    // Check if collection exists
    const existing = await db.listCollections({ name: collName }).toArray();
    if (existing.length === 0) {
      await db.createCollection(collName, {
        validator: { $jsonSchema: schema },
        validationLevel: 'strict',
        validationAction: 'error'
      });
      console.log(`Created collection '${collName}' with validation schema.`);
    } else {
      // Update validator if exists
      await db.command({ collMod: collName, validator: { $jsonSchema: schema }, validationLevel: 'strict', validationAction: 'error' });
      console.log(`Updated validator for existing collection '${collName}'.`);
    }

    // Create an index on email and createdAt for quick queries
    await db.collection(collName).createIndex({ email: 1 });
    await db.collection(collName).createIndex({ createdAt: -1 });

    console.log('Indexes created: email, createdAt.');
  } catch (err) {
    console.error('Failed to create collection or connect to MongoDB:', err.message || err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
}

main();
