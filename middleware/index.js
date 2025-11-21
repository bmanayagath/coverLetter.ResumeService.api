require('dotenv').config();
const express = require('express');
const auth = require('./middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

// parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// multer for multipart/form-data uploads (store in memory then save)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

app.get('/', (req, res) => res.send('ResumeService API running'));

// Public route: returns a token for demo purposes
app.post('/login', (req, res) => {
  const jwt = require('jsonwebtoken');
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required in JSON body' });
  // Accept secret from environment (JWT_SECRET) or alias JST_SECRET (Railway)
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
  res.json({ token });
});

// Protected route: requires valid JWT
app.get('/protected', auth, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

// Upload endpoint: accepts multipart/form-data (field `file`), application/octet-stream,
// or JSON: { filename, data } where data is base64 string
app.post('/coverletter/upload', auth, async (req, res) => {
  try {
    // multipart/form-data handled via multer
    if (req.is('multipart/form-data')) {
      // call multer single handler
      return upload.single('file')(req, res, err => {
        if (err) return res.status(400).json({ error: 'Upload error', details: err.message });
        if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: file)' });
        const filename = req.file.originalname || `upload-${Date.now()}`;
        const saveTo = path.join(uploadsDir, filename);
        fs.writeFileSync(saveTo, req.file.buffer);
        return res.json({ message: 'Uploaded (multipart)', filename, size: req.file.size, path: saveTo });
      });
    }

    // application/octet-stream
    if (req.is('application/octet-stream')) {
      const filename = req.query.filename || `upload-${Date.now()}.bin`;
      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) return res.status(400).json({ error: 'Empty binary body' });
      const saveTo = path.join(uploadsDir, filename);
      fs.writeFileSync(saveTo, buffer);
      return res.json({ message: 'Uploaded (octet-stream)', filename, size: buffer.length, path: saveTo });
    }

    // JSON with base64 data
    if (req.is('application/json')) {
      const { filename, data } = req.body || {};
      if (!data) return res.status(400).json({ error: 'JSON must include base64 `data` field' });
      const buffer = Buffer.from(data, 'base64');
      const fname = filename || `upload-${Date.now()}`;
      const saveTo = path.join(uploadsDir, fname);
      fs.writeFileSync(saveTo, buffer);
      return res.json({ message: 'Uploaded (base64 JSON)', filename: fname, size: buffer.length, path: saveTo });
    }

    return res.status(415).json({ error: 'Unsupported Content-Type. Use multipart/form-data, application/octet-stream, or application/json with base64 data.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Dedicated file endpoint: accepts application/octet-stream or JSON { filename, data(base64) }
app.post('/coverletter/file', auth, (req, res) => {
  try {
    // application/octet-stream
    if (req.is('application/octet-stream')) {
      const filename = req.query.filename || `file-${Date.now()}.bin`;
      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) return res.status(400).json({ error: 'Empty binary body' });
      const saveTo = path.join(uploadsDir, filename);
      fs.writeFileSync(saveTo, buffer);
      return res.json({ message: 'File received (octet-stream)', filename, size: buffer.length, path: saveTo });
    }

    // JSON with base64 data
    if (req.is('application/json')) {
      const { filename, data } = req.body || {};
      if (!data) return res.status(400).json({ error: 'JSON must include base64 `data` field' });
      const buffer = Buffer.from(data, 'base64');
      const fname = filename || `file-${Date.now()}`;
      const saveTo = path.join(uploadsDir, fname);
      fs.writeFileSync(saveTo, buffer);
      return res.json({ message: 'File received (base64 JSON)', filename: fname, size: buffer.length, path: saveTo });
    }

    return res.status(415).json({ error: 'Unsupported Content-Type. Use application/octet-stream or application/json with base64 data.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
