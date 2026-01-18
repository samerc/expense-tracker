# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-featured expense tracking application with YNAB-style envelope budgeting, multi-user households, and role-based access control.

**Tech Stack:** Node.js/Express + React 19 + PostgreSQL + Tailwind CSS

## Development Commands

### Backend (server/)
```bash
cd server
npm install
npm run dev      # Start with nodemon on port 3000
npm start        # Production mode
```

### Frontend (web-admin/)
```bash
cd web-admin
npm install
npm run dev      # Start Vite dev server on port 5173
npm run build    # Production build
npm run lint     # ESLint
```

### Database
```bash
# Initial setup
psql -U samer -d expense_tracker -h localhost -f database/schema.sql

# Migrations are in database/migrations/
# Seeds are in database/seeds/
```

## Architecture

### Multi-Tenant Design
Every table has `household_id` for data isolation. Controllers always check `req.user.householdId` before data access.

### Backend Structure (server/src/)
- `app.js` - Express app configuration and route mounting
- `server.js` - HTTP server startup
- `config/database.js` - PostgreSQL connection pool
- `middleware/auth.js` - JWT authentication and role checks
- `controllers/` - Business logic (one per domain)
- `routes/` - API endpoint definitions
- `models/` - Database queries (if present)

### Frontend Structure (web-admin/src/)
- `App.jsx` - React Router routes and layout
- `context/AuthContext.jsx` - Authentication state management
- `components/layout/AppLayout.jsx` - Main layout with navigation
- `pages/` - Page components organized by feature
- `services/api.js` - Axios API client with auth interceptors
- Uses React Query (TanStack Query) for server state

### Database Schema (database/schema.sql)
- `households` - Multi-tenant container
- `users` - With role (regular/admin/super_admin)
- `accounts` - Bank accounts
- `categories` - Expense/income categories
- `transactions` + `transaction_lines` - Dual-entry bookkeeping
- `allocations` - Envelope budgeting (core feature)
- `transaction_allocations` - Links transactions to envelopes
- `subscription_plans`, `invitations` - Admin features

## Core Feature: Envelope Budgeting (Allocations)

The primary feature based on YNAB methodology. Key fields in `allocations`:
- `allocated_amount` - Budget goal for the month
- `available_amount` - Money funded into envelope
- `spent_amount` - Money deducted via transactions
- `balance` - available_amount - spent_amount

**Critical flows:**
- Creating expense transactions auto-deducts from allocations (transactionsController.js:360-395)
- Deleting transactions auto-restores to allocations
- Users can move money between envelopes

**Key files:**
- Backend: `server/src/controllers/allocationsController.js`
- Frontend: `web-admin/src/pages/allocations/AllocationsPage.jsx`
- Modals: `FundIncomeModal.jsx`, `MoveMoneyModal.jsx`, `AllocationTransactionsModal.jsx`

## Three User Roles

1. **Regular** - Own household data only
2. **Admin** - Household management + inviting users
3. **Super Admin** - Platform-wide management (all households, plans, users)

Super admin pages are in `web-admin/src/pages/super-admin/`.

## Known Issues

1. **PreferencesContext disabled** - Caused infinite loop with React Query; using localStorage fallback. See AuthContext.jsx:40.
2. **Email invites not functional** - Backend endpoint exists but email sending not implemented (invitationsController.js)
3. **Subscription API not implemented** - Calls commented out

## Patterns

- Soft deletes via `is_deleted` flag
- Dual-entry bookkeeping: `transactions` header + `transaction_lines` details
- Modal pattern: isOpen → useEffect → validate → submit
- API calls wrapped in React Query hooks
- All routes protected by `authenticateToken` middleware

---

## Mobile App (mobile/)

React Native app built with Expo SDK 54 for iOS/Android. **Offline-first architecture** using SQLite.

### Running the Mobile App
```bash
cd mobile
npm install
npx expo start           # LAN mode (recommended for local dev)
npx expo start --tunnel  # Tunnel mode (for remote testing)
```
Scan QR code with Expo Go app on your phone.

### Mobile Architecture: Offline-First

The mobile app is designed to work **fully offline** as a standalone product:

| Feature | Free Plan | Premium Plan |
|---------|-----------|--------------|
| Mobile app | Yes | Yes |
| Offline storage (SQLite) | Yes | Yes |
| Cloud sync | No | Yes |
| Multi-device | No | Yes |
| Web app access | No | Yes |

**Key Principle:** SQLite is the primary data store, not a cache. The app works 100% without internet.

### Mobile Structure
```
mobile/
├── app/                          # Expo Router file-based navigation
│   ├── _layout.tsx               # Root layout with DatabaseProvider + AuthProvider
│   ├── login.tsx                 # Login screen (for premium sync)
│   └── (tabs)/                   # Tab navigator
│       ├── index.tsx             # Home/Dashboard
│       ├── transactions.tsx      # Transaction list with edit/delete
│       ├── add.tsx               # Add transaction form
│       ├── budgets.tsx           # Budget/Allocations view
│       └── settings.tsx          # User settings
├── src/
│   ├── database/                 # SQLite database layer
│   │   ├── index.ts              # Database init, migrations, seeding
│   │   ├── schema.ts             # Table definitions + default data
│   │   └── repositories/         # CRUD operations per entity
│   │       ├── accountsRepository.ts
│   │       ├── categoriesRepository.ts
│   │       ├── transactionsRepository.ts
│   │       ├── allocationsRepository.ts
│   │       └── userRepository.ts
│   ├── context/
│   │   ├── DatabaseContext.tsx   # App-wide database state + network monitoring
│   │   └── AuthContext.tsx       # Auth state (for premium users)
│   ├── utils/
│   │   ├── uuid.ts               # UUID generation for local records
│   │   └── network.ts            # Network state detection
│   └── services/
│       └── api.ts                # Axios client (for sync, premium only)
```

