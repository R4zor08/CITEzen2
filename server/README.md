# CITEzen API (Node.js + Prisma + SQLite)

## Setup

```bash
cd server
npm install
cp .env.example .env   # optional; defaults match SQLite file prisma/dev.db
npx prisma generate
npx prisma db push
npm run db:seed
```

Default seeded admin (change in production):

- **Email:** `admin@nemsu.edu.ph`
- **Password:** `Admin3msu` (or `SEED_ADMIN_PASSWORD` in `.env` when seeding)

## Run

```bash
npm run dev
```

API base: `http://localhost:3001` (override with `PORT` in `.env`).

## Browse data

```bash
npx prisma studio
```

Opens a GUI to view and edit all tables.

## Endpoints (summary)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | `{ identifier, password, role }` — students use Student ID; staff/admin use email |
| POST | `/api/auth/register` | Register user |
| GET | `/api/users` | List users |
| PATCH | `/api/users/:id` | Update profile fields |
| GET | `/api/concerns` | Query: `studentId`, `department`, `assignedToId`, `status` |
| GET | `/api/concerns/:id` | Single concern |
| POST | `/api/concerns` | Create concern |
| PATCH | `/api/concerns/:id` | Update status, priority, assignment, department |
| POST | `/api/concerns/:id/comments` | Add comment |
| POST | `/api/concerns/:id/forward` | `{ department }` |
| GET | `/api/notifications?userId=` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark read |
| POST | `/api/notifications/mark-all-read` | `{ userId }` |

Wire the Vite app to this API in a follow-up (replace `localStorage` / mock hooks with `fetch`).
