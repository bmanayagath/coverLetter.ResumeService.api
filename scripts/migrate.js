#!/usr/bin/env node
/*
  Simple migration script to initialize indexes for ResumeProfile.
  Usage: MONGO_URI="mongodb://..." node scripts/migrate.js
*/
const db = require('../src/db/connection');
const ResumeProfile = require('../src/models/resumeProfile');

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is required as an environment variable');
    process.exit(1);
  }
  await db.connect(mongoUri);
  try {
    console.log('Ensuring indexes for ResumeProfile...');
    await ResumeProfile.init(); // creates indexes defined in schema
    console.log('Migration complete: indexes ensured.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  }
}

run();
