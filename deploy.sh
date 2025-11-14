#!/bin/bash

# Ad Stack Analyzer - VPS Deployment Script
# Usage: ./deploy.sh <environment>

set -e

ENVIRONMENT=${1:-production}
VPS_IP="72.60.223.223"
VPS_USER="root"
SSH_KEY="$HOME/.ssh/hostinger_mac"
APP_PATH="/var/www/atgp-analyzer"
DOMAIN="equityfocusgroup.com"

echo "🚀 Ad Stack Analyzer - VPS Deployment"
echo "======================================"
echo "Environment: $ENVIRONMENT"
echo "VPS: $VPS_IP"
echo "Domain: $DOMAIN"
echo ""

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at $SSH_KEY"
    exit 1
fi

echo "✅ SSH key found"

# Deploy function
deploy() {
    echo ""
    echo "📦 Deploying to VPS..."
    
    # Pull latest code
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "cd $APP_PATH && git pull origin main"
    
    # Install/update backend dependencies
    echo "📥 Installing backend dependencies..."
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "cd $APP_PATH/backend && npm install --production"
    
    # Install/update frontend dependencies
    echo "📥 Installing frontend dependencies..."
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "cd $APP_PATH/frontend && npm install"
    
    # Build frontend
    echo "🔨 Building frontend..."
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "cd $APP_PATH/frontend && npm run build"
    
    # Restart services
    echo "🔄 Restarting services..."
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "pm2 restart ad-analyzer-backend ad-analyzer-frontend"
    
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "🌐 Application available at: https://$DOMAIN"
}

# Initial setup function
setup() {
    echo ""
    echo "⚙️  Running initial VPS setup..."
    
    # Create app directory
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "mkdir -p $APP_PATH"
    
    # Clone repository
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "cd /var/www && git clone https://github.com/ashwin-atgp/atgp-analyzer.git || true"
    
    # Copy environment file
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "cp $APP_PATH/backend/.env.example $APP_PATH/backend/.env"
    
    echo ""
    echo "⚠️  Please configure the .env file on the VPS:"
    echo "   ssh -i $SSH_KEY $VPS_USER@$VPS_IP"
    echo "   nano $APP_PATH/backend/.env"
    echo ""
}

# Check if this is first deployment
if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" "[ -d $APP_PATH ]"; then
    deploy
else
    echo "🔧 First deployment detected, running setup..."
    setup
    echo ""
    echo "📝 After configuring .env, run: ./deploy.sh $ENVIRONMENT"
fi

echo ""
echo "======================================"
echo "✨ Done!"
