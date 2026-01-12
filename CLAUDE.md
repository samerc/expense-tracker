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
