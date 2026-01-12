# Quick Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Initial Setup

### 1. Database Setup
\`\`\`bash
# Create database
psql -U samer -h localhost
CREATE DATABASE expense_tracker;
\q

# Run schema
psql -U samer -d expense_tracker -h localhost -f server/src/config/schema.sql
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd server
npm install
npm run dev
\`\`\`

Backend runs on: `http://192.168.86.22:3000`

### 3. Frontend Setup
\`\`\`bash
cd web-admin
npm install
npm run dev
\`\`\`

Frontend runs on: `http://192.168.86.22:5173`

## Test Accounts

### Regular User
- Email: `samer@example.com`
- Password: (your password)
- Household: Samer Family

### Super Admin
- Email: `admin@expensetracker.com`  
- Password: (same as above)
- Household: Platform Administration

## First Time Login
1. Go to `http://192.168.86.22:5173`
2. Login with test account
3. Explore the Allocations page (main feature)

## Troubleshooting

### "Cannot connect to database"
Check PostgreSQL is running: `sudo systemctl status postgresql`

### "Port already in use"
Kill process: `lsof -ti:3000 | xargs kill -9`

### "Module not found"
Run `npm install` in affected directory

### Infinite loading loop
Clear browser cache and localStorage
