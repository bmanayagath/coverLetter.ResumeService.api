const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const util = require('util');

const PROMPT_PATH = path.join(__dirname, '..', 'templates', 'coverletter_generation_prompt.txt');

async function callOpenAIChat(messages, apiKey, model = 'gpt-3.5-turbo-16k') {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, temperature: 0.2 })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
}

async function generateCoverLetterText(profile, form) {
  const apiKey = process.env.OPEN_AI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');

  const promptTemplate = fs.existsSync(PROMPT_PATH)
    ? fs.readFileSync(PROMPT_PATH, 'utf8')
    : 'You are a professional cover-letter writer. Use the provided profile and job details to write a concise cover letter.';

  // If the template contains placeholders, replace them with provided JSON.
  let systemPrompt = promptTemplate;
  try {
    systemPrompt = systemPrompt
      .replace(/\{\{CANDIDATE_PROFILE_JSON\}\}/g, JSON.stringify(profile || {}, null, 2))
      .replace(/\{\{JOB_DETAILS_JSON\}\}/g, JSON.stringify(form || {}, null, 2));
  } catch (e) {
    // fallback to appending the inputs if replacement fails
    systemPrompt = `${promptTemplate}\n\nCandidate profile:\n${JSON.stringify(profile || {}, null, 2)}\n\nJob details:\n${JSON.stringify(form || {}, null, 2)}`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Generate the cover letter as plain text only.' }
  ];

  const content = await callOpenAIChat(messages, apiKey);
  return content || '';
}

function pdfFromText(text) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: false });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        try {
          const buf = Buffer.concat(buffers);
          resolve(buf);
        } catch (e) {
          reject(e);
        }
      });
      doc.on('error', (err) => reject(err));

      doc.addPage({ size: 'A4', margin: 72 });
      const fontSize = 12;
      doc.fontSize(fontSize);
      const lines = (text || '').split(/\r?\n/);
      for (const line of lines) {
        doc.text(line);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCoverLetterText, pdfFromText };