### Database Schema (SQLite)

All tables include sync tracking columns:
- `id` - Local UUID (primary key)
- `server_id` - Server UUID (after sync)
- `sync_status` - `pending` | `synced` | `conflict` | `deleted`
- `created_at`, `modified_at` - Local timestamps
- `server_modified_at` - Server timestamp (for conflict detection)

Tables: `accounts`, `categories`, `transactions`, `transaction_lines`, `allocations`, `user_profile`, `app_settings`, `sync_log`, `sync_conflicts`

### Sync Flow (Premium Users)

1. **Local changes** → marked as `sync_status = 'pending'`
2. **When online + premium** → push pending changes to server
3. **Server responds** → update `server_id` and `sync_status = 'synced'`
4. **Conflicts detected** → stored in `sync_conflicts` table for user resolution
5. **User resolves** → picks local or server version

### Mobile Current State (Jan 2026)
- ✅ SQLite database with full schema
- ✅ Repository layer for all entities (CRUD)
- ✅ DatabaseProvider context with network monitoring
- ✅ Home, Transactions, Add Transaction screens use local SQLite
- ✅ Default categories and account seeded on first run
- ✅ Sync status tracking on all records
- ⏳ Budgets, Accounts, Categories screens need refactor to SQLite
- ⏳ Sync engine for premium users not yet built
- ⏳ Conflict resolution UI not yet built

### Mobile Next Steps
1. Refactor remaining screens (Budgets, Accounts, Categories) to use SQLite
2. Build sync engine for premium users
3. Create conflict resolution UI
4. Discuss and implement final tab/navigation design
5. App store preparation (icons, splash, builds)

---

## Deployment

### Production Server
- **URL:** https://expense.fancyshark.com
- **Server:** Windows Server 2025 with IIS reverse proxy
- **Database:** PostgreSQL on same server

### Server Setup Notes
- IIS reverse proxies to Node.js on port 3000
- SSL handled at IIS level (no HTTPS redirect in app)
- Database user: `expense_tracker_user`
- Run `database/seeds/production_seed.sql` for initial data

### Creating Users via SQL
```sql
-- Password: password123 (bcrypt hash)
INSERT INTO users (id, household_id, email, password_hash, name, role, is_active)
VALUES (
  gen_random_uuid(),
  'HOUSEHOLD_UUID_HERE',
  'user@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjEfV0YELR4GJQxqChBE.jmJOCTG4y',
  'User Name',
  'regular',
  TRUE
);
```

---

## Session Notes (Last Updated: Jan 2026)

### Recently Completed
- **Mobile offline-first architecture** - SQLite database with full schema
- Installed `expo-sqlite` and `expo-network` packages
- Created repository layer for all entities (accounts, categories, transactions, allocations)
- Added DatabaseProvider context with network state monitoring
- Refactored Home, Transactions, Add Transaction screens to use local SQLite
- Default data seeding (categories, account) on first app launch
- Sync status tracking (`pending`, `synced`, `conflict`, `deleted`) on all records

### Previously Completed
- Deployed web app to Windows Server 2025 with IIS
- Connected project to GitHub (github.com/samerc/expense-tracker)
- Created mobile app with Expo SDK 54
- Added super admin CRUD for households and users
- Fixed various deployment issues (bcrypt, Express 5, database schema)

### Completed Features
- **Multi-line transactions** - Fully implemented in web app
  - TransactionModal supports multiple line items
  - Exchange rate API integration (Frankfurter)
  - Multi-currency support per line
  - See: `web-admin/src/components/transactions/TransactionModal.jsx`

- **Super Admin Management** - Full CRUD operations
  - Create/Edit/Delete households (with plan assignment)
  - Create/Edit/Delete users (with password setting)
  - Reset user passwords (displays new password since email not working)
  - Subscription plans management
  - See: `web-admin/src/pages/super-admin/`

- **Forgot Password** - Works without email
  - User enters email on `/forgot-password`
  - New temporary password is displayed on screen
  - User must copy and use it to login

### Pending Features
1. **Mobile sync engine** - SQLite setup complete, sync to server pending
2. **Mobile conflict resolution** - UI for resolving multi-device conflicts
3. **Email invitations** - Backend exists, email sending not implemented
4. **Remaining mobile screens** - Budgets, Accounts, Categories need SQLite refactor

### Database Migrations to Run
If setting up a new server or getting errors, ensure these migrations are applied:
```sql
-- Migration 011: Add missing columns to subscription_plans
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS price_annual DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT -1,
ADD COLUMN IF NOT EXISTS max_accounts INTEGER DEFAULT -1,
ADD COLUMN IF NOT EXISTS max_budgets INTEGER DEFAULT -1,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';
```

### Known Production Issues
- Allocations API returns 500 if user has no allocations set up for the month
- Super admin needs to create household + user before someone can log in

### Key API Endpoints (Super Admin)
```
POST   /api/super-admin/households              - Create household
PUT    /api/super-admin/households/:id          - Update household (incl. plan)
POST   /api/super-admin/users                   - Create user
PUT    /api/super-admin/users/:id               - Update user
DELETE /api/super-admin/users/:id               - Delete user
POST   /api/super-admin/users/:id/reset-password - Reset password (returns new pw)
POST   /api/super-admin/plans                   - Create subscription plan
PUT    /api/super-admin/plans/:id               - Update plan
```
