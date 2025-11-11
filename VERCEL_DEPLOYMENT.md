# Vercel Deployment Guide for AnonyPump

This guide will walk you through deploying AnonyPump to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Git repository (GitHub, GitLab, or Bitbucket)
3. (Optional) Vercel Postgres database for production

## Step 1: Prepare Your Repository

Make sure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel will auto-detect the project settings
5. Click **"Deploy"**

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Set Up Database (Optional but Recommended)

### Option 1: Use Vercel Postgres (Recommended for Production)

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **"Create Database"** → Select **"Postgres"**
3. Create the database
4. Go to **Settings** → **Environment Variables**
5. The `POSTGRES_URL` will be automatically added

The app will automatically use Vercel Postgres if `POSTGRES_URL` is available.

### Option 2: Use In-Memory Storage (Development Only)

If you don't set up a database, the app will use in-memory storage. **Note:** This means:
- Data will be lost when serverless functions restart
- Not suitable for production
- Each function instance has its own memory

## Step 4: Environment Variables

If using Vercel Postgres, the `POSTGRES_URL` is automatically set. No additional configuration needed.

## Step 5: Verify Deployment

1. Visit your deployment URL (provided by Vercel)
2. Test creating a post
3. Test voting functionality
4. Check the leaderboard

## Project Structure for Vercel

```
anony_pump/
├── api/                    # Serverless functions
│   ├── posts.js           # GET/POST /api/posts
│   ├── leaderboard.js     # GET /api/leaderboard
│   ├── vote.js            # POST /api/vote
│   └── store.js           # Shared in-memory store (fallback)
├── frontend/              # Static files
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── logo*.png
├── vercel.json            # Vercel configuration
└── package.json
```

## API Endpoints

- `GET /api/posts?limit=100&offset=0` - Fetch posts with pagination
- `POST /api/posts` - Create a new post (body: `{userId, content}`)
- `GET /api/leaderboard` - Get top 10 posts by upvotes
- `POST /api/vote` - Vote on a post (body: `{postId, type, userId}`)

## Important Notes

1. **Real-time Updates**: The app uses polling (every 5 seconds) instead of WebSockets for real-time updates, which works better with serverless functions.

2. **Database**: For production, use Vercel Postgres. The in-memory store is only for development/testing.

3. **Rate Limiting**: Rate limiting (10 posts per minute) is still active but stored in memory, so it resets when functions restart.

4. **CORS**: CORS is enabled for all origins. For production, you may want to restrict this.

## Troubleshooting

### Issue: Posts not persisting
- **Solution**: Set up Vercel Postgres database. In-memory storage doesn't persist.

### Issue: Functions timeout
- **Solution**: Check Vercel function logs. Database queries might be slow.

### Issue: CORS errors
- **Solution**: CORS is already configured in API routes. Check browser console for specific errors.

### Issue: 404 on API routes
- **Solution**: Ensure `vercel.json` is in the root directory and routes are correctly configured.

## Next Steps

1. Set up a custom domain in Vercel project settings
2. Enable analytics in Vercel dashboard
3. Set up monitoring and error tracking
4. Consider adding authentication for production use

## Support

For Vercel-specific issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

