@echo off
echo ========================================
echo AnonyPump - Vercel Deployment Helper
echo ========================================
echo.
echo Step 1: Make sure you've created a GitHub repository
echo Step 2: Replace YOUR_REPO_URL below with your actual GitHub repo URL
echo Step 3: Run this script
echo.
pause

echo.
echo Adding remote repository...
echo (Replace YOUR_REPO_URL with your actual GitHub repository URL)
echo.
set /p REPO_URL="Enter your GitHub repository URL: "

git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo ========================================
echo Done! Now go to vercel.com to deploy
echo ========================================
pause

