const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = (wss) => {
  // Post/Toggle a user reaction on a message
  router.post('/', authMiddleware, async (req, res) => {
    const { message_id, emoji } = req.body;
    const userId = req.user.id;

    if (!message_id || !emoji) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
      // Check if user has already reacted with this emoji
      const existing = await pool.query(
        'SELECT * FROM reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [message_id, userId, emoji]
      );

      if (existing.rows.length > 0) {
        // Toggle action: If clicked again, delete the reaction
        await pool.query(
          'DELETE FROM reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
          [message_id, userId, emoji]
        );
        
        const removePayload = { type: 'reaction_remove', message_id, emoji, user_id: userId };
        wss.clients.forEach(client => {
          if (client.readyState === 1) client.send(JSON.stringify(removePayload));
        });
        return res.json({ success: true, action: 'removed', reaction: { message_id, emoji, user_id: userId } });
      }

      await pool.query(
        'INSERT INTO reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
        [message_id, userId, emoji]
      );

      const addPayload = {
        type: 'reaction_add',
        message_id,
        emoji,
        user_id: userId
      };

      wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(JSON.stringify(addPayload));
      });

      res.json({ success: true, action: 'added', reaction: addPayload });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database transaction error mapping reactions' });
    }
  });

  // Get aggregated reaction lists for a message
  router.get('/:messageId', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT user_id, emoji FROM reactions WHERE message_id = $1',
        [req.params.messageId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not resolve database reactions' });
    }
  });

  return router;
};