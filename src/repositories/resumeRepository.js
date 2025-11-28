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

async function getResumeProfileById(id) {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI must be set to query resume profiles');
  await db.connect(mongoUri);
  return ResumeProfile.findById(id).lean();
}

async function findOneByUserRef(userRef) {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI must be set to query resume profiles');
  await db.connect(mongoUri);
  return ResumeProfile.findOne({ userRef }).lean();
}

module.exports = { saveResumeProfile, getResumeProfileById, findOneByUserRef };
