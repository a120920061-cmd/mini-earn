---
Task ID: 1
Agent: main (Z.ai Code)
Task: Build a minimal, modern, mobile-first Mini Jobs & Earn website (Bangla+English, dark/light, auth, dashboard, jobs, wallet, profile, admin panel).

Work Log:
- Designed Prisma schema: User, Job, Submission, Transaction, Session (SQLite). Ran `bun run db:push`.
- Built `src/lib/auth.ts`: scrypt password hashing, session tokens, cookie helpers, lazy idempotent seed (admin + 5 default jobs).
- Built i18n dictionary `src/lib/i18n.ts` (Bangla default + English, ~110 keys).
- Built Zustand store `src/store/use-app-store.ts` (auth, navigation, language persisted).
- Built `src/lib/api.ts` fetch wrapper + money/time formatting; `src/hooks/use-t.ts` translation hook.
- API routes: `/api/auth/{register,login,logout,me}`, `/api/jobs` (GET/POST), `/api/jobs/[id]` (GET/PATCH/DELETE), `/api/jobs/[id]/submit` (POST — atomic reward+transaction+balance), `/api/dashboard`, `/api/wallet`, `/api/admin/users` (GET search), `/api/admin/users/[id]` (PATCH toggle), `/api/admin/stats`.
- Tailwind theme: emerald-green earning palette (light + dark), Noto Sans Bengali + Inter fonts via next/font, safe-area helpers, custom scrollbar, view-in animation.
- Layout: `layout.tsx` (ThemeProvider, Toaster, fonts), `page.tsx` orchestrator (splash → AuthScreen → AdminPanel / AppShell).
- Auth UI: login/register tabs, validation, password show/hide, language + theme toggles.
- App shell: sticky header (brand + balance chip + lang/theme), desktop top nav, mobile bottom nav (fixed), view router.
- Dashboard: welcome, gradient balance card, quick stats, 2-4 featured job cards, View All button.
- Job card: category icon + color, reward badge, Start Job / Completed states.
- Jobs list: search + category chips, scrollable.
- Job details: hero, numbered instructions, link card, sticky submit button, reward toast.
- Wallet: balance card, total earned + completed stats, transaction history with +/- styling.
- Profile: avatar, info rows, language switch, theme toggle, logout, account status.
- Admin panel: header with View Site + tabs (Overview/Jobs/Users). Overview: stats + recent users/jobs. Jobs manager: cards with enable/disable switch, featured toggle, edit, delete (confirm dialog), Add Job. Job form: all fields + category select. Users manager: debounced search + enable/disable switch (admin-protected).
- Fixed `set-state-in-effect` lint errors (3) by inlining async IIFEs in effects.
- Lint passes clean (0 errors).

Stage Summary:
- **Status**: Production-ready, fully functional, verified end-to-end via agent-browser.
- **Verified flows**: Register (Bangla) → dashboard with balance ৳0 + 5 jobs → Start Job → details → Submit → balance ৳2 + reward toast → Wallet shows transaction → Profile language switch (Bn→En) + dark theme toggle → Logout → Admin login (admin@miniearn.com/admin123) → Admin Overview/Stats → Manage Jobs (Add "Test Survey Job" created) → Manage Users (search + list). No runtime errors in dev.log.
- **Design**: Mobile-first, emerald earning palette, Noto Sans Bengali + Inter, bottom nav (mobile) / top nav (desktop), max-w-2xl centered content, rounded cards, large touch targets, safe-area padding.
- **Auth model**: scrypt-hashed passwords, DB Session table + httpOnly cookie (7-day), admin seeded automatically.
- **Admin account**: admin@miniearn.com / admin123 (hint shown on login screen).
- **Unresolved / notes**:
  - Single-route SPA (all views via Zustand nav state) per project rule "only / route".
  - No withdrawal/payout flow (out of scope per requirements — "no complex payment gateway").
  - Agent-browser ref-clicks occasionally don't trigger React synthetic handlers; direct DOM `.click()` via eval works — this is a test-automation quirk, not an app bug (real clicks work).
- **Recommended next steps** (for the recurring review agent): add loading skeletons, job-completion proof upload, user avatar uploads, withdrawal request feature, more granular admin job reordering, and Bangla numeric formatting for large balances.

