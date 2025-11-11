// Shared in-memory store for development/fallback
// In production with Vercel Postgres, this won't be used
let posts = [];
let userVotes = new Map();
let userPostTimestamps = new Map();

module.exports = {
  posts,
  userVotes,
  userPostTimestamps
};

