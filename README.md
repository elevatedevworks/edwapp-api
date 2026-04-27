# EDW App API

Backend-first internal platform for Elevate DevWorks, built to run on a Raspberry Pi 5.

This project is currently focused on a modular finance domain for internal/personal use, including account tracking, bills, payments, reminders, and summary reporting. The architecture is designed so additional modules can be added over time without turning the app into a monolith mess.

## Current Purpose

The app is intended to support:

- internal EDW tools
- personal finance tracking
- modular backend development that can grow over time
- future frontend integration through a separate React Native app

## Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Drizzle ORM
- Zod
- systemd
- Raspberry Pi 5

## Current Features

### Core
- JWT authentication
- users
- role-based route protection
- modular route registration

### Finance
- accounts
- bills
- payments
- reminders
- summary endpoint

## Finance Domain Overview

### Accounts
Tracks user-owned financial accounts such as:
- checking
- savings
- credit cards
- cash

### Bills
Tracks recurring or one-time financial obligations.

### Payments
Tracks actual money movement.  
Creating a payment updates the linked account balance.

### Reminders
Tracks reminder records for:
- absolute reminder timestamps
- bill-based reminder offsets

### Summary
Provides a dashboard-style summary endpoint combining:
- account totals
- active monthly bills
- recent payments
- upcoming reminders

## Architecture

This project follows a **modular monolith** approach.

- shared platform concerns live in `core`
- business domains live in `modules`
- database schemas are split by domain under `src/db/schema`

### High-Level Structure

```text
src/
├─ app.ts
├─ server.ts
├─ config/
├─ core/
│  ├─ auth/
│  ├─ users/
│  └─ index.ts
├─ modules/
│  └─ finance/
│     ├─ accounts/
│     ├─ bills/
│     ├─ payments/
│     ├─ reminders/
│     ├─ summary/
│     └─ index.ts
├─ db/
│  ├─ index.ts
│  ├─ schema/
│  │  ├─ core/
│  │  ├─ finance/
│  │  └─ index.ts
│  └─ migrations/
├─ plugins/
└─ routes/
```

## Important Design Decisions

### Backend-first
This app starts with a dedicated API backend. Frontend concerns are handled separately.

### Modular design
Modules are grouped by domain so they can be maintained, expanded, or potentially extracted more easily later.

### User ownership model
Finance records are user-scoped.

`ownerUserId` is never trusted from request body input. It comes from the authenticated JWT user context in the route/service layer.

### Payments update balances
Creating a payment updates the linked account balance as part of the payment workflow.

### REST over GraphQL
The API is currently REST-based for simplicity, clarity, and faster backend iteration.

## Environment

Example environment variables:

```env
NODE_ENV=development
PORT=3005
HOST=127.0.0.1
DATABASE_URL=postgres://...
LOG_LEVEL=info
APP_NAME=edwapp-api
JWT_SECRET=your-long-secret
JWT_EXPIRES_IN=7d
ENABLED_MODULES=finance
```

## Development Commands

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Typecheck:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Start production build:

```bash
npm run start
```

## Database Commands

Generate migrations from schema changes:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

Push schema directly to the dev database:

```bash
npm run db:push
```

Open Drizzle Studio:

```bash
npm run db:studio
```

## Database Workflow Notes

Normal schema workflow:

```bash
npm run db:generate
npm run db:migrate
```

If the schema files and live dev database drift out of sync, `db:push` can be used to reconcile the development database.

## Authentication and Authorization

- JWT-based authentication
- `request.user.sub` is used as the authenticated user id
- finance routes are protected
- linked records are ownership-validated in the service layer

Examples:
- a bill linked to an account must use an account owned by the authenticated user
- a payment linked to a bill or account must reference records owned by the authenticated user
- reminders using `bill_offset` must reference a bill owned by the authenticated user

## Current API Areas

### Auth
- `/auth/login`
- `/auth/me`

### Users
- `/users`

### Finance
- `/finance/accounts`
- `/finance/bills`
- `/finance/payments`
- `/finance/reminders`
- `/finance/summary`

## Testing

Automated tests are being added module by module.

Current testing focus:
- auth
- ownership/authorization
- finance CRUD flows
- payment balance updates

## Deployment Notes

This API is intended to run on a Raspberry Pi 5.

Current deployment context:
- PostgreSQL runs locally on the Pi
- database is not publicly exposed
- systemd is used for service management
- app files live on SSD storage
- Cloudflare Tunnel is used for app/web exposure
- Tailscale is available for private admin access

## Frontend

Frontend planning and implementation are being handled separately in a React Native CLI project/chat.

This repo is focused on backend architecture, database design, services, routes, and integration support for that frontend.

## Roadmap

Near-term goals:

- finish finance test coverage
- improve summary/dashboard reporting
- support bill-offset reminder calculations in reporting
- continue frontend integration with React Native
- harden migrations/test setup

Longer-term possibilities:

- additional internal EDW modules
- project/client tracking
- user-facing frontend features
- richer reporting and notifications
