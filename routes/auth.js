const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { login } = require('../controllers/authController');

// Standardized Storage Config for User Profiles
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only system-supported image files are allowed!'));
  }
});

// Register with robust validation and duplicate detection
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All registration parameters are required.' });
    }

    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'This email is already in use.' });
    }

    const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : '/uploads/avatars/default.png';
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users(username, email, password, avatar) VALUES($1, $2, $3, $4) RETURNING id, username, email, avatar',
      [username, email.toLowerCase().trim(), hashedPassword, avatarPath]
    );

    const newUser = result.rows[0];
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, avatar: newUser.avatar },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: newUser,
    });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ message: err.message || 'Server-side storage failure.' });
  }
});

router.post('/login', login);

module.exports = router;