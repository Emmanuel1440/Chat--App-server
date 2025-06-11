const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Multer storage for avatars
const storage = multer.diskStorage({
  destination: 'uploads/avatars/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ✅ Register route (handles file + data)
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, avatarPath]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Login route (handled by controller)
const { login } = require('../controllers/authController');
router.post('/login', login);

module.exports = router;
