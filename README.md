# Games Delivery Tracker

Internal project tracking tool for Pacific Meta game development delivery timelines. Built with React + Supabase + IBM Carbon Design System.

---

## Architecture

```
Frontend:  React + Vite → Vercel
Backend:   Supabase (Auth + Postgres + Edge Functions)
Auth:      Admin-managed accounts (email/password)
```

---

## Deployment Guide

### Step 1: Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name (e.g. `games-tracker`) and set a DB password
3. Wait for the project to spin up (~2 min)

### Step 2: Run database schema

1. In Supabase Dashboard → **SQL Editor**
2. Copy-paste the contents of `supabase/schema.sql` → Run
3. Copy-paste the contents of `supabase/seed.sql` → Run

### Step 3: Create your first admin user

1. In Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Enter your email + password, check **Auto Confirm**
3. Go to **Table Editor** → `profiles` table
4. Find your user row → change `role` from `PM` to `admin`

### Step 4: Get API keys

1. Go to **Settings** → **API**
2. Copy:
   - `Project URL` → this is your `VITE_SUPABASE_URL`
   - `anon public` key → this is your `VITE_SUPABASE_ANON_KEY`

### Step 5: Deploy to Vercel

**Option A: Via GitHub (recommended)**

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. In **Environment Variables**, add:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOi...
   ```
5. Click **Deploy**

**Option B: Via Vercel CLI**

```bash
npm i -g vercel
cd games-tracker
vercel
# Follow prompts, then:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

### Step 6 (Optional): Deploy Edge Function for admin user creation

If you want admins to create users from the app UI:

```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy create-user
```

Without this, admins can still create users directly in the Supabase Dashboard.

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel | Supabase anonymous/public key |

---

## Project Structure

```
games-tracker/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── supabase/
│   ├── schema.sql          ← Run this first in SQL Editor
│   ├── seed.sql            ← Seed data (HKMU + SFU games)
│   └── functions/
│       └── create-user/    ← Edge Function (optional)
└── src/
    ├── main.jsx
    ├── App.jsx             ← Router + auth gate
    ├── lib/
    │   ├── supabase.js     ← Supabase client
    │   ├── auth.jsx        ← Auth context/provider
    │   ├── db.js           ← Database CRUD operations
    │   └── tokens.js       ← Carbon design tokens + helpers
    └── pages/
        ├── Login.jsx       ← Login form
        ├── Tracker.jsx     ← Main tracker (sidebar, views, modal)
        └── Admin.jsx       ← User management (admin only)
```

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your Supabase credentials
npm install
npm run dev
```

---

## Adding Users

**As Admin (in-app):**
Navigate to `/admin` → Create user form

**Via Supabase Dashboard:**
Authentication → Users → Add User → then edit role in Table Editor → profiles
# games-delivery-tracker
# games-delivery-tracker
