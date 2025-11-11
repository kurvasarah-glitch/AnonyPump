# Quick Start: Deploy to Vercel

## 🚀 Quick Deployment Steps

### 1. Install Vercel CLI (if using CLI)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

For production:
```bash
vercel --prod
```

### 4. Set Up Database (IMPORTANT!)

**Option A: Vercel Postgres (Recommended)**
1. Go to your Vercel project dashboard
2. Click **Storage** tab
3. Click **"Create Database"** → Select **"Postgres"**
4. The `POSTGRES_URL` environment variable will be automatically set

**Option B: Use In-Memory (Testing Only)**
- No setup needed, but data won't persist
- Not recommended for production

## 📝 What Changed

✅ **Converted to Serverless Functions**
- API routes in `/api` folder
- Works with Vercel's serverless architecture

✅ **Replaced WebSockets with REST + Polling**
- Real-time updates via polling (every 5 seconds)
- More compatible with serverless functions

✅ **Database Support**
- Vercel Postgres for production
- In-memory fallback for testing

✅ **Updated Frontend**
- Removed Socket.io dependency
- Uses fetch API for all requests

## 🔗 API Endpoints

- `GET /api/posts?limit=100&offset=0` - Get posts
- `POST /api/posts` - Create post
- `GET /api/leaderboard` - Get top posts
- `POST /api/vote` - Vote on post

## ⚠️ Important Notes

1. **Database Required for Production**: Set up Vercel Postgres for data persistence
2. **Rate Limiting**: Still active but resets when functions restart (in-memory mode)
3. **Real-time**: Uses polling instead of WebSockets (5-second intervals)

## 🐛 Troubleshooting

**Posts not saving?** → Set up Vercel Postgres database

**404 errors?** → Check that `vercel.json` is in the root directory

**CORS errors?** → Already configured, check browser console for details

## 📚 Full Documentation

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

