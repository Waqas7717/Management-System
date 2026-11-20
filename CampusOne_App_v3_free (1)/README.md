# FG Campus (React + MUI)

School management portal for F.G Public School and College: Admin, Principal, Teacher and Parent portals.

Stack: Vite, React 18 (JavaScript), Material UI, Supabase (Postgres, Auth), Vercel serverless functions in `api/`.

## Run locally

    npm install
    npm run dev          # http://localhost:5173
    npm run dev -- --open "/?demo=1"   # built-in sample data, no backend

`?demo=1` in the URL, or `VITE_FORCE_DEMO=1`, runs the app on sample data without a database.

## Environment variables

Frontend (optional, defaults to the public FG Campus project): see `.env.example`.
Vercel server functions (already set on your Vercel project, nothing to change):
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_DOMAIN`, `DEMO_LOGIN`.

## Folders

- `src/core`   data, dates, sync with Supabase, store (no UI)
- `src/ui`     shared components (fields, cards, charts, dialogs)
- `src/screens` one file per portal (`admin`, `principal`, `teacher`, `parent`)
- `api/`       `admin.js` (create/update/delete users) and `demo.js` (one-click demo login)
- `supabase/`  SQL schema and updates (already applied to the live database)

## Deploy

Vercel detects Vite automatically (build `npm run build`, output `dist`). Every branch gets its own preview URL; `main` is the live site.
