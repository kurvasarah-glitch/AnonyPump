const { sql } = require('@vercel/postgres');
const store = require('./store');

const usePostgres = !!process.env.POSTGRES_URL;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { postId, type, userId } = req.body;

    if (!postId || !type || !userId) {
      return res.status(400).json({ error: 'postId, type, and userId are required' });
    }

    if (type !== 'upvote' && type !== 'downvote') {
      return res.status(400).json({ error: 'type must be "upvote" or "downvote"' });
    }

    try {
      if (usePostgres) {
        // Check if user has already voted
        const existingVote = await sql`
          SELECT * FROM user_votes 
          WHERE user_id = ${userId} AND post_id = ${postId}
        `;

        if (existingVote.rows.length > 0) {
          return res.status(400).json({ error: 'You have already voted on this post.' });
        }

        // Record the vote
        await sql`
          INSERT INTO user_votes (user_id, post_id, type) 
          VALUES (${userId}, ${postId}, ${type})
        `;

        // Update the post
        let result;
        if (type === 'upvote') {
          result = await sql`
            UPDATE posts 
            SET upvotes = upvotes + 1 
            WHERE id = ${postId} 
            RETURNING *
          `;
        } else {
          result = await sql`
            UPDATE posts 
            SET downvotes = downvotes + 1 
            WHERE id = ${postId} 
            RETURNING *
          `;
        }

        return res.json({ 
          success: true, 
          postId, 
          type, 
          userId,
          post: result.rows[0]
        });
      } else {
        // Fallback to in-memory storage
        const posts = store.posts;
        const userVotes = store.userVotes;
        
        const voteKey = `${userId}-${postId}`;
        if (userVotes.has(voteKey)) {
          return res.status(400).json({ error: 'You have already voted on this post.' });
        }

        const post = posts.find(p => p.id === postId);
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }

        userVotes.set(voteKey, type);
        if (type === 'upvote') {
          post.upvotes = (post.upvotes || 0) + 1;
        } else {
          post.downvotes = (post.downvotes || 0) + 1;
        }

        return res.json({ 
          success: true, 
          postId, 
          type, 
          userId,
          post
        });
      }
    } catch (error) {
      console.error('Error processing vote:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

