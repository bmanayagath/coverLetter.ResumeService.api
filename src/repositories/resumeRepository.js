const db = require('../db/connection');
const ResumeProfile = require('../models/resumeProfile');

/**
 * Save a resume profile object into MongoDB.
 * @param {object} profileData - object matching the ResumeProfile schema
 * @returns {Promise<object>} saved document
 */
async function saveResumeProfile(profileData) {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI must be set to save resume profiles');
  await db.connect(mongoUri);
  const doc = new ResumeProfile(profileData);
  return doc.save();
}

module.exports = { saveResumeProfile };
