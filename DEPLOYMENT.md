# Expense Tracker - Deployment Guide

## Windows Server 2025 Deployment

This guide covers deploying the Expense Tracker application to a Windows Server 2025 with IIS as a reverse proxy.

---

## Prerequisites

- Windows Server 2025
- Node.js (v18 or higher)
- npm
- PostgreSQL (v14 or higher)
- Administrator access

---

## Table of Contents

1. [Database Setup](#1-database-setup)
2. [Application Files](#2-application-files)
3. [Backend Configuration](#3-backend-configuration)
4. [Install Dependencies & Build](#4-install-dependencies--build)
5. [Process Manager (PM2)](#5-process-manager-pm2)
6. [IIS Reverse Proxy Setup](#6-iis-reverse-proxy-setup)
7. [SSL Certificate (HTTPS)](#7-ssl-certificate-https)
8. [Firewall Configuration](#8-firewall-configuration)
9. [Verification](#9-verification)
10. [Maintenance Commands](#10-maintenance-commands)
11. [Troubleshooting](#11-troubleshooting)
12. [Mobile App Configuration](#12-mobile-app-configuration)

---

## 1. Database Setup

### 1.1 Create Database and User

Open PowerShell as Administrator and run:

```powershell
psql -U postgres
```

In the PostgreSQL prompt, execute:

```sql
-- Create database
CREATE DATABASE expense_tracker;

-- Create application user
CREATE USER expense_app WITH PASSWORD 'YourSecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_app;

-- Connect to the database
\c expense_tracker

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO expense_app;

-- Exit
\q
```

### 1.2 Run Database Schema

```powershell
cd C:\apps\expense-tracker
psql -U expense_app -d expense_tracker -f database\schema.sql
```

If you have seed data:
```powershell
psql -U expense_app -d expense_tracker -f database\seeds\seed.sql
```

---

## 2. Application Files

### 2.1 Create Application Directory

```powershell
mkdir C:\apps\expense-tracker
```

### 2.2 Copy Files

Copy the entire expense-tracker project to `C:\apps\expense-tracker\`

The structure should be:
```
C:\apps\expense-tracker\
├── server\
│   ├── src\
│   ├── package.json
│   └── ...
├── web-admin\
│   ├── src\
│   ├── package.json
│   └── ...
└── database\
    ├── schema.sql
    └── ...
```

---

## 3. Backend Configuration

### 3.1 Generate JWT Secret

Run this command to generate a secure JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output for the next step.

### 3.2 Create Production Environment File

Create `C:\apps\expense-tracker\server\.env`:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_tracker
DB_USER=expense_app
DB_PASSWORD=YourSecurePassword123!

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3000
NODE_ENV=production

# ===========================================
# JWT AUTHENTICATION
# ===========================================
# Paste the generated secret from step 3.1
JWT_SECRET=your_64_byte_hex_string_here
JWT_EXPIRES_IN=7d

# ===========================================
# EMAIL SERVICE (Optional - for password reset)
# ===========================================
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# ===========================================
# FRONTEND URL
# ===========================================
FRONTEND_URL=https://your-domain.com
```

**Important**: Replace the placeholder values with your actual configuration.

---

## 4. Install Dependencies & Build

### 4.1 Install Backend Dependencies

```powershell
cd C:\apps\expense-tracker\server
npm install --production
```

### 4.2 Install Frontend Dependencies and Build

```powershell
cd C:\apps\expense-tracker\web-admin
npm install
npm run build
```

This creates the `dist` folder with production-ready static files.

---

## 5. Process Manager (PM2)

PM2 keeps your Node.js application running and restarts it if it crashes.

### 5.1 Install PM2 Globally

```powershell
npm install -g pm2
```

### 5.2 Install PM2 Windows Startup

```powershell
npm install -g pm2-windows-startup
pm2-startup install
```

### 5.3 Start the Application

```powershell
cd C:\apps\expense-tracker\server
pm2 start src/server.js --name "expense-tracker"
```

### 5.4 Save PM2 Configuration

```powershell
pm2 save
```

### 5.5 Verify PM2 Status

```powershell
pm2 status
```

You should see:
```
┌─────┬──────────────────┬─────────────┬──────┬───────────┐
│ id  │ name             │ mode        │ ↺    │ status    │
├─────┼──────────────────┼─────────────┼──────┼───────────┤
│ 0   │ expense-tracker  │ fork        │ 0    │ online    │
└─────┴──────────────────┴─────────────┴──────┴───────────┘
```

---

## 6. IIS Reverse Proxy Setup

### 6.1 Install IIS

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

### 6.2 Install Required IIS Modules

Download and install these modules:

1. **URL Rewrite Module**
   - Download: https://www.iis.net/downloads/microsoft/url-rewrite
   - Or direct: https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi

2. **Application Request Routing (ARR) 3.0**
   - Download: https://www.iis.net/downloads/microsoft/application-request-routing
   - Or direct: https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi

### 6.3 Enable ARR Proxy

1. Open **IIS Manager** (run `inetmgr`)
2. Click on your **server name** in the left panel (root level)
3. Double-click **Application Request Routing Cache**
4. Click **Server Proxy Settings** in the Actions panel (right side)
5. Check **Enable proxy**
6. Click **Apply**

### 6.4 Create Website in IIS

1. In IIS Manager, expand your server
2. Right-click **Sites** → **Add Website**
3. Configure:
   - **Site name**: `expense-tracker`
   - **Physical path**: `C:\apps\expense-tracker\web-admin\dist`
   - **Binding Type**: `http`
   - **Port**: `80`
   - **Host name**: `your-domain.com` (or leave blank for IP-only access)
4. Click **OK**

### 6.5 Create web.config for Reverse Proxy

Create `C:\apps\expense-tracker\web-admin\dist\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- Proxy API requests to Node.js backend -->
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
                </rule>

                <!-- Proxy health check endpoint -->
                <rule name="Health Proxy" stopProcessing="true">
                    <match url="^health$" />
                    <action type="Rewrite" url="http://localhost:3000/health" />
                </rule>

                <!-- Handle React Router - serve index.html for client-side routes -->
                <rule name="React Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>

        <!-- Enable proxy -->
        <proxy enabled="true" preserveHostHeader="true" />

        <!-- MIME types for static assets -->
        <staticContent>
            <remove fileExtension=".js" />
            <mimeMap fileExtension=".js" mimeType="application/javascript" />
            <remove fileExtension=".json" />
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <remove fileExtension=".woff" />
            <mimeMap fileExtension=".woff" mimeType="font/woff" />
            <remove fileExtension=".woff2" />
            <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
            <remove fileExtension=".svg" />
            <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
        </staticContent>

        <!-- Security headers -->
        <httpProtocol>
            <customHeaders>
                <add name="X-Content-Type-Options" value="nosniff" />
                <add name="X-Frame-Options" value="SAMEORIGIN" />
                <add name="X-XSS-Protection" value="1; mode=block" />
            </customHeaders>
        </httpProtocol>

        <!-- Caching for static assets -->
        <caching>
            <profiles>
                <add extension=".js" policy="CacheUntilChange" kernelCachePolicy="CacheUntilChange" />
                <add extension=".css" policy="CacheUntilChange" kernelCachePolicy="CacheUntilChange" />
            </profiles>
        </caching>
    </system.webServer>
</configuration>
```

### 6.6 Set Folder Permissions

```powershell
# Grant IIS_IUSRS read access to the dist folder
icacls "C:\apps\expense-tracker\web-admin\dist" /grant "IIS_IUSRS:(OI)(CI)R" /T
```

---

## 7. SSL Certificate (HTTPS)

### Option A: Let's Encrypt (Free - Recommended)

#### 7.1 Download win-acme

Download from: https://www.win-acme.com/

Extract to `C:\tools\win-acme\`

#### 7.2 Run win-acme

```powershell
cd C:\tools\win-acme
.\wacs.exe
```

Follow the interactive prompts:
1. Select **N** for new certificate
2. Select **1** for IIS site bindings
3. Select your site (expense-tracker)
4. Follow remaining prompts to complete setup

The certificate will auto-renew.

### Option B: Purchased Certificate

1. In IIS Manager, click your server name
2. Double-click **Server Certificates**
3. Click **Import** in the Actions panel
4. Browse to your `.pfx` file and import
5. Go to your site → **Bindings**
6. Click **Add**
7. Select:
   - Type: `https`
   - Port: `443`
   - SSL certificate: Select your certificate
8. Click **OK**

### 7.3 Force HTTPS Redirect (Recommended)

Add this rule to `web.config` as the **first rule** inside `<rules>`:

```xml
<!-- Force HTTPS Redirect - Add as FIRST rule -->
<rule name="HTTPS Redirect" stopProcessing="true">
    <match url="(.*)" />
    <conditions>
        <add input="{HTTPS}" pattern="off" ignoreCase="true" />
    </conditions>
    <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```

---

## 8. Firewall Configuration

### 8.1 Open Required Ports

```powershell
# HTTP (port 80)
New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -Port 80 -Protocol TCP -Action Allow

# HTTPS (port 443)
New-NetFirewallRule -DisplayName "HTTPS Inbound" -Direction Inbound -Port 443 -Protocol TCP -Action Allow
```

### 8.2 Block Direct Access to Node.js (Optional but Recommended)

Keep port 3000 accessible only from localhost:

```powershell
# Block external access to port 3000
New-NetFirewallRule -DisplayName "Block External Node.js" -Direction Inbound -Port 3000 -Protocol TCP -Action Block -RemoteAddress Any
```

---

## 9. Verification

### 9.1 Check PM2 Status

```powershell
pm2 status
```

### 9.2 Check Node.js Logs

```powershell
pm2 logs expense-tracker
```

### 9.3 Test Endpoints

Open a browser and test:

| URL | Expected Result |
|-----|-----------------|
| `http://your-domain.com` | React app loads |
| `https://your-domain.com` | React app loads (with SSL) |
| `https://your-domain.com/health` | `{"status":"ok","timestamp":"...","environment":"production"}` |
| `https://your-domain.com/api` | API information JSON |
| `https://your-domain.com/login` | Login page |

### 9.4 Test Database Connection

```powershell
psql -U expense_app -d expense_tracker -c "SELECT 1"
```

---

## 10. Maintenance Commands

### PM2 Commands

```powershell
# View status
pm2 status

# View logs
pm2 logs expense-tracker

# View logs (last 100 lines)
pm2 logs expense-tracker --lines 100

# Restart application
pm2 restart expense-tracker

# Stop application
pm2 stop expense-tracker

# Start application
pm2 start expense-tracker

# Delete and re-add application
pm2 delete expense-tracker
pm2 start src/server.js --name "expense-tracker"
pm2 save

# Real-time monitoring
pm2 monit

# View process details
pm2 show expense-tracker
```

### IIS Commands

```powershell
# Restart IIS
iisreset

# Restart specific site
appcmd stop site "expense-tracker"
appcmd start site "expense-tracker"

# View site status
appcmd list site
```

### Database Backup

```powershell
# Backup database
pg_dump -U expense_app -d expense_tracker > C:\backups\expense_tracker_backup.sql

# Restore database
psql -U expense_app -d expense_tracker < C:\backups\expense_tracker_backup.sql
```

### Update Application

```powershell
# 1. Backup current version
Copy-Item -Path "C:\apps\expense-tracker" -Destination "C:\apps\expense-tracker-backup" -Recurse

# 2. Copy new files (excluding node_modules and .env)

# 3. Rebuild frontend
cd C:\apps\expense-tracker\web-admin
npm install
npm run build

# 4. Update backend dependencies
cd C:\apps\expense-tracker\server
npm install --production

# 5. Restart services
pm2 restart expense-tracker
iisreset
```

---

## 11. Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: Node.js application is not running

**Solution**:
```powershell
pm2 status
pm2 restart expense-tracker
pm2 logs expense-tracker
```

### Issue: 500 Internal Server Error on API

**Cause**: Backend error

**Solution**:
```powershell
pm2 logs expense-tracker --lines 200
```
Check for database connection errors or missing environment variables.

### Issue: Static Files Not Loading (CSS/JS 404)

**Cause**: MIME types not configured or file permissions

**Solution**:
1. Verify web.config has correct MIME types
2. Check folder permissions:
```powershell
icacls "C:\apps\expense-tracker\web-admin\dist"
```

### Issue: CORS Errors

**Cause**: Cross-origin requests blocked

**Solution**: Update `server/src/app.js`:
```javascript
app.use(cors({
  origin: ['https://your-domain.com'],
  credentials: true
}));
```

### Issue: Database Connection Failed

**Cause**: Wrong credentials or PostgreSQL not running

**Solution**:
```powershell
# Check PostgreSQL service
Get-Service -Name postgresql*

# Test connection
psql -U expense_app -d expense_tracker -c "SELECT 1"

# Verify .env file
Get-Content C:\apps\expense-tracker\server\.env
```

### Issue: Site Not Accessible Externally

**Cause**: Firewall blocking

**Solution**:
```powershell
# Check firewall rules
Get-NetFirewallRule -DisplayName "*HTTP*" | Format-Table Name, Enabled, Direction, Action

# Check if port is listening
netstat -an | findstr ":80"
netstat -an | findstr ":443"
```

### Issue: SSL Certificate Errors

**Cause**: Certificate not properly bound or expired

**Solution**:
1. Check binding in IIS Manager → Sites → expense-tracker → Bindings
2. Verify certificate is valid in Server Certificates
3. For Let's Encrypt, run `wacs.exe` to renew

---

## Architecture Diagram

```
                    Internet
                        │
                        ▼
            ┌───────────────────────┐
            │   Windows Firewall    │
            │   (Ports 80, 443)     │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │      IIS Server       │
            │   (Reverse Proxy)     │
            │                       │
            │  - SSL Termination    │
            │  - Static Files       │
            │  - URL Rewrite        │
            └───────────┬───────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌───────────────┐      ┌───────────────┐
    │ Static Files  │      │   /api/*      │
    │ (React App)   │      │   Requests    │
    │ /dist folder  │      └───────┬───────┘
    └───────────────┘              │
                                   ▼
                        ┌───────────────────┐
                        │    Node.js        │
                        │  (Express API)    │
                        │   Port 3000       │
                        │  Managed by PM2   │
                        └─────────┬─────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │   PostgreSQL      │
                        │   Port 5432       │
                        └───────────────────┘
```

---

## Security Checklist

- [ ] Strong database password set
- [ ] JWT secret is 64+ random characters
- [ ] Node.js port (3000) blocked from external access
- [ ] HTTPS enabled with valid certificate
- [ ] HTTP redirects to HTTPS
- [ ] Security headers configured in web.config
- [ ] Database backups scheduled
- [ ] PM2 configured to auto-start on boot
- [ ] Firewall rules reviewed
- [ ] .env file has restricted permissions

---

## Support

For issues with this deployment:
1. Check PM2 logs: `pm2 logs expense-tracker`
2. Check IIS logs: `C:\inetpub\logs\LogFiles\`
3. Check Windows Event Viewer for system errors

---

## 12. Mobile App Configuration

The mobile app (Expo/React Native) can connect to either your local development server or the production server.

### 12.1 API URL Configuration

The API URL is configured in `mobile/src/services/api.ts`:

```typescript
// Toggle this for local development vs production
const USE_LOCAL = true; // Set to true when testing with local backend
```

**Settings:**
- `USE_LOCAL = true` → Connects to your local backend (auto-detects IP)
- `USE_LOCAL = false` → Connects to production (`https://expense.fancyshark.com/api`)

### 12.2 Local Development Setup

When testing with your local backend:

1. **Set `USE_LOCAL = true`** in `mobile/src/services/api.ts`

2. **Start your local backend:**
   ```powershell
   cd server
   npm run dev
   ```

3. **Start the Expo dev server:**
   ```powershell
   cd mobile
   npx expo start
   ```

4. **Ensure both devices are on the same WiFi network**

The mobile app automatically detects your computer's IP address from Expo's debugger host - no need to manually update the IP when it changes.

### 12.3 Production Deployment

When deploying or testing against production:

1. **Set `USE_LOCAL = false`** in `mobile/src/services/api.ts`

2. The app will connect to the production API at `https://expense.fancyshark.com/api`

### 12.4 How Auto-Detection Works

```typescript
const getLocalApiUrl = () => {
  // Expo provides the dev machine's IP via debuggerHost
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  // Fallback for Android emulator
  return 'http://10.0.2.2:3000/api';
};
```

### 12.5 Troubleshooting Mobile Connection

| Issue | Solution |
|-------|----------|
| Can't connect to local server | Ensure phone and computer are on same WiFi |
| "Network request failed" | Check if backend is running on port 3000 |
| Wrong credentials/data | Verify `USE_LOCAL` setting matches intended server |
| IP not detected | Restart Expo server, check `Constants.expoGoConfig` |

---

*Last Updated: January 2026*
