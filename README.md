# CIRES Frontend

Citizen Issue Reporting & Escalation System (CIRES) frontend built with React, TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- Lucide React

## Project Status

Core workflows are implemented across four phases:

1. Authentication & core setup
2. Geography + report submission engine
3. Citizen/Leader dashboards + ticket actions
4. Audit history + admin tools

## Features

### Authentication

- Login and register pages connected to backend endpoints
- JWT stored in `localStorage` as `jwt_token`
- Axios request interceptor automatically attaches `Authorization: Bearer <token>`
- Auth context with `user`, `token`, `isAuthenticated`, and `isLoading`

### Reporting

- Citizen report submission with category selection
- Cascading location dropdowns:
  - Province -> District -> Sector -> Cell -> Village
- SLA deadline auto-calculated on submit

### Dashboards

- Citizen dashboard:
  - Fetches `my-reports`
  - Summary cards (total/resolved)
  - Status badges and responsive report table
- Leader dashboard:
  - Queue selector by escalation level
  - Resolve/escalate actions
  - Auto-refresh after action

### Audit + Admin

- Ticket timeline/history page
- Citizen feedback submission for resolved reports
- Admin user management table with role update dropdown

## API Base URL

Configured in `src/api/axios.ts`:

- `http://localhost:8081/api`

If your backend URL changes, update `baseURL` there.

## Getting Started

### 1) Install dependencies

```powershell
npm install
```

### 2) Run development server

```powershell
npm run dev
```

### 3) Build for production

```powershell
npm run build
```

### 4) Preview production build

```powershell
npm run preview
```

## Key Routes

- `/login`
- `/register`
- `/dashboard`
- `/citizen/dashboard` (alias -> `/dashboard`)
- `/leader/dashboard` (alias -> `/dashboard`)
- `/report/new`
- `/admin/sla-config`

## Backend Endpoints Used

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Address

- `GET /address/provinces`
- `GET /address/provinces/{id}/districts`
- `GET /address/districts/{id}/sectors`
- `GET /address/sectors/{id}/cells`
- `GET /address/cells/{id}/villages`

### Reports

- `POST /reports`
- `GET /reports/my-reports`
- `GET /reports/level/{level}`
- `PUT /reports/{id}/resolve`
- `PUT /reports/{id}/escalate`

### Interactions

- `GET /interactions/reports/{reportId}/history`
- `POST /interactions/reports/{reportId}/feedback`

### Admin

- `GET /admin/users`
- `PUT /admin/users/{userId}/role`

## Notes

- Ensure the backend is running and JWT auth is enabled.
- If a route shows "Page Not Found", verify it exists in `src/routes/AppRoutes.tsx`.
- Role names should stay consistent between backend responses and frontend route guards.
