# Friends CRM - DigitalOcean Deployment Guide

## 🚀 Quick Deploy to DigitalOcean

### Option 1: DigitalOcean App Platform (Recommended)

1. **Fork/Push to GitHub** (if not already done)
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/friends-crm.git
   git push -u origin master
   ```

2. **Deploy via App Platform**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository
   - Choose this repository and branch `master`
   - Configure the build settings:
     - **Build Command**: `cd frontend && npm ci && npm run build && cp -r dist/* ../backend/public/`
     - **Run Command**: `cd backend && npm ci && node index.js`
     - **Environment**: Node.js
     - **HTTP Port**: 4000

3. **Environment Variables**
   - Set `NODE_ENV=production`
   - Set `PORT=4000`

4. **Deploy**
   - Click "Create Resources"
   - Wait for deployment (5-10 minutes)
   - Your app will be available at `https://your-app-name.ondigitalocean.app`

### Option 2: DigitalOcean Droplet with Docker

1. **Create a Droplet**
   - Create a new Ubuntu 22.04 droplet
   - Size: Basic $6/month should be sufficient for testing
   - Add your SSH key

2. **Connect and Setup**
   ```bash
   ssh root@your-droplet-ip
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo apt install docker-compose-plugin
   
   # Clone your repository
   git clone https://github.com/YOUR_USERNAME/friends-crm.git
   cd friends-crm
   ```

3. **Deploy with Docker**
   ```bash
   # Build and run
   docker compose up -d
   
   # Check status
   docker compose ps
   docker compose logs
   ```

4. **Setup Nginx (Optional - for custom domain)**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/friends-crm
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/friends-crm /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV=production`
- `PORT=4000`

### Health Check
The app includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-20T...",
  "service": "friends-crm"
}
```

## 📊 Monitoring

### Check Application Status
- Health check: `https://your-app.ondigitalocean.app/api/health`
- Application: `https://your-app.ondigitalocean.app`

### Docker Commands (for Droplet deployment)
```bash
# View logs
docker compose logs -f

# Restart application
docker compose restart

# Update application
git pull
docker compose up -d --build

# Check container status
docker compose ps
```

## 🔒 Security Notes

- **Data Persistence**: Currently using in-memory storage - data will reset on restart
- **HTTPS**: DigitalOcean App Platform provides HTTPS automatically
- **Authentication**: No authentication implemented - consider adding for production use

## 🚀 Going Live Checklist

- [ ] Repository pushed to GitHub
- [ ] DigitalOcean account created
- [ ] App deployed via App Platform or Droplet
- [ ] Health check endpoint responding
- [ ] Application accessible and functional
- [ ] Share URL with testers: `https://your-app.ondigitalocean.app`

## 💡 Next Steps for Production

1. **Database Integration**: Replace in-memory storage with PostgreSQL
2. **Authentication**: Add user login/registration
3. **Data Backup**: Implement regular data backups
4. **SSL Certificate**: For custom domains (Let's Encrypt)
5. **Monitoring**: Add application monitoring (e.g., New Relic, DataDog)

## 🆘 Troubleshooting

### Common Issues
- **Build fails**: Check Node.js version compatibility
- **API not accessible**: Verify proxy settings and CORS configuration
- **Static files not serving**: Ensure build output is in correct directory

### Debug Commands
```bash
# Check application logs
docker compose logs friends-crm

# Test health endpoint
curl http://localhost:4000/api/health

# Test API endpoints
curl http://localhost:4000/api/routes
```
