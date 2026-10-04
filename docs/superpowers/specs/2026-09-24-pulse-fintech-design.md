# Pulse: Fintech Simulator (Design Spec)

**Date:** 2026-09-24
**Status:** Approved in brainstorming, pending written review

## 1. Purpose

Pulse is a **portfolio project**: a simulated personal finance app for young adults (Gen Z). Users record payments, expenses and account balances by hand, and they see them through interactive D3 charts, filterable tables and a playful, polished UI.

The things that matter most, in order: a strong first impression (onboarding plus a one-click demo), chart and animation polish, and clean code that is easy to read.

**Success criteria**
- A reviewer who opens the live link reaches a fully populated dashboard in one click ("Try demo").
- A new user completes welcome, register, setup and the guided tour, then adds transactions and sees the charts, KPIs and tables update.
- It works well at 375px, 768px and 1280px widths, with no horizontal scroll.
- `npm run test` and `npm run build` pass. The app is deployed on Vercel, and the README has screenshots and the live link.

## 2. Constraints

- **React + TypeScript**, built with **Vite**.
- **D3.js** draws every chart. React owns the `<svg>`, and D3 handles the scales, shapes, axes and transitions inside `useEffect`.
- **No CSS libraries.** Styling is plain CSS with custom properties plus CSS Modules.
- Runtime dependencies are limited to `react`, `react-dom`, `react-router-dom` and `d3`. The only dev test tool is `vitest`.
- **Browser-only.** There is no backend. Auth and data are stored in localStorage, and the UI states clearly that this is a simulation.
- English UI.

## 3. Out of scope

- Real bank connections, notifications, currency conversion between currencies, i18n, and real security.
- Goals beyond create, fund and delete.

## 4. Architecture

```
src/
  main.tsx, App.tsx          router + providers + layout
  types.ts                   domain types
  lib/finance.ts             pure selectors
  lib/filters.ts             pure filter/sort/paginate + URL params <-> Filters
  lib/format.ts              Intl currency/date/percent formatting
  lib/crypto.ts              salted SHA-256 via Web Crypto
  data/seed.ts               deterministic demo data (seeded PRNG)
  data/storage.ts            the ONLY module touching localStorage; versioned payloads
  state/AuthContext.tsx      register / login / demoLogin / logout / session
  state/FinanceContext.tsx   useReducer store, persists after every change
  charts/                    useChartSize, LineChart, BarChart, DonutChart, Sparkline, ProgressRing, Tooltip
  components/                Layout, Sidebar, BottomNav, TopBar, Card, KpiTile, Modal, Sheet, Button,
                             Field, Select, Badge, TransactionTable, FilterBar, EmptyState, Toast, ErrorBoundary
  onboarding/                WelcomeCarousel, SetupWizard, GuidedTour, tourSteps.ts
  pages/                     Login, Register, Dashboard, Transactions, Accounts, Payments, Goals, Settings
  styles/tokens.css, styles/global.css, **/*.module.css
```

### 4.1 Domain types

```ts
type ID = string;
type Currency = 'USD' | 'EUR' | 'COP' | 'MXN' | 'GBP';
type TxType = 'income' | 'expense' | 'transfer';
type CategoryId = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills'
  | 'health' | 'education' | 'travel' | 'salary' | 'other';

interface User { id: ID; email: string; name: string; salt: string; passwordHash: string; createdAt: string; }
interface Profile { nickname: string; avatar: string; currency: Currency; theme: 'dark' | 'light'; }
interface Onboarding { setupDone: boolean; tourDone: boolean; }
interface Account { id: ID; name: string; kind: 'checking' | 'savings' | 'credit'; openingBalance: number; color: string; }
interface Transaction {
  id: ID; date: string /* YYYY-MM-DD */; description: string; amount: number /* always > 0 */;
  type: TxType; category: CategoryId; accountId: ID;
  transferId?: ID;           /* both legs of a transfer share this */
  direction?: 'in' | 'out';  /* required when type === 'transfer' */
}
interface Payment {
  id: ID; name: string; amount: number; category: CategoryId; accountId: ID;
  dueDate: string; recurrence: 'none' | 'monthly' | 'yearly'; lastPaidDate?: string;
}
interface Goal { id: ID; name: string; emoji: string; target: number; saved: number; deadline?: string; }
interface FinanceData {
  version: 1; profile: Profile; onboarding: Onboarding;
  accounts: Account[]; transactions: Transaction[]; payments: Payment[]; goals: Goal[];
}
```

- **Account balance** = `openingBalance` + incomes − expenses + transfers `in` − transfers `out`. A transfer is two transactions that share a `transferId`: an `out` leg on the source account and an `in` leg on the destination account. Transfers are left out of income and expense totals and out of the category breakdown.
- Credit accounts may go negative.

### 4.2 Storage (`data/storage.ts`)

