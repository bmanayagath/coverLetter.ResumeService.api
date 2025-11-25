const util = require('util');
const pdfModule = require('pdf-parse');
const mammoth = require('mammoth');

function toUint8Array(buffer) {
  if (buffer instanceof Uint8Array && buffer.constructor && buffer.constructor.name === 'Uint8Array') return buffer;
  return new Uint8Array(buffer.buffer, buffer.byteOffset || 0, buffer.byteLength || buffer.length);
}

async function parsePdfToText(buffer) {
  const input = toUint8Array(buffer);
  // function export
  if (typeof pdfModule === 'function') {
    const data = await pdfModule(input);
    return data && data.text ? data.text : '';
  }
  // default function export
  if (pdfModule && typeof pdfModule.default === 'function') {
    const data = await pdfModule.default(input);
    return data && data.text ? data.text : '';
  }
  // PDFParse class
  if (pdfModule && typeof pdfModule.PDFParse === 'function') {
    const parser = new pdfModule.PDFParse(input);
    const result = parser.getText();
    return (await Promise.resolve(result)) || '';
  }
  // unknown
  console.error('pdf-parse: unexpected module shape:', util.inspect(pdfModule, { depth: 2 }));
  throw new Error('pdf-parse module does not expose a callable API');
}

async function extractText(buffer, ext) {
  switch (ext) {
    case '.txt':
      return buffer.toString('utf8');
    case '.pdf':
      try {
        return await parsePdfToText(buffer);
      } catch (err) {
        console.warn('pdf extraction failed:', err && err.message);
        return '';
      }
    case '.docx':
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result && result.value ? result.value : '';
      } catch (err) {
        console.warn('docx extraction failed:', err && err.message);
        return '';
      }
    default:
      return '';
  }
}

module.exports = { toUint8Array, parsePdfToText, extractText };

// normalizePdfResult exposed for callers that need resilient normalization
async function normalizePdfResult(buffer) {
  // try to call pdf-parse in various shapes and keep the raw result
  const input = toUint8Array(buffer);
  let raw;
  try {
    if (typeof pdfModule === 'function') {
      raw = await pdfModule(input);
    } else if (pdfModule && typeof pdfModule.default === 'function') {
      raw = await pdfModule.default(input);
    } else if (pdfModule && typeof pdfModule.PDFParse === 'function') {
      const parser = new pdfModule.PDFParse(input);
      raw = await Promise.resolve(parser.getText());
    }
  } catch (err) {
    console.warn('pdf-parse call failed:', err && err.message);
    return '';
  }

  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw.text === 'string' && raw.text.trim()) return raw.text;
  if (Array.isArray(raw.pages) && raw.pages.length) {
    return raw.pages.map(p => (typeof p === 'string' ? p : String(p))).join('\n\n');
  }
  if (typeof raw.getText === 'function') {
    const got = await Promise.resolve(raw.getText());
    if (typeof got === 'string') return got;
    if (typeof got.text === 'string') return got.text;
  }
  try {
    return JSON.stringify(raw);
  } catch (e) {
    return '';
  }
}

module.exports.normalizePdfResult = normalizePdfResult;
