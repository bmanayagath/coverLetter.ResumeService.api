require('dotenv').config();
const express = require('express');
const auth = require('./middleware/auth');
const cors = require('cors');
const multer = require('multer');
const { extractText, normalizePdfResult } = require('./src/utils/extractText');
const fs = require('fs');
const path = require('path');
const { extractResumeProfile } = require('./src/services/openaiExtractor');
const { saveResumeProfile } = require('./src/repositories/resumeRepository');

const app = express();

// CORS
const allowedOrigin = process.env.CORS_ALLOWED_ORIGIN || process.env.ALLOWED_ORIGIN || '*';
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigin === '*' || origin === allowedOrigin) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// multer for multipart/form-data uploads (store in memory then save)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const SAVE_EXTRACTED = (process.env.SAVE_EXTRACTED === 'true');

app.get('/', (req, res) => res.send('ResumeService API running'));

// Public route: returns a token for demo purposes
app.post('/login', (req, res) => {
  const jwt = require('jsonwebtoken');
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required in JSON body' });
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
  res.json({ token });
});

// Simplified upload: only handles multipart/form-data (field "file")
app.post('/coverletter/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field: file)' });

    // basic file type/size validation
    const allowedExt = ['.pdf', '.doc', '.docx', '.txt'];
    const orig = path.basename(req.file.originalname || '');
    const ext = path.extname(orig).toLowerCase();
    if (!allowedExt.includes(ext)) return res.status(400).json({ error: 'Invalid file type' });

    // sanitize and create unique filename
    const safeName = `${Date.now()}-${orig.replace(/[^a-z0-9.\-_]/gi, '_')}`;
    const saveTo = path.join(uploadsDir, safeName);

    fs.writeFileSync(saveTo, req.file.buffer);

    // extractText and normalizePdfResult are provided by src/utils/extractText

    // use the specialized PDF normalizer for PDFs, otherwise use extractText
    let text = '';
    if (ext === '.pdf') {
      text = await normalizePdfResult(req.file.buffer);
    } else {
      text = await extractText(req.file.buffer, ext);
    }

    // attempt structured extraction via OpenAI (throw on failure)
    const userRef = (req.user && req.user.email) ? req.user.email : null;
    const extractedProfile = await extractResumeProfile(text || '', userRef);
    if (!extractedProfile) {
      throw new Error('Failed to extract resume profile');
    }

    // optionally persist extracted profile to MongoDB when enabled
    let savedProfile = null;
    if (SAVE_EXTRACTED) {
      savedProfile = await saveResumeProfile(extractedProfile);
      if (!savedProfile) {
      throw new Error('Failed to save extracted resume profile');
      }
    }
    

    return res.json({
      message: 'Uploaded',
      filename: safeName
    });
  } catch (err) {
    const errorId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    console.error(`Upload error [${errorId}]:`, err);
    return res.status(500).json({ error: 'Server error', errorId });
  }
});

// normalizePdfResult is provided by src/utils/extractText

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
