# Full-Stack Next.js Starter

A full-stack web app built with [Next.js](https://nextjs.org) (App Router) and TypeScript.
The React frontend and the Node.js backend live in the **same** project — API routes run
on a Node.js server, and the UI is rendered in the browser.

## Tech stack

- **Next.js 16** (App Router) — React framework with built-in routing & server-side code
- **React 19** + **TypeScript**
- **Tailwind CSS v4** — styling
- **ESLint** — linting
- **Node.js runtime** — powers the API routes (the "backend")

## Getting started

Install dependencies (already done if you scaffolded with `create-next-app`):

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser. The page hot-reloads as you edit files.

## Project structure

```
src/
  app/
    layout.tsx            # Root layout (HTML shell, fonts, metadata)
    page.tsx              # Home page (client component, calls the API)
    globals.css           # Global Tailwind styles
    api/
      health/route.ts     # GET /api/health   -> backend status + Node version
      messages/route.ts   # GET/POST /api/messages -> in-memory message list
public/                   # Static assets
```

## The backend (API routes)

Files named `route.ts` inside `src/app/api/**` are server-side endpoints that run on Node.js.

- `GET /api/health` — returns `{ status, runtime, nodeVersion, time }`
- `GET /api/messages` — returns the list of messages
- `POST /api/messages` — body `{ "text": "..." }`, appends a message

> The messages are stored in memory for demo purposes and reset when the server restarts.
> Swap the array in `src/app/api/messages/route.ts` for a real database (Postgres, SQLite,
> MongoDB, etc.) when you're ready to persist data.

Try it from the terminal while the dev server runs:

```bash
curl http://localhost:3002/api/health
curl -X POST http://localhost:3002/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello!"}'
```

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the dev server (hot reload)    |
| `npm run build` | Create an optimized production build |
| `npm run start` | Run the production server            |
| `npm run lint`  | Run ESLint                           |

## Deploy

The easiest way to deploy is [Vercel](https://vercel.com/new). See the
[Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other options.
