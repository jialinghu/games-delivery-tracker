# CLAUDE.md — Project Context for Claude Code

## What is this project?

Games Delivery Tracker — an internal project tracking tool for **Pacific Meta**, a company that develops Unity-based serious games (medical/training simulations). It tracks game development milestones across multiple clients (HKMU, SFU) with timeline, kanban, and list views.

## Tech Stack

- **Frontend**: React 18 + Vite (no Tailwind — all inline styles)
- **Design System**: IBM Carbon Design System (White theme + Gray 100 sidebar)
  - Typography: IBM Plex Sans + IBM Plex Mono + Noto Sans TC
  - Color tokens defined in `src/lib/tokens.js`
  - No `@carbon/react` package — Carbon patterns are implemented with inline styles
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Deployment**: Vercel (auto-deploys on push to `main`)
- **Routing**: React Router v6

## Project Structure

```
games-tracker/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json              ← SPA rewrites
├── supabase/
│   ├── schema.sql           ← DB schema (profiles, spaces, folders, tasks + RLS + triggers)
│   ├── seed.sql             ← HKMU + SFU seed data
│   └── functions/create-user/index.ts  ← Edge Function for admin user creation (not deployed yet)
└── src/
    ├── main.jsx             ← Entry: BrowserRouter + AuthProvider
    ├── App.jsx              ← Routes: /login, /admin, /* (tracker)
    ├── lib/
    │   ├── supabase.js      ← Supabase client (reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
    │   ├── auth.jsx         ← AuthProvider context (login, logout, session, profile, timeout protection)
    │   ├── db.js            ← CRUD functions for spaces, folders, tasks, profiles
    │   └── tokens.js        ← Carbon design tokens, status/phase config, delay helpers
    └── pages/
        ├── Login.jsx        ← Email/password login (Carbon styled)
        ├── Tracker.jsx      ← Main app: dark sidebar + 3 views (list/kanban/timeline) + task modal
        └── Admin.jsx        ← User management page (admin role only)
```

## Database Schema (Supabase)

```
profiles    — id (uuid, FK auth.users), display_name, role (admin/PM/Client)
spaces      — id, name, color (e.g. "HKMU", "SFU")
folders     — id, name, space_id (FK spaces) (e.g. "Tracheostomy", "NG Tube Insertion")
tasks       — id, title, space_id, folder_id, assignee, status, due_date, start_date, phase, duration, notes
```

- All tables have RLS enabled — authenticated users can read/write
- `profiles` auto-created via trigger when auth.users inserts
- Column names are **snake_case** (e.g. `due_date`, `space_id`, `folder_id`)

## Auth Flow

- Admin creates user accounts (no self-registration)
- Methods: Supabase Dashboard (Authentication > Users > Add User) or /admin page
- Login via email + password → Supabase Auth → session stored in localStorage
- Auth provider has 5-second timeout — if Supabase doesn't respond, clears bad session and shows login

## Current Deployment

- **Vercel**: https://games-delivery-tracker.vercel.app
- **GitHub**: https://github.com/jialinghu/games-delivery-tracker
- **Supabase project**: "games-tracker" under Pacific Meta Project org
- Push to `main` → Vercel auto-deploys

### Environment Variables (Vercel)

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...  ← MUST be legacy JWT key (eyJ prefix), NOT sb_publishable_
```

⚠️ `@supabase/supabase-js` v2 does NOT support `sb_publishable_` keys. Must use legacy `eyJ` anon key from Supabase Settings > API Keys > Legacy tab.

## Known Issues & TODO

### Critical (fix first)
1. **Data loading timeout** — Tracker.jsx `useEffect` that fetches spaces/folders/tasks does NOT have timeout protection yet. If Supabase is slow, page shows "Loading data…" forever. Need same timeout pattern as auth.jsx.
2. **Supabase connection intermittent** — Auth timeout fires sometimes, suggesting Supabase connection is flaky. May need to verify VITE_SUPABASE_URL is correct, or add retry logic.

### Functional TODO
3. **Login page** — Currently integrated. The owner wants login to be a completely separate page/system eventually (admin-managed accounts only).
4. **Dynamic Space/Folder creation** — UI exists in sidebar (+ New project, + Add folder) but needs to actually persist to Supabase.
5. **Task CRUD via Supabase** — Create/update/delete task functions exist in db.js but need testing. Currently tasks only load from seed data.
6. **Admin page** — /admin route exists with user creation form. Needs the `create-user` Edge Function deployed, OR admin creates users directly in Supabase Dashboard.

### UI/UX TODO
7. **Owner → Assignee rename** — Done in UI, but ensure consistency everywhere.
8. **IBM Carbon Design System** — Currently implemented with inline styles mimicking Carbon. Consider migrating to `@carbon/react` components for better consistency.
9. **Timeline view date range** — Currently hardcoded Sep 2025 to Apr 2027. Should auto-calculate from task dates.
10. **Responsive design** — Not yet addressed. Sidebar should collapse on mobile.

## Data Sources

The original data came from two CSV files:
- `Copy_of_Games_Delivery_Timeline_-_HKMU.csv` — 4 games: AOM, Tracheostomy, Mechanical Ventilation, GI Case
- `Copy_of_Games_Delivery_Timeline_-_SFU.csv` — 8 games: AOM, Accupuncture, Neurological, NG Tube, Muskoskeletal, Oropharyngeal Suctioning, Insulin Administration, AOM-IPMOE

This data is seeded via `supabase/seed.sql`.

## Design Decisions

- **No Tailwind** — All styling is inline React styles using Carbon design tokens from `tokens.js`
- **Snake_case DB columns** — Matches Supabase/Postgres convention. Frontend uses same snake_case (e.g. `task.due_date`, `task.space_id`)
- **Phases**: dev (Development), delivery (Delivery), post (Post-Delivery), launch (Launch)
- **Statuses**: todo, in-progress, review, done
- **Delay logic**: Derived at render time from `due_date` vs today. Overdue (red), Warning ≤7d (amber), On Track, Done.

## Git Workflow

```bash
# Push to deploy
git add .
git commit -m "description"
git push
# Vercel auto-deploys from main branch
```

Token is embedded in remote URL. If auth issues, re-generate PAT at github.com/settings/tokens.

## Quick Commands

```bash
# Local dev
npm install
npm run dev          # starts at localhost:5173

# Build check (always do this before push)
npm run build

# Deploy
git add . && git commit -m "msg" && git push
```
