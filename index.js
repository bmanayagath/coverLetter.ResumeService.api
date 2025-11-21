require('dotenv').config();
const express = require('express');
const auth = require('./middleware/auth');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('ResumeService API running'));

// Public route: returns a token for demo purposes
app.post('/login', (req, res) => {
  const jwt = require('jsonwebtoken');
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required in JSON body' });
  const token = jwt.sign({ username }, process.env.JWT_SECRET || 'changeme', { expiresIn: '1h' });
  res.json({ token });
});

// Protected route: requires valid JWT
app.get('/protected', auth, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
