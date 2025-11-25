const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extractText } = require('../utils/extractText');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

router.post('/upload', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file missing' });
    const originalName = req.file.originalname || 'upload.bin';
    const ext = path.extname(originalName).toLowerCase() || '';
    const filename = `${Date.now()}_${safeFilename(originalName)}`;
    const outPath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(outPath, req.file.buffer);
    const text = await extractText(req.file.buffer, ext);
    return res.json({ ok: true, filename, path: outPath, text });
  } catch (err) {
    next(err);
  }
});

// raw octet-stream route
router.post('/file', auth, express.raw({ type: '*/*', limit: '10mb' }), async (req, res, next) => {
  try {
    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    const filename = `upload_${Date.now()}.bin`;
    const outPath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(outPath, buf);
    // try pdf fallback
    const text = await extractText(buf, '.pdf');
    return res.json({ ok: true, filename, path: outPath, text });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
