const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const checkExt = allowed.test(path.extname(file.originalname).toLowerCase());
    const checkMime = allowed.test(file.mimetype);
    if (checkExt && checkMime) return cb(null, true);
    cb(new Error('Invalid media type. Select an image file.'));
  }
});

module.exports = (wss) => {
  // Fetch messages with sender profiles
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const messages = await pool.query(
        `SELECT messages.*, users.username, users.avatar 
         FROM messages
         JOIN users ON messages.sender_id = users.id
         ORDER BY messages.created_at ASC`
      );
      res.json(messages.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve conversation history' });
    }
  });

  // Post image media uploads
  router.post('/media', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No media payload detected' });

    try {
      const userId = req.user.id;
      const filePath = `/uploads/${req.file.filename}`;

      const dbInsert = await pool.query(
        'INSERT INTO messages (sender_id, content, type) VALUES ($1, $2, $3) RETURNING *',
        [userId, filePath, 'media']
      );
      const savedMessage = dbInsert.rows[0];

      const fullMessage = {
        id: savedMessage.id,
        sender_id: userId,
        username: req.user.username,
        avatar: req.user.avatar,
        content: savedMessage.content,
        type: 'media',
        edited: false,
        created_at: savedMessage.created_at
      };

      // Broadcast WebSocket notification
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'message', data: fullMessage }));
        }
      });

      res.status(201).json(fullMessage);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error mapping upload storage' });
    }
  });

  // Update existing messages with socket alerts
  router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }

    try {
      const verifyOwnership = await pool.query(
        'SELECT * FROM messages WHERE id = $1 AND sender_id = $2',
        [id, req.user.id]
      );

      if (verifyOwnership.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden. You do not own this message.' });
      }

      const updateRes = await pool.query(
        'UPDATE messages SET content = $1, edited = true WHERE id = $2 RETURNING *',
        [content.trim(), id]
      );

      const updatedMsg = updateRes.rows[0];

      // Broadcast update event to active sessions
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ 
            type: 'message_edit', 
            data: { id: updatedMsg.id, content: updatedMsg.content, edited: true } 
          }));
        }
      });

      res.json(updatedMsg);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database update exception' });
    }
  });

  // Delete message with dynamic client teardown
  router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
      const verifyOwnership = await pool.query(
        'SELECT * FROM messages WHERE id = $1 AND sender_id = $2',
        [id, req.user.id]
      );

      if (verifyOwnership.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized message deletion request.' });
      }

      await pool.query('DELETE FROM messages WHERE id = $1', [id]);

      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'message_delete', id: parseInt(id) }));
        }
      });

      res.json({ success: true, message: 'Message deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal database connection timeout' });
    }
  });

  return router;
};