- Keys: `pulse.users` (User[]), `pulse.session` (`{ userId }`), `pulse.data.<userId>` (FinanceData), `pulse.welcomeSeen` (boolean).
- Every read goes through `JSON.parse` inside try/catch, then a version check. If the data is corrupt or the version is unknown, the module returns `null`. The caller then falls back to defaults and shows a toast saying "We couldn't read your saved data, so we started fresh."

### 4.3 Auth (`state/AuthContext.tsx`)

- `register(name, email, password)`:
  - The email is unique (case-insensitive) and the password has at least 8 characters.
  - It creates a salt and hash, creates an empty `FinanceData` with `setupDone: false`, and starts the session.
- `login(email, password)`: on failure it shows the generic "Email or password is incorrect".
- `demoLogin()`: it creates or reuses the `demo@pulse.app` user, resets its data to the seed (`setupDone: true, tourDone: false`), and starts the session.
- `logout()` clears the session.
- `<ProtectedRoute>` handles routing:
  - With no session, it redirects to `/welcome` if `welcomeSeen` is false, or to `/login` otherwise.
  - With a session but `!setupDone`, it redirects to `/setup`.

### 4.4 Finance store (`state/FinanceContext.tsx`)

- Reducer actions:
  - Transactions: `addTx`, `editTx`, `deleteTx`, `transfer` (creates both legs). Transfers can't be edited; deleting either leg deletes both.
  - Payments: `addPayment`, `editPayment`, `deletePayment`, `payBill` (creates an expense tx dated today and sets `lastPaidDate`; for recurring bills it advances `dueDate` by one period).
  - Accounts: `addAccount`, `editAccount`, `deleteAccount` (blocked while the account has transactions).
  - Goals: `addGoal`, `fundGoal` (increases `saved`, capped at `target`), `deleteGoal`.
  - Profile and onboarding: `setProfile`, `setOnboarding`.
  - Data: `loadSeed`, `reset`.
- The store saves after every state change.

### 4.5 Selectors (`lib/finance.ts`)

All selectors are pure functions of `(data, now)`:
- `accountBalance`
- `totalBalance`
- `monthTotals(month)` → `{ income, expense }`
- `monthlySeries(nMonths)` → `[{ month, income, expense }]`
- `balanceSeries(days)` → daily running total
- `categoryBreakdown(range)` → `[{ category, total }]`, sorted in descending order
- `savingsRate(month)`
- `paymentStatus(payment, today)` → `'paid' | 'upcoming' | 'overdue'`. A non-recurring bill with `lastPaidDate` is `paid`. Otherwise `dueDate < today` → `overdue`. Otherwise `lastPaidDate` in the current calendar month → `paid`. Otherwise `upcoming`.
- `insights` → up to 3 chips comparing this month with last month by category.
- Month comparisons (KPI deltas, insights) compare month-to-date against the same number of days last month.

### 4.6 Filters (`lib/filters.ts`)

```ts
interface Filters {
  q?: string; from?: string; to?: string; preset?: '7d' | '30d' | '90d' | 'all';
  types?: TxType[]; categories?: CategoryId[]; accountId?: ID; min?: number; max?: number;
  sort: { key: 'date' | 'description' | 'category' | 'account' | 'amount'; dir: 'asc' | 'desc' };
  page: number; pageSize: number;
}
```

- The functions are `applyFilters(txs, f, now)`, `sortTxs`, `paginate`, `filtersToParams` and `paramsFromFilters`. The URL round-trip must be lossless for every field.
- The default filter is `preset: '30d'`, sorted by date descending, with 10 rows per page.

### 4.7 Charts (`charts/`)

- `useChartSize(ref)` uses a ResizeObserver and returns `{ width, height }`.
- Each chart takes `data` and does its drawing with D3 transitions (about 600ms, skipped when `prefers-reduced-motion` is set).
- Colors are read from the CSS variables, so charts follow the theme.
- Each chart has a hover or touch tooltip and an `aria-label` summary.
- The charts:
  - `LineChart`: an area plus line of the balance over time, with a crosshair tooltip.
  - `BarChart`: income vs expenses by month as grouped bars over 6 months.
  - `DonutChart`: spending by category, with the total in the center and a legend.
  - `Sparkline`: a small balance trend line on each account card.
  - `ProgressRing`: the progress arc on each goal.

## 5. UX

### 5.1 Routes

- Public: `/welcome`, `/login`, `/register`.
- Protected: `/setup`, `/` (Dashboard), `/transactions`, `/accounts`, `/payments`, `/goals`, `/settings`.

### 5.2 First-run flow

1. **WelcomeCarousel**, 4 slides:
   - "Track every coin 💸"
   - "See where it goes 📊", with an animated mini DonutChart
   - "Never miss a bill ⏰"
   - "Crush your goals 🎯"
   - It supports swipe, arrow keys and dots.
   - Every slide has Skip and "Try demo", and the last slide adds "Create account".
   - Viewing it sets `welcomeSeen`.
