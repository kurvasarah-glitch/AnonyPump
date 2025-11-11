# 🚀 Deploy AnonyPump to Vercel - Step by Step

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push to GitHub/GitLab/Bitbucket

**If you don't have a remote repository yet:**

1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it (e.g., "anony-pump")
3. Don't initialize with README
4. Copy the repository URL

**Then run these commands:**
```bash
git remote add origin YOUR_REPOSITORY_URL
git branch -M main
git push -u origin main
```

Replace `YOUR_REPOSITORY_URL` with your actual repository URL (e.g., `https://github.com/yourusername/anony-pump.git`)

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in (you can use GitHub to sign in)
3. Click **"Add New Project"** or **"New Project"**
4. Import your Git repository (GitHub/GitLab/Bitbucket)
5. Vercel will auto-detect:
   - Framework Preset: Other
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
6. Click **"Deploy"**

### Step 3: Set Up Database (IMPORTANT!)

After deployment completes:

1. Go to your project dashboard on Vercel
2. Click the **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Give it a name (e.g., "anony-pump-db")
6. Click **"Create"**
7. The `POSTGRES_URL` environment variable will be automatically added

**Your app will now use the database!**

### Step 4: Test Your Deployment

1. Visit your deployment URL (shown in Vercel dashboard)
2. Try creating a post
3. Try voting on a post
4. Check the leaderboard

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

### Step 3: Deploy

From your project directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No**
- Project name? (Press Enter for default: `anony-pump`)
- Directory? (Press Enter for `./`)
- Override settings? **No**

### Step 4: Deploy to Production

```bash
vercel --prod
```

### Step 5: Set Up Database

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Create a **Postgres** database
5. The `POSTGRES_URL` will be automatically configured

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Site loads at your Vercel URL
- [ ] Can create a new post
- [ ] Can vote on posts
- [ ] Leaderboard displays
- [ ] Database is connected (posts persist after refresh)

---

## 🐛 Troubleshooting

### Issue: "Posts not saving"
**Solution:** Make sure you created a Vercel Postgres database in the Storage tab.

### Issue: "404 on API routes"
**Solution:** Check that `vercel.json` is in the root directory.

### Issue: "Module not found: @vercel/postgres"
**Solution:** Make sure `package.json` includes `@vercel/postgres` dependency.

### Issue: "CORS errors"
**Solution:** CORS is already configured. Check browser console for specific errors.

---

## 📝 Next Steps

1. **Custom Domain**: Add a custom domain in Vercel project settings
2. **Environment Variables**: Add any additional env vars if needed
3. **Monitoring**: Enable Vercel Analytics in dashboard
4. **Updates**: Push to your Git repo to auto-deploy updates

---

## 🎉 You're Done!

Your AnonyPump app should now be live on Vercel!

