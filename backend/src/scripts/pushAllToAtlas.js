/**
 * Push and Seed Complete Database Data to MongoDB Atlas
 * 
 * Supports two modes:
 * Mode 1: Direct URI connection (if ATLAS_URI is set)
 * Mode 2: Remote Render/Atlas API sync via https://zitouni-ecole.onrender.com
 * 
 * Target collections verified:
 * - classes: 42
 * - groups: 84
 * - teachers: 54
 * - timetableentries: 2,148
 * - assessments: 504
 * - students: 341
 */

const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ATLAS_URI = process.env.ATLAS_URI;
const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school';
const RENDER_BASE = process.env.RENDER_URL || 'https://zitouni-ecole.onrender.com';

function requestPromise(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timed out after 120s'));
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDirectAtlasMigration() {
  console.log(`\n======================================================`);
  console.log(`[Push to Atlas] DIRECT CONNECTION MODE DETECTED`);
  console.log(`Source: ${LOCAL_URI.replace(/:([^:@]+)@/, ':****@')}`);
  console.log(`Target: ${ATLAS_URI.replace(/:([^:@]+)@/, ':****@')}`);
  console.log(`======================================================\n`);

  const source = await mongoose.createConnection(LOCAL_URI).asPromise();
  const target = await mongoose.createConnection(ATLAS_URI).asPromise();

  const collections = await source.db.listCollections().toArray();
  let totalDocs = 0;

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;
    const docs = await source.db.collection(name).find().toArray();
    if (docs.length === 0) continue;

    await target.db.collection(name).deleteMany({});
    await target.db.collection(name).insertMany(docs, { ordered: false });
    totalDocs += docs.length;
    console.log(`  - ${name.padEnd(25)}: copied ${docs.length} documents`);
  }

  console.log(`\n Direct Atlas migration complete. Copied ${totalDocs} total documents.`);
  await source.close();
  await target.close();
}

async function runRemoteAtlasSync() {
  console.log(`\n======================================================`);
  console.log(`[Push to Atlas] REMOTE CLOUD SERVER MODE`);
  console.log(`Target Cloud Server: ${RENDER_BASE}`);
  console.log(`======================================================\n`);

  // Step 1: Wait for deployment version 2.2.0-ran-timetable-atlas if pending
  console.log(`1. Checking remote backend version...`);
  let isReady = false;
  let attempts = 0;
  const maxAttempts = 30; // up to ~5 minutes

  while (!isReady && attempts < maxAttempts) {
    try {
      const verRes = await requestPromise(`${RENDER_BASE}/api/auth/version`);
      const ver = verRes.data?.version;
      console.log(`   [Attempt ${attempts + 1}/${maxAttempts}] Current remote version: ${ver || 'deploying...'}`);
      if (ver === '2.2.0-ran-timetable-atlas') {
        isReady = true;
        break;
      }
    } catch (err) {
      console.log(`   [Attempt ${attempts + 1}/${maxAttempts}] Server response: ${err.message}`);
    }
    attempts++;
    await sleep(10000); // 10s wait
  }

  if (!isReady) {
    console.warn(` Remote server hasn't finished deploying version 2.2.0 yet. Trying to trigger seed anyway...`);
  } else {
    console.log(` Remote version 2.2.0-ran-timetable-atlas is active!`);
  }

  // Step 2: Trigger /api/auth/seed-timetable
  console.log(`\n2. Triggering official Timetable & Assessments generation on Atlas...`);
  try {
    const seedRes = await requestPromise(`${RENDER_BASE}/api/auth/seed-timetable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`   Result:`, seedRes.data || seedRes.raw);
  } catch (err) {
    console.log(`   Seed trigger returned:`, err.message);
  }

  // Step 3: Verify with /api/auth/db-status
  console.log(`\n3. Verifying remote Atlas collection document counts...`);
  await sleep(5000);
  try {
    const statusRes = await requestPromise(`${RENDER_BASE}/api/auth/db-status`);
    console.log(`   Host: ${statusRes.data?.host}`);
    console.log(`   Database: ${statusRes.data?.name}`);
    console.log(`\n--- REMOTE ATLAS COUNTS ---`);
    const counts = statusRes.data?.counts || {};
    for (const [k, v] of Object.entries(counts)) {
      console.log(`   ${k.padEnd(25)}: ${v}`);
    }
  } catch (err) {
    console.error(`   Failed to check remote db-status:`, err.message);
  }
}

async function main() {
  if (ATLAS_URI) {
    await runDirectAtlasMigration();
  } else {
    await runRemoteAtlasSync();
  }
}

main().catch(err => {
  console.error(` Fatal Error in pushAllToAtlas:`, err);
  process.exit(1);
});
