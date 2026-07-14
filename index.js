const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const pool = require('./db');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5000;

// Universal Engine Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Direct dependency injection
const authRoutes = require('./routes/auth');
const setupMessagesRoutes = require('./routes/messages');
const setupReactionsRoutes = require('./routes/reactions');

const messagesRoutes = setupMessagesRoutes(wss);
const reactionRoutes = setupReactionsRoutes(wss);

app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/reactions', reactionRoutes);

app.get('/', (req, res) => {
  res.send('ChatUp V2 API is fully online.');
});

// WebSocket Authentication & Sync Routing
wss.on('connection', (ws, req) => {
  console.log('Client initialization request received on socket...');

  ws.on('message', async (message) => {
    try {
      const rawData = JSON.parse(message);
      
      // Heartbeats or specific UI statuses
      if (rawData.type === 'ping') {
        return ws.send(JSON.stringify({ type: 'pong' }));
      }

      // Verify token
      if (!rawData.token) {
        return ws.send(JSON.stringify({ type: 'error', message: 'Auth token missing.' }));
      }

      let decoded;
      try {
        decoded = jwt.verify(rawData.token, process.env.JWT_SECRET);
      } catch (jwtErr) {
        return ws.send(JSON.stringify({ type: 'error', message: 'Token is invalid or expired.' }));
      }

      const userId = decoded.id;
      const type = rawData.type || 'text';

      if (type === 'text') {
        const result = await pool.query(
          'INSERT INTO messages (sender_id, content, type) VALUES ($1, $2, $3) RETURNING *',
          [userId, rawData.content, 'text']
        );
        const savedMessage = result.rows[0];

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
          type: 'text',
          edited: false,
          created_at: savedMessage.created_at
        };

        // Broadcast to all active clients
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: 'message', data: messageToSend }));
          }
        });
      }
    } catch (err) {
      console.error('WebSocket Exception Engine:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: 'Payload processing exception' }));
    }
  });

  ws.on('close', () => {
    console.log('Client session socket closed');
  });
});

server.listen(PORT, () => {
  console.log(`[ChatUp V2 Server Process Started] http://localhost:${PORT}`);
});