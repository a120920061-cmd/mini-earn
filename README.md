# Mini Earn — ছোট কাজ, সহজ আয়

A minimal, modern, mobile-first Mini Jobs & Earn website built with Next.js 16, TypeScript, Tailwind CSS, and Prisma.

## 🚀 Deploy to Vercel + Turso (step-by-step)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Mini Earn — ready for deployment"

# Create a repo on GitHub, then push
git remote add origin https://github.com/YOUR_USERNAME/mini-earn.git
git branch -M main
git push -u origin main
```

### Step 2: Create a Turso Database

1. Sign up at **[turso.tech](https://turso.tech)** (free tier: 500 DBs, 9 GB)
2. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login
   ```
3. Create a database:
   ```bash
   turso db create mini-earn
   ```
4. Get your connection URL and auth token:
   ```bash
   # Get the database URL (libsql://...)
   turso db show mini-earn --url

   # Create an auth token
   turso db tokens create mini-earn
   ```
5. Push your Prisma schema to Turso:
   ```bash
   # Set env vars temporarily for the migration
   export DATABASE_URL="libsql://mini-earn-YOUR-ORG.turso.io"
   export TURSO_AUTH_TOKEN="your-token-here"

   # Push schema to Turso
   bunx prisma db push
   ```

### Step 3: Deploy on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub
2. Click **"Add New Project"** → select your `mini-earn` repo
3. Configure environment variables (Settings → Environment Variables):

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `libsql://mini-earn-YOUR-ORG.turso.io` |
   | `TURSO_AUTH_TOKEN` | `your-long-auth-token` |

4. Click **Deploy** — Vercel will:
   - Run `bun install`
   - Run `prisma generate && next build`
   - Deploy your app to a live URL

### Step 4: Seed the Database (first time only)

After deployment, run the seed once to create the admin user + default jobs:

```bash
# Set production env vars locally, then call the /api/auth/me endpoint
# (the seed runs automatically on first API call via ensureSeed())
```

Or manually via Turso shell:
```bash
turso db shell mini-earn
```

## 🔑 Default Admin Account

- **Email:** `admin@miniearn.com`
- **Password:** `admin123`
- _(Change this after first login via Settings → Change Password)_

## 🛠️ Local Development

```bash
# Install dependencies
bun install

# Push schema to local SQLite
bun run db:push

# Start dev server
bun run dev
```

Open `http://localhost:3000`

## 📦 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Prisma ORM + Turso (libsql)
- **Auth:** Custom scrypt-based sessions (httpOnly cookies)
- **PWA:** Service worker + manifest (installable)
- **i18n:** Bangla (default) + English

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router (pages + API routes)
│   ├── api/          # REST API endpoints
│   └── layout.tsx    # Root layout (fonts, theme, PWA)
├── components/       # React components
│   ├── admin/        # Admin panel views
│   ├── auth/         # Login/Register
│   ├── dashboard/    # Dashboard widgets
│   ├── jobs/         # Job cards, lists, details
│   ├── layout/       # App shell, nav, PWA
│   ├── profile/      # Profile, badges, share
│   └── ui/           # shadcn/ui components
├── lib/              # Utilities (auth, db, api, i18n)
├── store/            # Zustand state
└── hooks/            # Custom hooks
```

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | `file:./db/custom.db` (local) or `libsql://...` (Turso) | ✅ |
| `TURSO_AUTH_TOKEN` | Turso auth token (only for Turso) | Turso only |
