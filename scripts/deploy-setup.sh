#!/bin/bash

# Weight Loss Tracker - Server Setup Script
# This script helps set up the server for first-time deployment

set -e  # Exit on any error

echo "========================================="
echo "Weight Loss Tracker - Server Setup"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please do not run this script as root${NC}"
    exit 1
fi

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo -n "Checking Node.js... "
if command_exists node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"
    else
        echo -e "${RED}✗ Node.js version must be 20 or higher${NC}"
        echo "Current version: $(node -v)"
        exit 1
    fi
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 20.x: https://nodejs.org/"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command_exists npm; then
    echo -e "${GREEN}✓ npm $(npm -v) installed${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command_exists psql; then
    echo -e "${GREEN}✓ PostgreSQL installed${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL not found${NC}"
    echo "Please install PostgreSQL 16: https://www.postgresql.org/download/"
fi

# Check PM2
echo -n "Checking PM2... "
if command_exists pm2; then
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${YELLOW}⚠ PM2 not found${NC}"
    read -p "Install PM2 globally? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo npm install -g pm2
        echo -e "${GREEN}✓ PM2 installed${NC}"
    fi
fi

echo ""
echo "========================================="
echo "Environment Configuration"
echo "========================================="
echo ""

# Check for .env.production
if [ -f ".env.production" ]; then
    echo -e "${YELLOW}⚠ .env.production already exists${NC}"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping environment setup"
    else
        rm .env.production
    fi
fi

if [ ! -f ".env.production" ]; then
    echo "Creating .env.production file..."

    read -p "Database host [192.168.149.42]: " DB_HOST
    DB_HOST=${DB_HOST:-192.168.149.42}

    read -p "Database port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}

    read -p "Database name: " DB_NAME
    read -p "Database user: " DB_USER
    read -sp "Database password: " DB_PASSWORD
    echo ""

    echo "Generating JWT secrets..."
    JWT_ACCESS_SECRET=$(openssl rand -base64 48)
    JWT_REFRESH_SECRET=$(openssl rand -base64 48)

    read -p "Application port [3000]: " APP_PORT
    APP_PORT=${APP_PORT:-3000}

    cat > .env.production << EOF
# Server Configuration
NODE_ENV=production
PORT=${APP_PORT}

# Database Configuration
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"

# Optional: Logging
LOG_LEVEL=info
EOF

    chmod 600 .env.production
    echo -e "${GREEN}✓ .env.production created${NC}"
fi

echo ""
echo "========================================="
echo "Installing Dependencies"
echo "========================================="
echo ""

echo "Installing production dependencies..."
npm ci --only=production

echo ""
echo "========================================="
echo "Database Setup"
echo "========================================="
echo ""

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

read -p "Seed database with test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install  # Install dev dependencies for seed
    npm run db:seed
    npm ci --only=production  # Remove dev dependencies
    echo -e "${GREEN}✓ Database seeded${NC}"
fi

echo ""
echo "========================================="
echo "Building Application"
echo "========================================="
echo ""

echo "Building CSS..."
npm run css:build

echo "Compiling TypeScript..."
npx tsc

echo "Copying views..."
mkdir -p dist/views
cp -r src/views/* dist/views/

echo ""
echo "========================================="
echo "Creating Directories"
echo "========================================="
echo ""

echo "Creating uploads directories..."
mkdir -p public/uploads/avatars public/uploads/progress
mkdir -p logs

echo "Setting permissions..."
chmod 775 public/uploads public/uploads/avatars public/uploads/progress

echo ""
echo "========================================="
echo "Starting Application"
echo "========================================="
echo ""

if command_exists pm2; then
    echo "Starting application with PM2..."
    pm2 start ecosystem.config.js
    pm2 save

    echo ""
    echo -e "${GREEN}✓ Application started with PM2${NC}"
    echo ""
    echo "Useful PM2 commands:"
    echo "  pm2 status          - View application status"
    echo "  pm2 logs wlt        - View application logs"
    echo "  pm2 restart wlt     - Restart application"
    echo "  pm2 stop wlt        - Stop application"
    echo ""

    read -p "Setup PM2 to start on system boot? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 startup
        echo ""
        echo -e "${YELLOW}⚠ Please run the command shown above to complete PM2 startup setup${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PM2 not available. Please start the application manually:${NC}"
    echo "  node dist/server.js"
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo -e "${GREEN}Your application should now be running on port ${APP_PORT}${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure your web server (Nginx/Apache) - See docs/DEPLOYMENT.md"
echo "  2. Setup SSL certificate"
echo "  3. Configure GitHub Actions secrets for automatic deployment"
echo "  4. Test the application at http://localhost:${APP_PORT}"
echo ""
echo "For more information, see docs/DEPLOYMENT.md"
echo ""
