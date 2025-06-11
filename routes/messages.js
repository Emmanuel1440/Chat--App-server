// server/routes/messages.js
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = (wss) => {
  const router = express.Router();

  // Delete message by ID
   router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});
   //Edit message by ID
router.put('/:id', async (req, res) => {
  const { content, token } = req.body;
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE messages SET content = $1, edited = true WHERE id = $2 AND sender_id = $3 RETURNING *',
      [content, id, user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});


  // Upload media message

  router.post('/media', upload.single('file'), async (req, res) => {
    const { token } = req.body;
    if (!token || !req.file) return res.status(400).json({ error: 'Missing file or token' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const filePath = `/uploads/${req.file.filename}`; // ✅ CORRECT
      // NOTE: "uploads" folder
      const result = await pool.query(
        'INSERT INTO messages (sender_id, content, type) VALUES ($1, $2, $3) RETURNING *',
        [userId, filePath, 'media']
      );
      const savedMessage = result.rows[0];

      // Get user info
      const userRes = await pool.query(
        'SELECT username, avatar FROM users WHERE id = $1',
        [userId]
      );
      const user = userRes.rows[0];

      const messageToSend = {
        id: savedMessage.id,
        sender_id: userId,
        username: user.username,
        avatar: user.avatar,
        content: savedMessage.content,
        type: savedMessage.type,
        created_at: savedMessage.created_at
      };

      // Broadcast to all WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(messageToSend));
        }
      });

      res.json(messageToSend);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // Get all messages
  router.get('/', async (req, res) => {
    try {
      const messages = await pool.query(
        `SELECT messages.*, users.username, users.avatar FROM messages
         JOIN users ON messages.sender_id = users.id
         ORDER BY messages.created_at ASC`
      );
      res.json(messages.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
