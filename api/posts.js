const { sql } = require('@vercel/postgres');
const store = require('./store');

// For development, we'll use a simple in-memory store
// For production, use Vercel Postgres or another cloud database
let posts = store.posts;
let userVotes = store.userVotes;
let userPostTimestamps = store.userPostTimestamps;

// Check if Postgres is available
const usePostgres = !!process.env.POSTGRES_URL;

// Initialize database tables if using Postgres
async function initDatabase() {
  if (!usePostgres) return;
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS user_votes (
        user_id TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        PRIMARY KEY (user_id, post_id)
      )
    `;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Fetch posts with pagination
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    try {
      if (usePostgres) {
        await initDatabase(); // Ensure tables exist
        const result = await sql`
          SELECT * FROM posts 
          ORDER BY timestamp DESC 
          LIMIT ${limit} OFFSET ${offset}
        `;
        return res.json(result.rows);
      } else {
        // Fallback to in-memory storage
        const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return res.json(sortedPosts.slice(offset, offset + limit));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    // Create new post
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    // Rate limiting: 10 posts per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const userTimestamps = userPostTimestamps.get(userId) || [];
    const recentTimestamps = userTimestamps.filter(timestamp => timestamp > oneMinuteAgo);

    if (recentTimestamps.length >= 10) {
      return res.status(429).json({ error: 'You can only post 10 times per minute. Please wait.' });
    }

    // Add current post timestamp
    recentTimestamps.push(now);
    userPostTimestamps.set(userId, recentTimestamps);

    try {
      if (usePostgres) {
        await initDatabase(); // Ensure tables exist
        const result = await sql`
          INSERT INTO posts (user_id, content) 
          VALUES (${userId}, ${content}) 
          RETURNING *
        `;
        return res.json(result.rows[0]);
      } else {
        // Fallback to in-memory storage
        const newPost = {
          id: posts.length + 1,
          userId,
          content,
          upvotes: 0,
          downvotes: 0,
          timestamp: new Date().toISOString()
        };
        posts.push(newPost);
        return res.json(newPost);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

