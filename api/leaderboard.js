const { sql } = require('@vercel/postgres');
const store = require('./store');

const usePostgres = !!process.env.POSTGRES_URL;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      if (usePostgres) {
        const result = await sql`
          SELECT * FROM posts 
          ORDER BY upvotes DESC 
          LIMIT 10
        `;
        return res.json(result.rows);
      } else {
        // Fallback to in-memory storage
        const posts = store.posts;
        const sortedPosts = [...posts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        return res.json(sortedPosts.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

