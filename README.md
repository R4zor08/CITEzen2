# CITEzen2

CITEzen was developed to bridge the gap between students and the administration. We understand that navigating university processes can sometimes be confusing and time-consuming.

UI scaffold generated with [Magic Patterns](https://magicpatterns.com) ([source design](https://www.magicpatterns.com/c/ucl9mh5qdnd6vqamlnl21s)).

## Getting started (frontend)

1. Run `npm install`
2. Copy `.env.example` to `.env` and set `VITE_GROQ_API_KEY` if you use GabAI chat.
3. Run `npm run dev`

## Backend (Node.js + Express + MongoDB)

The API lives in `server/`. From the repo root:

```bash
cd server
npm install
cp .env.example .env
# set MONGODB_URI in .env (Atlas or local MongoDB)
npm run mongo:seed
npm run dev
```

See `server/README.md` for endpoint and env details.

Convenience (from repo root): `npm run server:dev`.

The frontend calls the API at `VITE_API_URL` (default `http://localhost:3001`). Run **both** `npm run server:dev` and `npm run dev` for full functionality.
