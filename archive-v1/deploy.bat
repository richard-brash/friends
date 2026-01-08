@echo off
REM Friends CRM Deployment Script for Windows

echo 🚀 Building Friends CRM for deployment...

REM Build frontend
echo 📦 Building frontend...
cd frontend
call npm ci
call npm run build

REM Copy build to backend public directory  
echo 📂 Copying frontend build to backend...
if exist ..\backend\public rmdir /s /q ..\backend\public
mkdir ..\backend\public
xcopy dist\* ..\backend\public\ /e /i /y

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd ..\backend
call npm ci --only=production

echo ✅ Build complete! Ready for deployment.
echo.
echo Next steps:
echo 1. Push to GitHub: git add . ^&^& git commit -m "Production build" ^&^& git push
echo 2. Deploy to DigitalOcean App Platform using the GitHub repository
echo 3. Set NODE_ENV=production and PORT=4000 in environment variables
echo.
echo Or run locally with: npm run prod

pause
