// server/routes/reactions.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

module.exports = (wss) => {
  // Add a new reaction and broadcast
  router.post('/', async (req, res) => {
    try {
      const { token, message_id, emoji } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user_id = decoded.id;

      const result = await pool.query(
        `INSERT INTO reactions (message_id, user_id, emoji)
         VALUES ($1, $2, $3) RETURNING *`,
        [message_id, user_id, emoji]
      );

      const reaction = result.rows[0];

      const payload = {
        type: 'reaction',
        message_id,
        emoji,
        user_id,
        created_at: new Date().toISOString(),
      };

      // ✅ Broadcast reaction to all WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(payload));
        }
      });

      res.json(payload);
    } catch (err) {
      console.error('Reaction error:', err.message);
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  });

  // Get reactions for a specific message
  router.get('/:messageId', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT user_id, emoji FROM reactions WHERE message_id = $1`,
        [req.params.messageId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Fetch reaction error:', err.message);
      res.status(500).json({ error: 'Could not fetch reactions' });
    }
  });

  return router;
};
