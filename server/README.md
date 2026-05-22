# CITEzen API (Node.js + Express + MongoDB)

## Setup

```bash
cd server
npm install
cp .env.example .env
# set MONGODB_URI in .env (Atlas or local MongoDB)
npm run mongo:seed
```

Default seeded admin (change in production):

- **Email:** `admin@nemsu.edu.ph`
- **Password:** `Admin3msu` (or `SEED_ADMIN_PASSWORD` in `.env` when seeding)

## Run

```bash
npm run dev
```

API base: `http://localhost:3001` (override with `PORT` in `.env`).

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

## GabAI chat (Groq)

Set in `.env`:

```env
GROQ_API_KEY=your_key_from_groq_console
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/chat/sessions` | List chat sessions (auth required) |
| POST | `/api/chat/sessions` | Create session |
| POST | `/api/chat/sessions/import` | One-time localStorage migration |
| GET | `/api/chat/sessions/:id/messages` | Session + messages |
| PATCH | `/api/chat/sessions/:id` | Rename session |
| DELETE | `/api/chat/sessions/:id` | Delete session |
| POST | `/api/chat/stream` | Streaming chat (JSON body with `messages`, OpenAI-compatible SSE) |

GabAI uses Groq text-only models (default `llama-3.3-70b-versatile`). File attachments in the UI are described in message text; Groq does not analyze images or PDFs server-side.
