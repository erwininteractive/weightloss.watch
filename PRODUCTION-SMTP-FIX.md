# Production SMTP Troubleshooting Guide

## Quick Fix

Based on the deployment documentation, your production `.env.production` should use:

```bash
SMTP_PORT="587"
SMTP_SECURE="false"
```

NOT port 465 (which development uses).

## Step-by-Step Diagnostic

### 1. SSH to Production Server

```bash
ssh andrew@weightloss.watch
# or
ssh andrew@192.168.149.42
```

### 2. Navigate to Application Directory

```bash
cd /var/www/weightloss_watch
```

### 3. Check Current SMTP Configuration

```bash
# View SMTP settings (without showing password)
grep SMTP .env.production
```

**Expected configuration:**
```bash
SMTP_HOST="mail.erwininteractive.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="weightlosswatch"
SMTP_PASS="hattr1ck"
SMTP_FROM="Weight Loss Tracker <weightlosswatch@erwininteractive.com>"
```

### 4. Run SMTP Diagnostic Tool

```bash
# Run the diagnostic tool
npx ts-node scripts/test-smtp.ts

# Or test with a specific email
npx ts-node scripts/test-smtp.ts your-email@example.com
```

This will:
- Show your current SMTP configuration (password masked)
- Test the connection with current settings
- Try alternative ports if current fails
- Provide specific error messages

### 5. Check Application Logs

```bash
# View recent error logs
pm2 logs wlt --err --lines 50

# Or view all logs
pm2 logs wlt --lines 100

# Follow logs in real-time
pm2 logs wlt
```

Look for error messages containing:
- "Failed to send verification email"
- "SMTP"
- "Connection timeout"
- "ECONNREFUSED"
- "ETIMEDOUT"

## Common Issues & Solutions

### Issue 1: Wrong Port Configuration

**Symptom:** Connection timeout, 504 Gateway Timeout

**Fix:** Update `.env.production`:

```bash
nano .env.production
```

Change to:
```bash
SMTP_PORT="587"
SMTP_SECURE="false"
```

Restart the application:
```bash
pm2 restart wlt
```

### Issue 2: Firewall Blocking SMTP

**Test connectivity:**
```bash
# Test port 587
timeout 5 bash -c 'echo "QUIT" | nc mail.erwininteractive.com 587'

# Test port 465
timeout 5 bash -c 'echo "QUIT" | nc mail.erwininteractive.com 465'
```

If timeout occurs, the firewall may be blocking outbound SMTP.

**Check if telnet works:**
```bash
telnet mail.erwininteractive.com 587
# Press Ctrl+] then type 'quit' to exit
```

### Issue 3: Environment File Not Loaded

**Verify PM2 is using .env.production:**

```bash
# Check PM2 environment
pm2 env wlt | grep SMTP
```

If SMTP variables are not shown, check `ecosystem.config.js`:

```bash
cat ecosystem.config.js
```

Should contain:
```javascript
env_file: ".env.production",
```

If missing or incorrect, fix and restart:
```bash
pm2 delete wlt
pm2 start ecosystem.config.js
pm2 save
```

### Issue 4: Wrong Credentials

**Test SMTP authentication manually:**

```bash
# Install swaks if not installed
sudo apt-get install swaks

# Test SMTP with authentication
swaks --to test@example.com \
      --from weightlosswatch@erwininteractive.com \
      --server mail.erwininteractive.com:587 \
      --auth-user weightlosswatch \
      --auth-password hattr1ck \
      --tls
```

If this fails, the credentials are incorrect.

## After Making Changes

Always restart the application after updating configuration:

```bash
# Method 1: Restart PM2
pm2 restart wlt

# Method 2: Reload (zero-downtime)
pm2 reload wlt

# Verify it's running
pm2 status

# Check logs for errors
pm2 logs wlt --lines 20
```

## Test Registration Flow

After fixing SMTP:

1. Visit https://www.weightloss.watch/register
2. Create a new account
3. Check application logs: `pm2 logs wlt`
4. You should see: "📧 Email sent (development mode)" or no error

If using NODE_ENV=production (not development), you won't see the detailed email logs, but you also won't see errors if it works.

## Manual Email Test

Test sending an email directly:

```bash
# From production server
cd /var/www/weightloss_watch

# Run test script
node -e "
const { emailService } = require('./dist/services/email.service');
emailService.sendVerificationEmail('your-email@example.com', 'TestUser', 'test123')
  .then(() => console.log('Success'))
  .catch(err => console.error('Error:', err));
"
```

## Recommended Production Configuration

Create/update `.env.production`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3002
APP_URL="https://www.weightloss.watch"

# Database Configuration
DATABASE_URL="postgresql://wlt_user:P00psh00t8177@192.168.149.42:5432/weightlosstracker?schema=public"

# JWT Secrets (use your existing secrets)
JWT_ACCESS_SECRET="your-existing-secret"
JWT_REFRESH_SECRET="your-existing-secret"

# Email Configuration - CORRECT SETTINGS FOR PRODUCTION
SMTP_HOST="mail.erwininteractive.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="weightlosswatch"
SMTP_PASS="hattr1ck"
SMTP_FROM="Weight Loss Tracker <weightlosswatch@erwininteractive.com>"
```

## Check Application is Using Correct Config

```bash
# Start Node.js REPL with production env
cd /var/www/weightloss_watch
NODE_ENV=production node -e "
require('dotenv').config({ path: '.env.production' });
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
"
```

This should output:
```
SMTP_PORT: 587
SMTP_SECURE: false
SMTP_HOST: mail.erwininteractive.com
```

## Need More Help?

1. Run the diagnostic tool: `npx ts-node scripts/test-smtp.ts`
2. Check PM2 logs: `pm2 logs wlt --err`
3. Test SMTP manually with swaks
4. Verify firewall isn't blocking ports 587/465
5. Check `.env.production` exists and has correct values
