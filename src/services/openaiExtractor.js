const fs = require('fs');
const path = require('path');

const PROMPT_PATH = path.join(__dirname, '..', 'templates', 'resume_extraction_prompt.txt');

async function callOpenAIChat(messages, apiKey, model = 'gpt-3.5-turbo-16k') {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, temperature: 0 })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }
  const json = await res.json();
  const content = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  return content;
}

function extractJsonFromText(text) {
  // try direct JSON parse first
  try {
    return JSON.parse(text);
  } catch (_) {}

  // attempt to find first { ... } block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (err) {
      // fall through
    }
  }
  throw new Error('Failed to parse JSON from model output');
}

/**
 * Extract a ResumeProfile-like object from resume text using OpenAI.
 * @param {string} resumeText - extracted text from the uploaded resume
 * @param {string|null} userRef - user identifier to include in the output (optional)
 * @returns {Promise<object>} parsed JSON object matching the ResumeProfile shape (best-effort)
 */
async function extractResumeProfile(resumeText, userRef = null) {
  const apiKey = process.env.OPEN_AI_API_KEY;
  const promptTemplate = fs.readFileSync(PROMPT_PATH, 'utf8');
  const systemMessage = { role: 'system', content: promptTemplate };
  const userMessage = {
    role: 'user',
    content: `userRef: ${userRef || 'null'}\n\nResume text:\n${resumeText}`
  };
  const content = await callOpenAIChat([systemMessage, userMessage], apiKey);
  const parsed = extractJsonFromText(content || '');
  // best effort: ensure arrays exist
  parsed.experience = parsed.experience || [];
  parsed.skills = parsed.skills || [];
  parsed.preferences = parsed.preferences || { tone: 'professional', length: 'medium', regionStyle: null };
  parsed.meta = parsed.meta || { lastUsedAt: new Date().toISOString(), source: 'upload' };
  // set userRef from function arg if provided
  if (userRef) parsed.userRef = userRef;
  return parsed;
}

module.exports = { extractResumeProfile };