2. **Register:** name, email and password, with a strength meter (weak / ok / strong by length and character classes).
3. **SetupWizard**, 3 steps with a progress bar:
   1. Nickname and avatar emoji, picked from a grid of 12.
   2. Currency.
   3. "Start fresh" (1–3 accounts with a name, kind and opening balance) or "Load sample data".
   - Finishing sets `setupDone`.
4. **GuidedTour** on the first dashboard visit when `!tourDone`:
   - A dimmed overlay with a spotlight cut-out around the target element, found by `data-tour` attribute, and a positioned bubble.
   - 5 steps: balance, charts, quick-add, navigation, profile.
   - Next, Back and Skip controls, plus Esc to close. Finishing or skipping sets `tourDone`.
- **Settings has "Replay intro"**, which resets `tourDone` and opens `/welcome`.

### 5.3 Pages

- **Dashboard:**
  - A greeting that uses the nickname and avatar.
  - KPI tiles for total balance (count-up animation), month income, month expenses and savings rate.
  - Insight chips.
  - The LineChart, BarChart and DonutChart.
  - The 5 most recent transactions and the next 3 bills.
- **Transactions:**
  - The FilterBar, which is inline on desktop and a slide-up Sheet on mobile.
  - A sortable table on desktop and stacked cards on mobile, with pagination.
  - Add and edit in a Modal, and delete with a confirmation.
  - "Export CSV" of the filtered rows, using a Blob download.
  - An empty state when no rows match.
- **Accounts:** account cards with the balance, a Sparkline covering 30 days and the kind badge. Add and edit accounts, plus a Transfer modal.
- **Payments:** bills listed with a status Badge, "Mark as paid", and add, edit and delete.
- **Goals:** goal cards with a ProgressRing, "Add money" and "Delete". Reaching 100% triggers a confetti-style CSS burst.
- **Settings:**
  - Profile (nickname, avatar), currency and a theme toggle.
  - Replay intro, "Reset to sample data", "Clear my data" (with a confirmation) and Log out.

### 5.4 Layout and responsiveness

- **Below 768px:** a TopBar and a BottomNav (Home, Transactions, a floating "+" quick-add, Payments, More). "More" links to Accounts, Goals and Settings. Content is a single column.
- **768px and up:** a Sidebar (collapsible) and a 2-column grid.
- **1200px and up:** a 3-column dashboard grid.

### 5.5 Visual tone

- Dark theme by default: ink `#0E0E1A`, surface `#171728`, violet `#7C5CFF`, lime `#C6F432` and pink `#FF5CA8`. The light theme overrides these tokens under `[data-theme="light"]`.
- 20px card radius, soft glow shadows and gradient hero cards.
- Fonts: Space Grotesk for headings and numbers, Inter for body text.
- Emoji category icons.
- Casual, encouraging copy.
- The final tokens are confirmed on the Superdesign canvas before implementation and written to `styles/tokens.css`.

## 6. Error handling

- Corrupt or unknown storage falls back to defaults with a Toast.
- Inline form validation: amount > 0, required fields, and a date no more than 1 year in the future.
- Auth errors are generic.
- An `ErrorBoundary` around the page outlet shows a friendly card with "Reload".

## 7. Seed data (`data/seed.ts`)

- A seeded PRNG (mulberry32) keeps the data deterministic for a given `now`.
- Accounts: Checking ($2,400 opening), Savings ($5,000) and Credit ($0).
- Transactions: 6 months, with a monthly salary, rent, subscriptions, and random daily food, transport, shopping and entertainment spending. There are 2 transfers per month from checking to savings.
- Payments: Rent, Spotify, Netflix, Phone, Gym and Internet, with a mix of paid, upcoming and 1 overdue.
- Goals: "New laptop 💻" (40%) and "Trip to Japan 🗾" (15%).

## 8. Testing

- **Vitest unit tests:**
  - `finance.ts`: every selector, including transfers netting to zero across accounts and payment status edge cases.
  - `filters.ts`: each filter, sorting, pagination and the URL round-trip.
  - The reducer: each action, the transfer pair and `payBill` on a recurring bill.
  - `seed.ts`: determinism, and seeded balances equal the selector totals.
  - `crypto.ts`: hashing is deterministic and the salt changes the hash.
  - `storage.ts`: corrupt JSON returns null.
- **Build:** `tsc` plus `vite build` with zero errors.
- **Manual browser check:**
  - The first-run flow and the demo flow.
  - CRUD updates the charts.
  - Filters survive a reload.
  - CSV export and the theme toggle.
  - Widths of 375, 768 and 1280.

## 9. Deploy and docs

- Vercel static deploy, with `vercel.json` rewriting all paths to `/index.html` so client-side routes work.
- The README covers the pitch, a GIF or screenshots (mobile and desktop), the live link, the "Try demo" note, the stack and why, the D3 pattern, how to run and test, and the simulation disclaimer.