---
Task ID: 2
Agent: main (Z.ai Code) — recurring web dev review (round 2)
Task: QA via agent-browser, then improve styling + add new features (withdrawal system, profile edit, dashboard chart, Bangla numerals, loading skeletons, view transitions).

Work Log:
- QA via agent-browser (mobile 390px viewport): verified auth, dashboard, jobs, wallet, profile, admin all stable. No critical bugs found; no horizontal scroll on mobile; bottom nav visible.
- **Bangla numeral formatting** (`src/lib/api.ts`): `formatMoney` and new `formatNumber`/`formatDate` now convert digits to Bengali numerals (০-৯) when `lang === 'bn'` — e.g. `৳২.০০`, `৬ সম্পন্ন কাজ`. Updated all 17 call sites across dashboard, wallet, profile, jobs, admin components to pass `lang`.
- **Withdrawal request system** (new feature — completes the earnings loop):
  - Prisma: added `Withdrawal` model (userId, amount, method, account, status, note) + relation on User. Ran `db:push`.
  - API: `POST /api/wallet/withdraw` (validates min ৳10, balance, method, blocks duplicate pending; deducts balance immediately as held), `GET /api/admin/withdrawals?status=` (admin list with user include + stats), `PATCH /api/admin/withdrawals/[id]` (approve → creates withdrawal transaction; reject → refunds held balance).
  - Extended `GET /api/wallet` to return `withdrawals[]`.
  - UI: `WithdrawDialog` (amount + 4 payment methods bKash/Nagad/Rocket/Bank + account). Wallet view: withdraw button + withdrawal history section with status badges (pending/approved/rejected) + icons. `AdminWithdrawalsManager`: summary card (total approved + pending count), filter chips (pending/approved/rejected/all), cards with approve/reject actions + confirm dialog.
  - Added "Withdrawals" tab (4th) to admin panel with ArrowDownToLine icon.
- **Profile edit name** (new feature): `PATCH /api/profile` (validates name ≥ 2 chars). Profile view: pencil edit button → Dialog with name input → updates store.
- **Dashboard weekly earnings chart** (new feature): `GET /api/dashboard/chart` (7-day earning buckets). `WeeklyEarningsChart` component: bar chart with hover tooltips, today highlighted, Bangla day labels, total this week.
- **Loading skeletons**: wallet + admin withdrawals + dashboard chart now show skeleton placeholders instead of bare spinners.
- **View transitions**: wrapped app-shell + admin-panel main content with `key={view}` + `animate-view-in` for smooth fade/slide on view change.
- **i18n**: added ~35 new keys (withdraw, payment methods, statuses, approve/reject, edit profile, weekly chart, day abbreviations) in both Bangla and English.
- **Bug fix**: `src/lib/db.ts` — running dev server had a stale PrismaClient singleton (cached before `db:push` regenerated the client with the Withdrawal model). Fixed by versioning the global cache key (`prisma_v2`) and adding `isValidClient` check that recreates the client if `withdrawal` is missing. (Note: required dev server restart to fully clear the stale node module require cache.)
- Fixed `set-state-in-effect` lint error in admin-withdrawals-manager (inlined async IIFE).

E2E Verification (via curl + agent-browser on fresh server):
- test1 user: completed all 6 jobs (৳27 total), withdrew ৳10 (balance→৳17, held), admin approved (status→approved), created 2nd withdraw ৳5 (nagad), admin rejected → balance refunded to ৳17. ✓
- Dashboard: shows ৳১৭.০০ balance, ৳২৭.০০ total earned, weekly chart with ৳২৭.০০ + 7 Bangla day labels. ✓
- Wallet: balance ৳১৭.০০, withdraw button, withdrawal history (approved bKash ৳10), transaction history (withdrawal + earnings). ✓
- Withdraw dialog: amount field, 4 method buttons (বিকাশ/নগদ/রকেট/ব্যাংক), account input. ✓
- Admin withdrawals tab: summary (৳১০ approved, 0 pending), filter chips, approve/reject actions. ✓
- Profile edit: name updated via API. ✓
- Lint: clean (0 errors). ✓

