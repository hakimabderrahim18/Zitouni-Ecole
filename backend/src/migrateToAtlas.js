/**
 * One-time migration: copy all collections from the local MongoDB database
 * to MongoDB Atlas, preserving _id values and hashed passwords.
 *
 * Usage (PowerShell), typing your real Atlas URI directly into the terminal:
 *   cd backend
 *   $env:ATLAS_URI="mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/zitouni_school"
 *   node src/migrateToAtlas.js
 *
 * Optional: override the source with $env:LOCAL_URI (defaults to local zitouni_school).
 */
const mongoose = require('mongoose');
require('dotenv').config();

const LOCAL_URI = process.env.LOCAL_URI || 'mongodb://localhost:27017/zitouni_school';
const ATLAS_URI = process.env.ATLAS_URI;

(async () => {
  if (!ATLAS_URI) {
    console.error('ERROR: Set the ATLAS_URI environment variable to your Atlas connection string.');
    process.exit(1);
  }

  const source = await mongoose.createConnection(LOCAL_URI).asPromise();
  const target = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log(`Source: ${source.name}  ->  Target: ${target.name}`);

  const collections = await source.db.listCollections().toArray();
  let total = 0;

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;
    const docs = await source.db.collection(name).find().toArray();
    if (docs.length === 0) {
      console.log(`- ${name}: empty, skipped`);
      continue;
    }
    // Replace the target collection contents to keep the migration idempotent.
    await target.db.collection(name).deleteMany({});
    await target.db.collection(name).insertMany(docs, { ordered: false });
    total += docs.length;
    console.log(`- ${name}: copied ${docs.length}`);
  }

  console.log(`\nMigration complete. ${total} documents copied.`);
  await source.close();
  await target.close();
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
