# VPS Deployment Guide - Ad Stack Analyzer

## Server Information
- **IP Address**: 72.60.223.223
- **Domain**: equityfocusgroup.com
- **SSH User**: root
- **SSH Key**: hostinger_mac

## Prerequisites
- SSH access configured with hostinger_mac key
- Node.js 18+ installed on VPS
- npm 9+ installed on VPS
- Git installed on VPS

## Initial VPS Setup

### 1. Connect to VPS
```bash
ssh -i ~/.ssh/hostinger_mac root@72.60.223.223
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Node.js and npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node -v
npm -v
```

### 4. Install Git
```bash
apt install -y git
```

### 5. Install Redis (for job queue)
```bash
apt install -y redis-server
systemctl start redis-server
systemctl enable redis-server
```

### 6. Install PM2 (process manager)
```bash
npm install -g pm2
```

## Application Deployment

### 1. Clone Repository
```bash
cd /var/www
git clone https://github.com/ashwin-atgp/atgp-analyzer.git
cd atgp-analyzer
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with production settings
nano .env
```

**Production .env Configuration:**
```env
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://equityfocusgroup.com
DATABASE_URL=postgresql://user:password@localhost:5432/ad_analyzer
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

### 4. Start Services with PM2

**Backend:**
```bash
cd /var/www/atgp-analyzer/backend
pm2 start server.js --name "ad-analyzer-backend" --env production
```

**Frontend (serve build):**
```bash
cd /var/www/atgp-analyzer/frontend
pm2 start "npm run preview" --name "ad-analyzer-frontend"
```

### 5. Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

## Nginx Configuration

### 1. Install Nginx
```bash
apt install -y nginx
```

### 2. Create Nginx Config
```bash
nano /etc/nginx/sites-available/equityfocusgroup.com
```

**Configuration:**
```nginx
upstream backend {
    server localhost:5001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name equityfocusgroup.com www.equityfocusgroup.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name equityfocusgroup.com www.equityfocusgroup.com;
    
    # SSL Certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/equityfocusgroup.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/equityfocusgroup.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend;
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

### 3. Enable Site
```bash
ln -s /etc/nginx/sites-available/equityfocusgroup.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## SSL Certificate Setup (Let's Encrypt)

### 1. Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 2. Get Certificate
```bash
certbot certonly --nginx -d equityfocusgroup.com -d www.equityfocusgroup.com
```

### 3. Auto-renewal
```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

## Database Setup (PostgreSQL)

### 1. Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
```

### 2. Create Database
```bash
sudo -u postgres psql
CREATE DATABASE ad_analyzer;
CREATE USER analyzer_user WITH PASSWORD 'strong_password';
ALTER ROLE analyzer_user SET client_encoding TO 'utf8';
ALTER ROLE analyzer_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE analyzer_user SET default_transaction_deferrable TO on;
ALTER ROLE analyzer_user SET default_transaction_read_committed TO on;
GRANT ALL PRIVILEGES ON DATABASE ad_analyzer TO analyzer_user;
\q
```

## Monitoring & Logs

### View PM2 Logs
```bash
pm2 logs ad-analyzer-backend
pm2 logs ad-analyzer-frontend
```

### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### System Monitoring
```bash
pm2 monit
```

## Backup & Maintenance

### Database Backup
```bash
pg_dump -U analyzer_user ad_analyzer > /backups/ad_analyzer_$(date +%Y%m%d).sql
```

### Application Backup
```bash
tar -czf /backups/ad-analyzer_$(date +%Y%m%d).tar.gz /var/www/atgp-analyzer
```

## Troubleshooting

### Check Service Status
```bash
pm2 status
systemctl status nginx
systemctl status redis-server
systemctl status postgresql
```

### Restart Services
```bash
pm2 restart all
systemctl restart nginx
```

### View Application Logs
```bash
pm2 logs
```

## Performance Optimization

### 1. Enable Caching
- Configure Redis for session storage
- Implement HTTP caching headers
- Use CDN for static assets

### 2. Database Optimization
- Create indexes on frequently queried columns
- Regular VACUUM and ANALYZE
- Monitor slow queries

### 3. Application Optimization
- Enable gzip compression (done in Nginx)
- Minify frontend assets (done in build)
- Implement rate limiting (done in backend)

## Security Checklist

- [ ] SSH key-based authentication only
- [ ] Firewall configured (ufw)
- [ ] SSL/TLS certificates installed
- [ ] Security headers configured
- [ ] Regular backups enabled
- [ ] Monitoring and alerting set up
- [ ] Log rotation configured
- [ ] Database credentials secured

## Firewall Setup

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Support & Maintenance

For issues or updates:
1. Check logs: `pm2 logs`
2. Review Nginx config: `nginx -t`
3. Monitor resources: `pm2 monit`
4. Update code: `git pull origin main`
5. Restart services: `pm2 restart all`

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