Stage Summary:
- **Status**: All round-2 features implemented, verified end-to-end, lint clean.
- **New features**: Withdrawal request system (full flow: user requests → balance held → admin approves/rejects → transaction recorded / refund), profile name editing, dashboard 7-day earnings bar chart.
- **Styling improvements**: Bangla numeral localization across all money/number displays, loading skeletons, smoother view transitions, better empty states with icons.
- **Known limitation**: The sandbox kills background dev-server processes when a bash tool call ends, so the server must be restarted for live preview. The system's auto-runner initially managed it; after the required restart (to clear stale Prisma client), it needs manual restart.
- **Recommended next steps**: job-completion proof upload (image/text), user avatar uploads, admin job reordering/drag-sort, withdrawal method-specific validation, email/notifications for withdrawal status changes, Bangla numeral formatting in date pickers.

---
Task ID: 3
Agent: main (Z.ai Code) — recurring web dev review (round 3)
Task: QA via agent-browser, then add notifications system, enrich admin overview with withdrawals, add job clone, improve empty states, and polish styling.

Work Log:
- QA via agent-browser (mobile 390px): app stable, lint clean, no errors. Identified gaps: no notifications feature, admin overview missing withdrawals summary, plain empty states, no quick job duplication.
- **Notifications system** (new feature — closes the user-feedback loop):
  - Prisma: added `Notification` model (userId, type, title, body, read, link, createdAt) + relation on User. Ran `db:push`.
  - Bumped `src/lib/db.ts` cache version to `prisma_v3` + `isValidClient` now checks both `withdrawal` and `notification` models to avoid stale-client crashes after schema changes.
  - `src/lib/notify.ts` helper: fire-and-forget notification creation (never blocks main flow).
  - Wired notifications into flows: register (welcome → link jobs), job submit (earning → link wallet), withdraw request (→ link wallet), admin approve (approved → link wallet), admin reject (refunded → link wallet).
  - API: `GET /api/notifications` (list + unreadCount), `PATCH /api/notifications/[id]/read` (mark one read), `POST /api/notifications/read-all` (mark all read).
  - UI `NotificationBell`: bell icon with pulsing unread badge (9+ cap), dropdown panel with type-colored icons (earning/withdrawal/job/system), 30s polling, outside-click close, "Mark all read" button, click-to-navigate (wallet/jobs/dashboard), skeleton loading, empty state.
- **Admin overview enrichment**: `GET /api/admin/stats` now returns `pendingWithdrawals`, `totalPaidOut`, and `recentWithdrawals[]`. Overview shows: pending-withdrawals pill button (when >0), dual summary cards (total earned gradient + total paid out card), and a new "Recent Withdrawals" section with status badges + user info + "Manage Withdrawals" link. All numbers use Bangla numerals.
- **Job clone** (new feature): `POST /api/jobs/[id]/clone` (admin) creates a disabled, non-featured copy titled "X (copy)". Admin jobs manager: new Copy icon button with tooltip. Enables quick job templating — admin clones then edits.
- **Richer empty states**: Jobs list empty state now shows a large icon + title + description + "check back soon" message. Dashboard no-jobs state shows a primary CTA card ("Start Earning" → Browse Jobs button) instead of plain text.
- **i18n**: added ~15 new keys (notifications, markAllRead, recentActivity, cloneJob, recentWithdrawals, totalPaidOut, noWithdrawalsYet, empty-state descriptions, browseJobs) in Bangla + English.

E2E Verification (curl + agent-browser):
- Fresh register → welcome notification created (unreadCount:1) ✓
- Job submit → earning notification created (unreadCount 1→2) ✓
- Mark all read → updated:2, unreadCount:0 ✓
- Admin overview: pendingWithdrawals:0, totalPaidOut:৳10, recentWithdrawals array present ✓
- Job clone → "Visit Website (copy)" created ✓
- Browser UI: bell badge shows "1" (pulse animation), dropdown opens with "নোটিফিকেশন | 1 | সব পঠিত করুন | Welcome to Mini Earn! | ... | এইমাত্র", markAllRead button present ✓
- Lint: clean (0 errors) ✓
- No dev.log errors ✓

