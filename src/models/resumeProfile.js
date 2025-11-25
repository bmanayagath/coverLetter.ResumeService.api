const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema({
  roleType: { type: String, required: true },
  seniority: { type: String },
  techStack: [{ type: String }],
  domain: [{ type: String }],
  highLevelAchievements: [{ type: String }]
});

const ResumeProfileSchema = new mongoose.Schema(
  {
    userRef: { type: String, required: true, index: true },

    headline: { type: String },
    totalExperienceYears: { type: Number },
    region: { type: String },

    experience: [ExperienceSchema],
    skills: [{ type: String }],

    preferences: {
      tone: { type: String, default: 'professional' },
      length: { type: String, default: 'medium' },
      regionStyle: { type: String }
    },

    meta: {
      lastUsedAt: { type: Date },
      source: { type: String, default: 'upload' }
    }
  },
  { timestamps: true }
);

const ResumeProfile = mongoose.models.ResumeProfile || mongoose.model('ResumeProfile', ResumeProfileSchema);

module.exports = ResumeProfile;
