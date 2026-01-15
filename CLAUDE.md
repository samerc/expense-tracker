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

React Native app built with Expo SDK 54 for iOS/Android.

### Running the Mobile App
```bash
cd mobile
npm install
npx expo start --tunnel    # Use tunnel for testing on physical device
```
Scan QR code with Expo Go app on your phone.

### Mobile Structure
- `app/` - Expo Router file-based navigation
  - `_layout.tsx` - Root layout with AuthProvider
  - `login.tsx` - Login screen
  - `(tabs)/` - Tab navigator (authenticated screens)
    - `index.tsx` - Home/Dashboard
    - `transactions.tsx` - Transaction list
    - `add.tsx` - Add transaction form
    - `budgets.tsx` - Budget/Allocations view
    - `settings.tsx` - User settings & logout
- `src/context/AuthContext.tsx` - Auth state with expo-secure-store
- `src/services/api.ts` - Axios client pointing to production API

### Mobile Current State (Jan 2026)
- ✅ Basic screens created and functional
- ✅ Login flow works with SecureStore token persistence
- ✅ Connects to production API (https://expense.fancyshark.com/api)
- ⏳ WatermelonDB offline storage not yet implemented
- ⏳ Multi-device sync not yet implemented
- ⏳ Touch-optimized category selection (drag) not yet implemented

### Mobile Next Steps
1. Set up WatermelonDB for offline-first storage
2. Build sync mechanism between local DB and server
3. Implement touch-friendly category picker (drag to select)
4. Add transaction edit/delete functionality
5. Implement budget funding from mobile
6. App store preparation (icons, splash, builds)

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

### Pending Features
1. **Mobile offline sync** - WatermelonDB setup pending
2. **Email invitations** - Backend exists, email sending not implemented
3. **Mobile transaction features** - Edit/delete, budget funding from mobile

### Known Production Issues
- Allocations API returns 500 if user has no allocations set up for the month
- Super admin needs to create household + user before someone can log in
