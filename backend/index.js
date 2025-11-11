const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const userPostTimestamps = new Map(); // Stores timestamps of user posts for rate limiting

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize SQLite database
// Use absolute path for production, relative path for development
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/anonyPump.db');
// Ensure database directory exists
const dbDir = path.dirname(dbPath);
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new sqlite3.Database(dbPath);

// Create posts table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    content TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create user_votes table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS user_votes (
    userId TEXT,
    postId INTEGER,
    type TEXT,
    PRIMARY KEY (userId, postId)
  )`);
});

// Handle new post submissions
io.on('connection', (socket) => {
  socket.on('newPost', (data) => {
    const { userId, content } = data;

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000; // 1 minute in milliseconds

    // Get user's recent post timestamps and filter out old ones
    const userTimestamps = userPostTimestamps.get(userId) || [];
    const recentTimestamps = userTimestamps.filter(timestamp => timestamp > oneMinuteAgo);

    if (recentTimestamps.length >= 10) {
      socket.emit('postError', { message: 'You can only post 10 times per minute. Please wait.' });
      return;
    }

    // Add current post timestamp
    recentTimestamps.push(now);
    userPostTimestamps.set(userId, recentTimestamps);

    db.run(`INSERT INTO posts (userId, content) VALUES (?, ?)`, [userId, content], function(err) {
      if (err) {
        console.error(err.message);
        return;
      }
      const newPostId = this.lastID;
      db.get(`SELECT * FROM posts WHERE id = ?`, [newPostId], (err, row) => {
        if (err) {
          console.error(err.message);
          return;
        }
        io.emit('postAdded', row); // Emit the full post object
      });
    });
  });

  // Handle upvote/downvote
  socket.on('vote', (data) => {
    const { postId, type, userId } = data; // Get userId from the client
    const column = type === 'upvote' ? 'upvotes' : 'downvotes';

    db.serialize(() => {
      db.run('BEGIN TRANSACTION;');

      // Check if user has already voted on this post
      db.get(`SELECT * FROM user_votes WHERE userId = ? AND postId = ?`, [userId, postId], (err, row) => {
        if (err) {
          console.error(err.message);
          socket.emit('voteError', { message: 'Server error during vote validation.' });
          db.run('ROLLBACK;');
          return;
        }
        if (row) {
          // User has already voted on this post
          socket.emit('voteError', { message: 'You have already voted on this post.' });
          db.run('ROLLBACK;');
          return;
        }

        // Record the vote in user_votes table
        db.run(`INSERT INTO user_votes (userId, postId, type) VALUES (?, ?, ?)`, [userId, postId, type], (err) => {
          if (err) {
            console.error(err.message);
            socket.emit('voteError', { message: 'Server error recording vote.' });
            db.run('ROLLBACK;');
            return;
          }

          // Update the posts table
          db.run(`UPDATE posts SET ${column} = ${column} + 1 WHERE id = ?`, [postId], function(err) {
            if (err) {
              console.error(err.message);
              socket.emit('voteError', { message: 'Server error updating post votes.' });
              db.run('ROLLBACK;');
              return;
            }
            db.run('COMMIT;');
            io.emit('voteUpdated', { postId, type, userId });
          });
        });
      });
    });
  });
});

// Fetch initial posts
app.get('/posts', (req, res) => {
  const limit = parseInt(req.query.limit) || 100; // Default to 100 posts
  const offset = parseInt(req.query.offset) || 0; // Default to offset 0
  db.all(`SELECT * FROM posts ORDER BY timestamp DESC LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Fetch top posts for leaderboard
app.get('/leaderboard', (req, res) => {
  db.all(`SELECT * FROM posts ORDER BY upvotes DESC LIMIT 10`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Start the server

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