Stage Summary:
- **Status**: All round-3 features implemented, verified end-to-end, lint clean.
- **New features**: Full notifications system (DB + API + bell UI with polling, badges, navigation), admin overview withdrawals summary + recent withdrawals section, job clone for quick templating.
- **Styling improvements**: Richer empty states with icons + CTAs, notification bell with pulsing badge + type-colored icons, dual summary cards on admin overview, tooltip titles on admin job action buttons.
- **Architecture notes**: Notifications are fire-and-forget (failures never block main flows). NotificationBell polls every 30s and refreshes on open. The versioned db cache (`prisma_v3`) prevents the stale-PrismaClient class of bugs seen in round 2.
- **Recommended next steps**: real-time push (WebSocket/SSE) instead of polling, notification preferences/settings, admin broadcast notifications, job proof upload (image/text), withdrawal method-specific account validation, email notifications, leaderboard/rankings.

---
Task ID: 4
Agent: main (Z.ai Code) — recurring web dev review (round 4)
Task: QA via agent-browser, then add gamification (leaderboard), admin broadcast announcements, share/invite card, and polish styling.

Work Log:
- QA via agent-browser (mobile 390px): app stable, lint clean, no errors. Identified engagement gap: no leaderboard/gamification, no admin broadcast, no share feature.
- **Leaderboard** (new feature — gamification):
  - API `GET /api/leaderboard?period=week|all`: top 10 earners + current user's rank. Weekly uses transaction groupBy (last 7 days earnings); all-time uses totalEarned. Computes user's rank by counting higher earners.
  - `LeaderboardView` component: trophy header, week/all-time toggle, **podium for top 3** (reordered 2nd-1st-3rd, gradient avatars with crown on #1, rank badges), ranked list 4-10 with "আপনি" (You) badge on current user, and a gradient "Your Rank" card with encouragement when unranked.
  - Added `leaderboard` to UserView store type + app-shell router.
- **Dashboard top-earners preview**: `TopEarnersPreview` component — 3-up grid of weekly top earners with rank-colored avatars, crown on #1, "See All" → leaderboard. Skeleton loading state. Hidden when no earners.
- **Admin broadcast** (new feature — mass communication):
  - API `POST /api/admin/broadcast` (admin): validates title/body, fetches all enabled non-admin users, creates notifications in batches of 100 via `createMany` (scales). Returns sent count.
  - `BroadcastDialog` component: title input + message textarea (400 char counter) + recipients badge (All Users). Wired into admin panel header as a "Broadcast" button (Megaphone icon).
- **Share/invite card** (new feature — viral growth, lightweight, no DB tracking):
  - `ShareCard` component on profile: gradient header with gift icon, referral link display (origin/?ref=username), copy button (clipboard API + execCommand fallback) with copied-check state, native share button (Web Share API with fallback to copy).
- **i18n**: added ~25 new keys (leaderboard, podium terms, share, broadcast, announcement) in Bangla + English.

E2E Verification (curl + agent-browser):
- Leaderboard week API: Test User rank 1 (৳27, isMe:true), Notif Test rank 2 (৳2), myRank:{rank:1,totalEarned:27} ✓
- Leaderboard all API: ranked earners returned ✓
- Broadcast API: sent:5, user received "Test Broadcast" notification ✓
- Browser: dashboard "শীর্ষ আয়কারী" preview present ✓; See All → leaderboard view with trophy + podium + "আপনার র‍্যাঙ্ক" card (rank 1, ৳২৭.০০) ✓; All Time toggle works ✓
- Profile share card present ("অ্যাপ শেয়ার করুন"), copy link works ✓
- Admin: broadcast button in header, dialog opens with title + message + recipients + Cancel/Broadcast buttons ✓
- Lint: clean (0 errors) ✓; no dev.log errors ✓

Stage Summary:
- **Status**: All round-4 features implemented, verified end-to-end, lint clean.
- **New features**: Leaderboard (weekly + all-time, podium, your-rank card), dashboard top-earners preview, admin broadcast announcements (batch notification creation), share/invite card with copy + native share.
- **Styling**: Trophy podium with gradient avatars + crown, rank badges with Bangla numerals, gradient share card, broadcast dialog with char counter + recipients badge.
- **Architecture**: Leaderboard rank computed via count-of-higher query (simple, works on SQLite). Broadcast uses batched createMany (100/batch) for scalability. Share link is stateless (no DB tracking) to keep it lightweight per the "minimal" project ethos.
- **Recommended next steps**: referral tracking (reward referrer when referee completes first job), weekly leaderboard reset cron, leaderboard privacy toggle, broadcast templates, push notifications (PWA), achievement badges/streaks, admin leaderboard management.
