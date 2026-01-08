# Railway Deployment Guide

## Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub repository with your code pushed

## Step-by-Step Deployment

### 1. Create a New Project on Railway

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account (if not already connected)
5. Select the `friends` repository

### 2. Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL instance
4. Note: Railway automatically provides `DATABASE_URL` environment variable

### 3. Configure Environment Variables

In your Railway project settings, add these environment variables:

**Required:**
- `NODE_ENV` = `production`
- `PORT` = `4000` (Railway usually auto-detects this)
- `JWT_SECRET` = `your-secure-random-string-here` (generate a strong secret)
- `FRONTEND_URL` = `https://your-app-name.up.railway.app` (update after first deploy)

**Auto-provided by Railway:**
- `DATABASE_URL` (automatically set by PostgreSQL service)
- `DATABASE_PUBLIC_URL` (public connection string)

**Optional:**
- `DATABASE_PRIVATE_URL` (internal connection string - faster)

### 4. Configure Build & Start Commands

Railway should auto-detect your setup from `package.json`, but verify:

**Root Directory:** `.`

**Build Command:** (Railway runs `npm run build` automatically)
```bash
npm run build
```

**Start Command:** (Railway uses `npm start` from package.json)
```bash
npm start
```

### 5. Deploy!

1. Click "Deploy" or push to your GitHub repo
2. Railway will automatically:
   - Install dependencies
   - Build the frontend
   - Start the backend server
3. Watch the deployment logs for any errors

### 6. Initialize Database

After first deployment, you need to initialize the database schema and seed data:

**Option A: Using Railway CLI** (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed command
railway run npm run seed
```

**Option B: Using the API endpoint**

Once deployed, visit:
```
https://your-app-name.up.railway.app/api/seed/sample-data
```

This will create:
- Sample users (admin/coordinator/volunteer)
- Sample routes and locations
- Sample friends
- Sample runs and requests

### 7. Test Your Deployment

1. Visit your Railway app URL: `https://your-app-name.up.railway.app`
2. Try logging in with the default admin account:
   - Email: `admin@friends.org`
   - Password: `admin123`

### 8. Update FRONTEND_URL

After successful deployment:
1. Copy your Railway app URL
2. Go to Railway project settings
3. Update the `FRONTEND_URL` environment variable to your actual URL
4. Redeploy if needed

## Environment Variables Summary

```bash
# Required
NODE_ENV=production
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-app-name.up.railway.app

# Auto-provided by Railway PostgreSQL
DATABASE_URL=postgresql://...
DATABASE_PUBLIC_URL=postgresql://...
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running
- Ensure SSL is enabled (Railway requires SSL)

### Build Failures
- Check Node.js version in `package.json` engines field
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### CORS Issues
- Update `FRONTEND_URL` environment variable
- Verify the URL matches exactly (with https://)
- Check browser console for specific CORS errors

### Cannot Login
- Run database seed: `railway run npm run seed`
- Check JWT_SECRET is set
- Verify database tables were created

## Custom Domain (Optional)

1. Go to Railway project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `FRONTEND_URL` environment variable

## Monitoring

- View logs: Railway dashboard → Deployments → Logs
- Check metrics: Railway dashboard → Metrics
- Health check endpoint: `https://your-app.railway.app/api/health`

## Database Backups

Railway Pro includes automatic backups. For free tier:
1. Use Railway CLI: `railway pg dump > backup.sql`
2. Or use pg_dump directly with DATABASE_URL

## Updating Your App

Push to GitHub = automatic deployment!
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway will automatically redeploy.
