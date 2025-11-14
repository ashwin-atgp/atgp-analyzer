# Quick VPS Setup Guide

## Step 1: Connect to VPS
```bash
ssh -i ~/.ssh/hostinger_mac root@72.60.223.223
```

## Step 2: Run Quick Setup Commands

Copy and paste these commands one by one:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install other dependencies
apt install -y git redis-server postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# Install PM2 globally
npm install -g pm2

# Clone application
cd /var/www
git clone https://github.com/ashwin-atgp/atgp-analyzer.git
cd atgp-analyzer

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your production settings
nano .env

# Setup frontend
cd ../frontend
npm install
npm run build

# Start services with PM2
cd ../backend
pm2 start server.js --name "ad-analyzer-backend" --env production
cd ../frontend
pm2 start "npm run preview" --name "ad-analyzer-frontend"

# Save PM2 config
pm2 save
pm2 startup

# Setup SSL certificate
certbot certonly --nginx -d equityfocusgroup.com -d www.equityfocusgroup.com

# Configure Nginx (see VPS_DEPLOYMENT.md for full config)
# Then enable and restart
systemctl restart nginx
```

## Step 3: Verify Services

```bash
# Check PM2 status
pm2 status

# Check Nginx
systemctl status nginx

# Check Redis
systemctl status redis-server

# View logs
pm2 logs
```

## Step 4: Access Application

- **Frontend**: https://equityfocusgroup.com
- **API**: https://equityfocusgroup.com/api

## Deployment Updates

To deploy new code:

```bash
cd /var/www/atgp-analyzer
git pull origin main
cd backend && npm install && cd ../frontend && npm install && npm run build
pm2 restart all
```

Or use the automated script from your local machine:
```bash
./deploy.sh production
```

## Troubleshooting

**Check service status:**
```bash
pm2 status
systemctl status nginx
systemctl status redis-server
```

**View logs:**
```bash
pm2 logs ad-analyzer-backend
pm2 logs ad-analyzer-frontend
tail -f /var/log/nginx/error.log
```

**Restart services:**
```bash
pm2 restart all
systemctl restart nginx
```

## Environment Variables

Edit `/var/www/atgp-analyzer/backend/.env`:

```env
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://equityfocusgroup.com
DATABASE_URL=postgresql://analyzer_user:password@localhost:5432/ad_analyzer
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

## Database Setup

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE ad_analyzer;
CREATE USER analyzer_user WITH PASSWORD 'your_strong_password';
ALTER ROLE analyzer_user SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE ad_analyzer TO analyzer_user;
\q
```

## Firewall Setup

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Monitoring

```bash
# Real-time monitoring
pm2 monit

# View specific logs
pm2 logs ad-analyzer-backend
pm2 logs ad-analyzer-frontend

# Check system resources
free -h
df -h
```

---

For detailed information, see `VPS_DEPLOYMENT.md`
