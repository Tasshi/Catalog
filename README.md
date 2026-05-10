# React Boilerplate

A scaffolded **React + Vite + TypeScript** starter for trainees, using TailwindCSS, shadcn/ui, TanStack Query, React Hook Form, Zod, React Router, and Supabase.

The app lives in [`react-template/`](./react-template). For you, go to desktop and clone this repo there. Make sure after you clone it, rename it to your specific project name. Conventions and architecture decisions are documented in [`STRUCTURE.md`](./STRUCTURE.md) — read it before adding code.

## Getting started

```bash
git clone <this-repo>
-- Rename the cloned repo to your project name --
cd <your-project-name>
npm install
cp .env.example .env
# fill in your Supabase keys (see below)
npm run dev
```

The app runs at [http://localhost:5173](http://localhost:5173).

## Supabase keys

Create a project at [supabase.com](https://supabase.com) and copy the URL + anon key into `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Google OAuth, configure it in the Supabase dashboard under **Authentication → Providers → Google** — no extra env vars needed.

Once you've defined tables, regenerate `src/types/database.ts`:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

## Scripts

Run from inside `react-boilerplate/`:

| Command           | What it does                  |
| ----------------- | ----------------------------- |
| `npm run dev`     | Vite dev server with HMR      |
| `npm run build`   | Type-check + production build |
| `npm run preview` | Preview the production build  |
| `npm run lint`    | ESLint over the project       |
| `npm run format`  | Prettier over the project     |

Husky + lint-staged run ESLint and Prettier on staged files at commit time.

## What's included

- **`features/auth/`** — Supabase auth as TanStack Query hooks (sign in/up, Google OAuth, session, sign out). UI is up to you; build it on top of these hooks.
- **`features/posts/`** — Reference feature against the JSONPlaceholder public API. Mirror its layout when adding your own features.
- **`/`**, **`/login`**, **`/posts`**, **`/posts/:id`** — Working pages, ready to extend.

## Where things go

See **[`STRUCTURE.md`](./STRUCTURE.md)** for the full guide: feature-module anatomy, the "where does this go?" cheat sheet, naming conventions, the no-barrels rule, and the decision flow for new code.
