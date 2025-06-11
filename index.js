const jwt = require('jsonwebtoken');
const pool = require('./db'); // adjust if your pool is in another file

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
//const reactionsRoutes = require('./routes/reactions');  Import reactions routes
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');

const setupMessagesRoutes =   require('./routes/messages');
const setupReactionsRoutes = require('./routes/reactions'); // Import reactions routes

const messagesRoutes = setupMessagesRoutes(wss); // Import messages routes and pass WebSocket server
const reactionRoutes = setupReactionsRoutes(wss); // Import reactions routes and pass WebSocket server

// Use routes
app.use('/api/reactions', reactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);

// Routes
app.get('/', (req, res) => {
  res.send('Chat API is running');
});

// WebSocket setup
wss.on('connection', (ws, req) => {
  console.log('New client connected');

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg); // { token, content, type }

      // 1. Verify token
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // 2. Determine message type (default to 'text')
      const type = data.type || 'text';

      // 3. Save message to DB
      const result = await pool.query(
        'INSERT INTO messages (sender_id, content, type) VALUES ($1, $2, $3) RETURNING *',
        [userId, data.content, type]
      );

      const savedMessage = result.rows[0];

      // 4. Get sender info (username, avatar)
      const userRes = await pool.query(
        'SELECT username, avatar FROM users WHERE id = $1',
        [userId]
      );
      const user = userRes.rows[0];

      // 5. Broadcast message to all connected clients
      const messageToSend = {
        id: savedMessage.id,
        sender_id: userId,
        username: user.username,
        avatar: user.avatar,
        content: savedMessage.content,
        type: savedMessage.type,
        created_at: savedMessage.created_at,
      };

      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify(messageToSend));
        }
      });
    } catch (err) {
      console.error('Message error:', err.message);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
