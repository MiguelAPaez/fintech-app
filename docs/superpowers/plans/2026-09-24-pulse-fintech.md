# Pulse Fintech Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Pulse, a responsive, browser-only personal-finance simulator for Gen Z: mock auth, onboarding, D3 charts, filterable transactions, accounts, bills and goals. It is deployed on Vercel as a portfolio piece.

**Architecture:** A Vite + React + TypeScript SPA. All business logic lives in pure, unit-tested modules under `src/lib`, `src/data` and `src/state/financeReducer.ts`. React contexts wrap auth (`AuthContext`) and per-user finance data (`FinanceContext`, a `useReducer` store saved to localStorage after every change). React owns each chart's `<svg>`, and D3 draws inside it from `useEffect`. Styling is hand-written CSS: global design tokens, a small set of global component classes, and CSS Modules for layouts and pages.

**Tech Stack:** React 19, TypeScript, Vite, react-router-dom v7, d3 v7, Vitest. No CSS libraries.

**Spec:** `docs/superpowers/specs/2026-09-24-pulse-fintech-design.md`
**Visual reference:** `docs/design/dashboard-reference.html` (approved "Clean & Data-First" dashboard) and `docs/design/design-system.md`. The reference uses Tailwind CDN and Iconify **for the mockup only**. Reproduce its look with our own CSS and inline SVG icons.

## Global Constraints

- Runtime dependencies: only `react`, `react-dom`, `react-router-dom`, `d3`. Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/d3`, `vitest`. **No CSS frameworks, UI kits, CSS-in-JS or icon libraries.**
- Node 22 (installed: v22.21.1). All commands run from the repo root `C:/Users/migue/data/Documents/Claude_test/fintech_app`.
- English UI. Casual, encouraging copy, with emoji as category and goal icons.
- Browser-only: no backend. Auth and data live in localStorage, and the UI states that it is a simulation.
- Dates are ISO `YYYY-MM-DD` strings. Date arithmetic goes through `src/lib/dates.ts` (UTC-based). D3 time scales use `d3.scaleUtc`.
- Money is a positive `amount` on each transaction, and the direction comes from `type`/`direction` (`txEffect`). Display uses `formatMoney`, with U+2212 `−` for negatives.
- Colors in TSX/D3 must reference CSS variables (`var(--violet)` etc.) so both themes work. D3 sets colors via `.style()`, never `.attr('fill', 'var(...)')`.
- Every animation respects `prefers-reduced-motion`: use `motionMs()` for D3 and JS, and the global CSS media query for CSS.
- Breakpoints: `<768px` mobile (bottom tab bar), `768–1199px` compact icon sidebar, `≥1200px` full sidebar.
- **Commit messages are only the change name** (e.g. `feat: add finance selectors`). **No `Co-Authored-By` or other trailers.**
- Tests live next to their source as `src/**/*.test.ts` and run with `npm test`.

## Spec clarifications locked in by this plan

These decisions resolve gaps in the spec. The spec file is updated in Task 1 to match.

1. **Payment status:** a `none`-recurrence bill with `lastPaidDate` is `paid`. Otherwise `dueDate < today` makes it `overdue`. Otherwise `lastPaidDate` in the current calendar month makes it `paid`. Otherwise it is `upcoming`. Paying a recurring bill moves its `dueDate` forward one period.
2. **Transfers** are created from Accounts and can be **deleted** (both legs) but not edited.
3. **KPI and insight comparisons** use the *same period last month*: month-to-date vs the same number of days last month.
4. Buttons, cards, chips and inputs are **global CSS classes** (`.btn`, `.card`, `.chip`, `.field`), not React components. The only small React primitives are `Field`, `Modal`, `EmptyState`, `StatusBadge`, `PageHeader` and `Icon`.

## Review Focus

These are the inputs most likely to hurt a real user that no happy-path test covers. Each has a pinned test in the owning task.

1. **Hand-edited or stale URLs on `/transactions`**, such as `?page=abc&min=-5&type=bogus&range=nope`, must fall back to defaults and never crash or show a blank page. *(Task 7, `filtersFromParams` test)*
2. **Corrupt, old-version or blocked localStorage** must start fresh with a toast, never white-screen. A throwing `localStorage` (Safari private mode) must not crash. *(Task 4, storage tests)*
3. **Free-typed amounts** (`"1,234.50"`, `"abc"`, `"-5"`, `"1e9"`, `"12."`, `"0"`) must be parsed or rejected with a friendly message, never stored as `NaN`. *(Task 8, validation tests)*
4. **CSV export of user text** containing commas, quotes, newlines or a leading `=`/`+`/`@` must produce valid CSV that spreadsheet apps won't run as formulas. *(Task 7, csv tests)*
5. **Month-end recurring bills** (due Jan 31, paid, then next due Feb 28), and **deleting one leg of a transfer**, must keep dates valid and balances consistent. *(Task 2 dates test and Task 9 reducer tests)*

## File Structure

```
index.html                      Vite entry; Google Fonts; <html data-theme="dark">
vite.config.ts                  React plugin + Vitest config
vercel.json                     SPA rewrite
README.md                       Portfolio README
src/
  main.tsx                      mounts <App/>, imports global styles
  App.tsx                       router + providers
  types.ts                      domain types
  lib/
    dates.ts                    ISO date helpers (UTC arithmetic)
    format.ts                   Intl money/date/percent formatting
    categories.ts               category/currency/avatar/color constants, txVisual()
    motion.ts                   motionMs() reduced-motion helper
    crypto.ts                   randomSalt, hashPassword (Web Crypto SHA-256)
    auth.ts                     pure auth logic: validate, createUser, verifyLogin, passwordStrength
    finance.ts                  pure selectors: balances, series, breakdowns, statuses, insights
    filters.ts                  filter/sort/paginate + URL params <-> Filters
    csv.ts                      toCsv, downloadCsv
    validation.ts               parseAmount + form validators
  data/
    defaults.ts                 DEFAULT_PROFILE, emptyData()
    storage.ts                  the only localStorage access
    seed.ts                     deterministic demo data
  state/
    financeReducer.ts           pure reducer + action types + createTransferLegs/newId
    ToastContext.tsx            toasts
    AuthContext.tsx             register/login/demoLogin/logout
    FinanceContext.tsx          per-user store, persistence, theme
  styles/
    tokens.css                  design tokens (dark + light)
    global.css                  reset, base, utilities, reduced motion
    components.css              .card .btn .chip .badge .field .segmented .modal .toast .empty + chart styles
  components/
    Icon.tsx                    inline SVG icon set
    Field.tsx, Modal.tsx, EmptyState.tsx, StatusBadge.tsx, PageHeader.tsx, ErrorBoundary.tsx
    useCountUp.ts               animated number hook
    guards.tsx                  PublicOnly / RequireAuth / RequireSetup
    TransactionList.tsx (+ .module.css)   responsive table/cards
    TransactionModal.tsx        add/edit/delete transaction
    FilterBar.tsx (+ .module.css)
    layout/
      AppLayout.tsx, AppLayout.module.css, Sidebar.tsx, BottomNav.tsx, MobileTopBar.tsx, nav.ts, layoutContext.ts
  charts/
    useChartSize.ts, ChartTooltip.tsx, LineChart.tsx, BarChart.tsx, DonutChart.tsx, Sparkline.tsx, ProgressRing.tsx
  pages/
    AuthLayout.tsx (+ .module.css), LoginPage.tsx, RegisterPage.tsx
    DashboardPage.tsx (+ .module.css)
    TransactionsPage.tsx (+ .module.css)
    AccountsPage.tsx (+ .module.css), AccountModal.tsx, TransferModal.tsx
    PaymentsPage.tsx (+ .module.css), PaymentModal.tsx
    GoalsPage.tsx (+ .module.css), GoalModal.tsx, FundModal.tsx
    SettingsPage.tsx (+ .module.css)
  onboarding/
    WelcomeCarousel.tsx (+ Welcome.module.css)
    SetupWizard.tsx (+ Setup.module.css)
    GuidedTour.tsx (+ Tour.module.css), tourSteps.ts, placement.ts
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Modify: `.gitignore`, `docs/superpowers/specs/2026-09-24-pulse-fintech-design.md`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` scripts. `src/App.tsx` default export (replaced in Task 11).

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "pulse",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install react react-dom react-router-dom d3
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/d3 vitest
```
Expected: installs with no errors (`EBADENGINE` warnings are fine).

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 4: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 5: Write `index.html`**

```html
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="description" content="Pulse: a playful personal-finance simulator. Track spending, bills and goals with live charts." />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237C5CFF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M22 12h-4l-3 9L9 3l-3 9H2'/></svg>" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
    <title>Pulse · money, finally readable</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write the placeholder `src/App.tsx` and `src/main.tsx`**

`src/App.tsx`:
```tsx
export default function App() {
  return <h1>Pulse</h1>;
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 7: Verify build and tests run**

Run: `npm run build && npm test`
Expected: the build writes `dist/`, and Vitest reports "No test files found" and exits 0.

- [ ] **Step 8: Update the spec with the clarifications**

In `docs/superpowers/specs/2026-09-24-pulse-fintech-design.md`:
- In §4.5 replace the `paymentStatus` bullet text with: ``paymentStatus(payment, today)`` → `'paid' | 'upcoming' | 'overdue'`. A non-recurring bill with `lastPaidDate` is `paid`. Otherwise `dueDate < today` → `overdue`. Otherwise `lastPaidDate` in the current calendar month → `paid`. Otherwise `upcoming`.
- In §4.4 replace "`transfer` (creates both legs; editing or deleting either leg changes both)" with "`transfer` (creates both legs). Transfers can't be edited; deleting either leg deletes both."
- In §4.5 append the bullet: "Month comparisons (KPI deltas, insights) compare month-to-date against the same number of days last month."

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src docs/superpowers/specs
git commit -m "chore: scaffold Vite React TypeScript project"
```

---

### Task 2: Domain types, dates, formatting, categories

**Files:**
- Create: `src/types.ts`, `src/lib/dates.ts`, `src/lib/format.ts`, `src/lib/categories.ts`, `src/lib/motion.ts`
- Test: `src/lib/dates.test.ts`, `src/lib/format.test.ts`

**Interfaces:**
- Produces (types): `ID, Currency, TxType, CategoryId, AccountKind, Recurrence, PaymentStatus, User, Profile, Onboarding, Account, Transaction, Payment, Goal, FinanceData`
- Produces (dates): `type ISODate = string; toISODate(d: Date): ISODate; isoToDate(iso): Date; addDays(iso, n): ISODate; addMonths(iso, n): ISODate; daysBetween(a, b): number; monthKey(iso): string; startOfMonth(iso): ISODate; isValidISODate(s: string): boolean`
- Produces (format): `formatMoney(amount, currency, opts?: { sign?: boolean; compact?: boolean }): string; formatDate(iso): string; formatDateLong(iso): string; formatRelativeDay(iso, today): string; formatMonth(monthKey): string; formatPercent(n): string`
- Produces (categories): `CATEGORIES: Record<CategoryId, { label; emoji; color }>; CATEGORY_IDS; CURRENCIES; AVATARS; GOAL_EMOJIS; ACCOUNT_COLORS; KIND_LABEL; RECURRENCE_LABEL; txVisual(tx): { emoji; label }`
- Produces (motion): `motionMs(ms = 600): number`

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type ID = string;
export type Currency = 'USD' | 'EUR' | 'COP' | 'MXN' | 'GBP';
export type TxType = 'income' | 'expense' | 'transfer';
export type CategoryId =
  | 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills'
  | 'health' | 'education' | 'travel' | 'salary' | 'other';
export type AccountKind = 'checking' | 'savings' | 'credit';
export type Recurrence = 'none' | 'monthly' | 'yearly';
export type PaymentStatus = 'paid' | 'upcoming' | 'overdue';

export interface User {
  id: ID;
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

export interface Profile {
  nickname: string;
  avatar: string;
  currency: Currency;
  theme: 'dark' | 'light';
}

export interface Onboarding {
  setupDone: boolean;
  tourDone: boolean;
}

export interface Account {
  id: ID;
  name: string;
  kind: AccountKind;
  openingBalance: number;
  /** CSS color value, e.g. 'var(--violet)' */
  color: string;
}

export interface Transaction {
  id: ID;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  /** Always > 0; the sign comes from type/direction. */
  amount: number;
  type: TxType;
  category: CategoryId;
  accountId: ID;
  /** Both legs of a transfer share this id. */
  transferId?: ID;
  /** Required when type === 'transfer'. */
  direction?: 'in' | 'out';
}

export interface Payment {
  id: ID;
  name: string;
  amount: number;
  category: CategoryId;
  accountId: ID;
  dueDate: string;
  recurrence: Recurrence;
  lastPaidDate?: string;
}

export interface Goal {
  id: ID;
  name: string;
  emoji: string;
  target: number;
  saved: number;
  deadline?: string;
}

export interface FinanceData {
  version: 1;
  profile: Profile;
  onboarding: Onboarding;
  accounts: Account[];
  transactions: Transaction[];
  payments: Payment[];
  goals: Goal[];
}
```

- [ ] **Step 2: Write the failing date tests**

`src/lib/dates.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysBetween, isValidISODate, isoToDate, monthKey, startOfMonth, toISODate } from './dates';

describe('dates', () => {
  it('formats a local Date as an ISO day', () => {
    expect(toISODate(new Date(2026, 8, 4))).toBe('2026-09-04');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('clamps to month end when adding months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-03-15', -3)).toBe('2025-12-15');
    expect(addMonths('2026-05-31', 12)).toBe('2027-05-31');
  });

  it('counts whole days between dates', () => {
    expect(daysBetween('2026-09-24', '2026-10-01')).toBe(7);
    expect(daysBetween('2026-10-01', '2026-09-24')).toBe(-7);
  });

  it('validates ISO strings strictly', () => {
    expect(isValidISODate('2026-02-28')).toBe(true);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-2-3')).toBe(false);
    expect(isValidISODate('')).toBe(false);
  });

  it('exposes month helpers', () => {
    expect(monthKey('2026-09-24')).toBe('2026-09');
    expect(startOfMonth('2026-09-24')).toBe('2026-09-01');
    expect(isoToDate('2026-09-24').toISOString()).toBe('2026-09-24T00:00:00.000Z');
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/lib/dates.test.ts`
Expected: FAIL, because it cannot resolve `./dates`.

- [ ] **Step 4: Implement `src/lib/dates.ts`**

```ts
/** All app dates are ISO 'YYYY-MM-DD' strings; arithmetic runs in UTC so DST never shifts a day. */
export type ISODate = string;

export function toISODate(d: Date): ISODate {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** UTC midnight for the given day; use with d3.scaleUtc. */
export function isoToDate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const fromUtc = (d: Date): ISODate => d.toISOString().slice(0, 10);

export function addDays(iso: ISODate, n: number): ISODate {
  const d = isoToDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return fromUtc(target);
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((isoToDate(b).getTime() - isoToDate(a).getTime()) / 86_400_000);
}

export const monthKey = (iso: ISODate): string => iso.slice(0, 7);
export const startOfMonth = (iso: ISODate): ISODate => `${iso.slice(0, 7)}-01`;

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUtc(isoToDate(s)) === s;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- src/lib/dates.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Write the failing format tests**

`src/lib/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatDate, formatDateLong, formatMoney, formatMonth, formatPercent, formatRelativeDay } from './format';

describe('format', () => {
  it('formats money with a real minus sign', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney(-24.9, 'USD')).toBe('−$24.90');
    expect(formatMoney(3200, 'USD', { sign: true })).toBe('+$3,200.00');
    expect(formatMoney(0, 'USD', { sign: true })).toBe('$0.00');
    expect(formatMoney(12742.5, 'USD', { compact: true })).toBe('$12.7K');
    expect(formatMoney(10, 'EUR')).toBe('€10.00');
  });

  it('formats dates', () => {
    expect(formatDate('2026-09-24')).toBe('Sep 24');
    expect(formatDateLong('2026-09-24')).toBe('Sep 24, 2026');
    expect(formatMonth('2026-09')).toBe('Sep');
  });

  it('formats relative days', () => {
    expect(formatRelativeDay('2026-09-24', '2026-09-24')).toBe('Today');
    expect(formatRelativeDay('2026-09-23', '2026-09-24')).toBe('Yesterday');
    expect(formatRelativeDay('2026-09-01', '2026-09-24')).toBe('Sep 1');
  });

  it('formats percents', () => {
    expect(formatPercent(41.6)).toBe('42%');
  });
});
```

- [ ] **Step 7: Implement `src/lib/format.ts`**

```ts
import type { Currency } from '../types';
import { daysBetween, isoToDate, type ISODate } from './dates';

const moneyFormats = new Map<string, Intl.NumberFormat>();

function moneyFormat(currency: Currency, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  let f = moneyFormats.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-US', compact
      ? { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }
      : { style: 'currency', currency });
    moneyFormats.set(key, f);
  }
  return f;
}

export function formatMoney(amount: number, currency: Currency, opts: { sign?: boolean; compact?: boolean } = {}): string {
  const s = moneyFormat(currency, !!opts.compact).format(Math.abs(amount));
  if (amount < 0) return `−${s}`;
  if (opts.sign && amount > 0) return `+${s}`;
  return s;
}

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const monthName = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

export const formatDate = (iso: ISODate): string => shortDate.format(isoToDate(iso));
export const formatDateLong = (iso: ISODate): string => longDate.format(isoToDate(iso));
export const formatMonth = (month: string): string => monthName.format(isoToDate(`${month}-01`));
export const formatPercent = (n: number): string => `${Math.round(n)}%`;

export function formatRelativeDay(iso: ISODate, today: ISODate): string {
  const diff = daysBetween(iso, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return formatDate(iso);
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test -- src/lib/format.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 9: Write `src/lib/categories.ts` and `src/lib/motion.ts`**

`src/lib/categories.ts`:
```ts
import type { AccountKind, CategoryId, Currency, Recurrence, Transaction } from '../types';

export const CATEGORIES: Record<CategoryId, { label: string; emoji: string; color: string }> = {
  food: { label: 'Food', emoji: '🍔', color: 'var(--violet)' },
  transport: { label: 'Transport', emoji: '🚌', color: 'var(--pink)' },
  shopping: { label: 'Shopping', emoji: '🛍️', color: 'var(--lime)' },
  entertainment: { label: 'Entertainment', emoji: '🎮', color: 'var(--cyan)' },
  bills: { label: 'Bills', emoji: '💡', color: 'var(--amber)' },
  health: { label: 'Health', emoji: '💊', color: 'var(--cat-6)' },
  education: { label: 'Education', emoji: '📚', color: 'var(--cat-7)' },
  travel: { label: 'Travel', emoji: '✈️', color: 'var(--cat-8)' },
  salary: { label: 'Salary', emoji: '💰', color: 'var(--cat-9)' },
  other: { label: 'Other', emoji: '✨', color: 'var(--cat-10)' },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];
export const CURRENCIES: Currency[] = ['USD', 'EUR', 'COP', 'MXN', 'GBP'];
export const AVATARS = ['😎', '🦊', '🐼', '👾', '🌈', '🔥', '🍕', '🎧', '🚀', '🌵', '🐸', '💜'];
export const GOAL_EMOJIS = ['💻', '🗾', '🚗', '🎧', '🏖️', '🎓', '🎮', '🏠'];
export const ACCOUNT_COLORS = ['var(--violet)', 'var(--lime)', 'var(--pink)', 'var(--cyan)', 'var(--amber)'];
export const KIND_LABEL: Record<AccountKind, string> = { checking: 'Checking', savings: 'Savings', credit: 'Credit card' };
export const RECURRENCE_LABEL: Record<Recurrence, string> = { none: 'One-time', monthly: 'Monthly', yearly: 'Yearly' };

export function txVisual(tx: Transaction): { emoji: string; label: string } {
  if (tx.type === 'transfer') return { emoji: '🔁', label: 'Transfer' };
  return { emoji: CATEGORIES[tx.category].emoji, label: CATEGORIES[tx.category].label };
}
```

`src/lib/motion.ts`:
```ts
/** Animation duration that collapses to 0 when the user prefers reduced motion. */
export function motionMs(ms = 600): number {
  if (typeof window === 'undefined') return ms;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
}
```

- [ ] **Step 10: Type-check and commit**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; 10 tests pass.

```bash
git add src/types.ts src/lib
git commit -m "feat: add domain types, date and format helpers"
```

---

### Task 3: Password hashing and auth logic

**Files:**
- Create: `src/lib/crypto.ts`, `src/lib/auth.ts`
- Test: `src/lib/auth.test.ts`

**Interfaces:**
- Consumes: `User` (Task 2)
- Produces: `randomSalt(): string; hashPassword(password, salt): Promise<string>; class AuthError extends Error; DEMO_EMAIL; DEMO_PASSWORD; normalizeEmail(e): string; validateRegistration(input: RegisterInput): string | null; createUser(users: User[], input: RegisterInput, now: Date): Promise<User>; verifyLogin(users, email, password): Promise<User | null>; passwordStrength(pw): 'weak' | 'ok' | 'strong'; interface RegisterInput { name: string; email: string; password: string }`

- [ ] **Step 1: Write the failing tests**

`src/lib/auth.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createUser, passwordStrength, validateRegistration, verifyLogin } from './auth';
import { hashPassword } from './crypto';

const now = new Date('2026-09-24T12:00:00Z');
const input = { name: 'Alex', email: 'Alex@Example.com', password: 'hunter22!' };

describe('auth', () => {
  it('creates a user with normalized email and a salted hash', async () => {
    const u = await createUser([], input, now);
    expect(u.email).toBe('alex@example.com');
    expect(u.name).toBe('Alex');
    expect(u.salt).toHaveLength(32);
    expect(u.passwordHash).toHaveLength(64);
    expect(u.passwordHash).not.toContain('hunter');
  });

  it('rejects a duplicate email case-insensitively', async () => {
    const u = await createUser([], input, now);
    await expect(createUser([u], { ...input, email: ' ALEX@example.com ' }, now)).rejects.toThrow('already exists');
  });

  it('validates registration fields', () => {
    expect(validateRegistration({ ...input, name: '  ' })).toBe('Tell us your name');
    expect(validateRegistration({ ...input, email: 'nope' })).toBe('Enter a valid email');
    expect(validateRegistration({ ...input, password: 'short' })).toBe('Password needs at least 8 characters');
    expect(validateRegistration(input)).toBeNull();
  });

  it('verifies logins', async () => {
    const u = await createUser([], input, now);
    expect(await verifyLogin([u], ' alex@EXAMPLE.com', 'hunter22!')).toEqual(u);
    expect(await verifyLogin([u], 'alex@example.com', 'wrong-pass')).toBeNull();
    expect(await verifyLogin([u], 'ghost@example.com', 'hunter22!')).toBeNull();
  });

  it('hashes deterministically per salt', async () => {
    expect(await hashPassword('a', 's1')).toBe(await hashPassword('a', 's1'));
    expect(await hashPassword('a', 's1')).not.toBe(await hashPassword('a', 's2'));
  });

  it('rates password strength', () => {
    expect(passwordStrength('abc')).toBe('weak');
    expect(passwordStrength('abcdefgh')).toBe('weak');
    expect(passwordStrength('abcdefg1')).toBe('ok');
    expect(passwordStrength('Abcdefgh123!')).toBe('strong');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/auth.test.ts`
Expected: FAIL, because it cannot resolve `./auth`.

- [ ] **Step 3: Implement `src/lib/crypto.ts`**

```ts
const toHex = (buf: ArrayBuffer): string =>
  [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

/** SHA-256 of salt + password. Fine for a simulation; not a real password KDF. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}
```

- [ ] **Step 4: Implement `src/lib/auth.ts`**

```ts
import type { User } from '../types';
import { hashPassword, randomSalt } from './crypto';

export class AuthError extends Error {}

export const DEMO_EMAIL = 'demo@pulse.app';
export const DEMO_PASSWORD = 'pulse-demo-2026';

export interface RegisterInput { name: string; email: string; password: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export function validateRegistration({ name, email, password }: RegisterInput): string | null {
  if (!name.trim()) return 'Tell us your name';
  if (name.trim().length > 40) return 'Keep your name under 40 characters';
  if (!EMAIL_RE.test(normalizeEmail(email))) return 'Enter a valid email';
  if (password.length < 8) return 'Password needs at least 8 characters';
  return null;
}

export async function createUser(users: User[], input: RegisterInput, now: Date): Promise<User> {
  const error = validateRegistration(input);
  if (error) throw new AuthError(error);
  const email = normalizeEmail(input.email);
  if (users.some(u => u.email === email)) throw new AuthError('An account with this email already exists');
  const salt = randomSalt();
  return {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim(),
    salt,
    passwordHash: await hashPassword(input.password, salt),
    createdAt: now.toISOString(),
  };
}

export async function verifyLogin(users: User[], email: string, password: string): Promise<User | null> {
  const user = users.find(u => u.email === normalizeEmail(email));
  if (!user) return null;
  return (await hashPassword(password, user.salt)) === user.passwordHash ? user : null;
}

export function passwordStrength(pw: string): 'weak' | 'ok' | 'strong' {
  if (pw.length < 8) return 'weak';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(re => re.test(pw)).length;
  if (pw.length >= 12 && classes >= 3) return 'strong';
  return classes >= 2 ? 'ok' : 'weak';
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- src/lib/auth.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/crypto.ts src/lib/auth.ts src/lib/auth.test.ts
git commit -m "feat: add salted password hashing and auth logic"
```

---

### Task 4: Defaults and storage

**Files:**
- Create: `src/data/defaults.ts`, `src/data/storage.ts`
- Test: `src/data/storage.test.ts`

**Interfaces:**
- Consumes: `FinanceData, Profile, User` (Task 2)
- Produces: `DEFAULT_PROFILE: Profile; emptyData(profile?: Partial<Profile>): FinanceData` (onboarding `{ setupDone: false, tourDone: false }`); `type LoadResult = { status: 'ok'; data: FinanceData } | { status: 'missing' } | { status: 'corrupt' }; isFinanceData(v: unknown): v is FinanceData; storage.{ getUsers(): User[]; saveUsers(users); getSession(): { userId: string } | null; setSession(s | null); getWelcomeSeen(): boolean; setWelcomeSeen(b); loadData(userId): LoadResult; saveData(userId, data) }`

- [ ] **Step 1: Write `src/data/defaults.ts`**

```ts
import type { FinanceData, Profile } from '../types';

export const DEFAULT_PROFILE: Profile = { nickname: '', avatar: '😎', currency: 'USD', theme: 'dark' };

export function emptyData(profile: Partial<Profile> = {}): FinanceData {
  return {
    version: 1,
    profile: { ...DEFAULT_PROFILE, ...profile },
    onboarding: { setupDone: false, tourDone: false },
    accounts: [],
    transactions: [],
    payments: [],
    goals: [],
  };
}
```

- [ ] **Step 2: Write the failing storage tests**

`src/data/storage.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyData } from './defaults';
import { storage } from './storage';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('storage', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', new MemoryStorage()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('round-trips finance data', () => {
    const data = emptyData({ nickname: 'Alex' });
    storage.saveData('u1', data);
    expect(storage.loadData('u1')).toEqual({ status: 'ok', data });
  });

  it('reports missing data', () => {
    expect(storage.loadData('nobody')).toEqual({ status: 'missing' });
  });

  it('reports corrupt JSON and unknown versions as corrupt', () => {
    localStorage.setItem('pulse.data.u1', '{nope');
    expect(storage.loadData('u1')).toEqual({ status: 'corrupt' });
    localStorage.setItem('pulse.data.u2', JSON.stringify({ ...emptyData(), version: 99 }));
    expect(storage.loadData('u2')).toEqual({ status: 'corrupt' });
    localStorage.setItem('pulse.data.u3', JSON.stringify({ ...emptyData(), transactions: 'lol' }));
    expect(storage.loadData('u3')).toEqual({ status: 'corrupt' });
  });

  it('returns no users when the users key is garbage', () => {
    localStorage.setItem('pulse.users', '"hello"');
    expect(storage.getUsers()).toEqual([]);
  });

  it('sets and clears the session', () => {
    storage.setSession({ userId: 'u1' });
    expect(storage.getSession()).toEqual({ userId: 'u1' });
    storage.setSession(null);
    expect(storage.getSession()).toBeNull();
  });

  it('remembers the welcome flag', () => {
    expect(storage.getWelcomeSeen()).toBe(false);
    storage.setWelcomeSeen(true);
    expect(storage.getWelcomeSeen()).toBe(true);
  });

  it('survives a localStorage that throws (private mode)', () => {
    const boom = () => { throw new Error('denied'); };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom });
    expect(storage.getUsers()).toEqual([]);
    expect(storage.loadData('u1')).toEqual({ status: 'missing' });
    expect(() => storage.saveUsers([])).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/data/storage.test.ts`
Expected: FAIL, because it cannot resolve `./storage`.

- [ ] **Step 4: Implement `src/data/storage.ts`**

```ts
import type { FinanceData, User } from '../types';

const KEYS = {
  users: 'pulse.users',
  session: 'pulse.session',
  welcome: 'pulse.welcomeSeen',
  data: (userId: string) => `pulse.data.${userId}`,
};

const INVALID = Symbol('invalid');

/** null = absent or unreadable storage; INVALID = present but not JSON. */
function read(key: string): unknown {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return INVALID;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app keeps working in memory.
  }
}

export type LoadResult = { status: 'ok'; data: FinanceData } | { status: 'missing' } | { status: 'corrupt' };

export function isFinanceData(v: unknown): v is FinanceData {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Record<string, unknown>;
  return d.version === 1
    && typeof d.profile === 'object' && d.profile !== null
    && typeof d.onboarding === 'object' && d.onboarding !== null
    && ['accounts', 'transactions', 'payments', 'goals'].every(k => Array.isArray(d[k]));
}

export const storage = {
  getUsers(): User[] {
    const v = read(KEYS.users);
    return Array.isArray(v) ? (v as User[]) : [];
  },
  saveUsers(users: User[]): void {
    write(KEYS.users, users);
  },
  getSession(): { userId: string } | null {
    const v = read(KEYS.session) as { userId?: unknown } | null;
    return v && typeof v === 'object' && typeof v.userId === 'string' ? { userId: v.userId } : null;
  },
  setSession(session: { userId: string } | null): void {
    write(KEYS.session, session);
  },
  getWelcomeSeen(): boolean {
    return read(KEYS.welcome) === true;
  },
  setWelcomeSeen(seen: boolean): void {
    write(KEYS.welcome, seen);
  },
  loadData(userId: string): LoadResult {
    const v = read(KEYS.data(userId));
    if (v === null) return { status: 'missing' };
    return isFinanceData(v) ? { status: 'ok', data: v } : { status: 'corrupt' };
  },
  saveData(userId: string, data: FinanceData): void {
    write(KEYS.data(userId), data);
  },
};
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- src/data/storage.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data
git commit -m "feat: add versioned localStorage persistence"
```

---

### Task 5: Finance selectors

**Files:**
- Create: `src/lib/finance.ts`
- Test: `src/lib/finance.test.ts`

**Interfaces:**
- Consumes: types (Task 2), `dates`, `format`, `CATEGORIES` (Task 2), `emptyData` (Task 4, tests only)
- Produces:
  - `round2(n): number`
  - `txEffect(tx): number` (signed effect on its account)
  - `balanceAt(data, date: ISODate): number` (all accounts, tx.date <= date)
  - `accountBalance(data, accountId): number`
  - `totalBalance(data): number`
  - `rangeTotals(txs, from, to): { income: number; expense: number }` (transfers excluded)
  - `monthTotals(txs, month: 'YYYY-MM'): { income; expense }`
  - `samePeriodLastMonth(today): { from: ISODate; to: ISODate }`
  - `interface MonthPoint { month: string; income: number; expense: number }` and `monthlySeries(txs, today, n): MonthPoint[]` (oldest first)
  - `interface BalancePoint { date: ISODate; balance: number }` and `balanceSeries(data, today, days, accountId?): BalancePoint[]`
  - `interface CategoryTotal { category: CategoryId; total: number }` and `categoryBreakdown(txs, from, to): CategoryTotal[]` (desc)
  - `savingsRate(txs, month): number` (0 when no income)
  - `percentChange(current, previous): number | null`
  - `paymentStatus(p, today): PaymentStatus` and `dueLabel(p, today): string`
  - `interface Insight { emoji: string; text: string; tone: 'good' | 'bad' | 'info' }` and `insights(data, today): Insight[]` (max 3)
  - `sortByDateDesc(txs): Transaction[]` (new array)

- [ ] **Step 1: Write the failing tests**

`src/lib/finance.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Account, FinanceData, Payment, Transaction } from '../types';
import { emptyData } from '../data/defaults';
import {
  accountBalance, balanceAt, balanceSeries, categoryBreakdown, dueLabel, insights, monthTotals,
  monthlySeries, paymentStatus, percentChange, samePeriodLastMonth, savingsRate, sortByDateDesc,
  totalBalance, txEffect,
} from './finance';

const acc = (id: string, openingBalance: number): Account => ({ id, name: id, kind: 'checking', openingBalance, color: 'var(--violet)' });
let n = 0;
const tx = (p: Partial<Transaction>): Transaction => ({
  id: `t${++n}`, date: '2026-09-10', description: 'x', amount: 10, type: 'expense', category: 'food', accountId: 'a', ...p,
});
const make = (transactions: Transaction[], payments: Payment[] = []): FinanceData => ({
  ...emptyData(), accounts: [acc('a', 100), acc('b', 50)], transactions, payments,
});
const bill = (p: Partial<Payment>): Payment => ({
  id: 'p1', name: 'Rent', amount: 900, category: 'bills', accountId: 'a', dueDate: '2026-09-27', recurrence: 'monthly', ...p,
});

describe('balances', () => {
  const data = make([
    tx({ type: 'income', amount: 200, category: 'salary', date: '2026-09-01' }),
    tx({ amount: 30, date: '2026-09-05' }),
    tx({ type: 'transfer', amount: 40, direction: 'out', transferId: 'x', category: 'other', date: '2026-09-06' }),
    tx({ type: 'transfer', amount: 40, direction: 'in', transferId: 'x', category: 'other', accountId: 'b', date: '2026-09-06' }),
  ]);

  it('signs effects by type and direction', () => {
    expect(data.transactions.map(txEffect)).toEqual([200, -30, -40, 40]);
  });

  it('computes account and total balances; transfers net to zero', () => {
    expect(accountBalance(data, 'a')).toBe(230);
    expect(accountBalance(data, 'b')).toBe(90);
    expect(totalBalance(data)).toBe(320);
  });

  it('computes balance at a date', () => {
    expect(balanceAt(data, '2026-08-31')).toBe(150);
    expect(balanceAt(data, '2026-09-01')).toBe(350);
  });

  it('builds a daily balance series ending at the current total', () => {
    const s = balanceSeries(data, '2026-09-06', 7);
    expect(s).toHaveLength(7);
    expect(s[0]).toEqual({ date: '2026-08-31', balance: 150 });
    expect(s[1]).toEqual({ date: '2026-09-01', balance: 350 });
    expect(s.at(-1)).toEqual({ date: '2026-09-06', balance: 320 });
  });

  it('builds a per-account series', () => {
    const s = balanceSeries(data, '2026-09-06', 2, 'b');
    expect(s).toEqual([{ date: '2026-09-05', balance: 50 }, { date: '2026-09-06', balance: 90 }]);
  });
});

describe('totals', () => {
  const txs = [
    tx({ type: 'income', amount: 1000, category: 'salary', date: '2026-09-01' }),
    tx({ amount: 400, category: 'food', date: '2026-09-02' }),
    tx({ amount: 200, category: 'transport', date: '2026-09-03' }),
    tx({ amount: 999, type: 'transfer', direction: 'out', date: '2026-09-03' }),
    tx({ amount: 50, category: 'food', date: '2026-08-15' }),
  ];

  it('totals a month excluding transfers', () => {
    expect(monthTotals(txs, '2026-09')).toEqual({ income: 1000, expense: 600 });
  });

  it('builds a monthly series oldest first with empty months as zero', () => {
    expect(monthlySeries(txs, '2026-09-20', 3)).toEqual([
      { month: '2026-07', income: 0, expense: 0 },
      { month: '2026-08', income: 0, expense: 50 },
      { month: '2026-09', income: 1000, expense: 600 },
    ]);
  });

  it('breaks down expenses by category, largest first, inclusive range', () => {
    expect(categoryBreakdown(txs, '2026-09-01', '2026-09-03')).toEqual([
      { category: 'food', total: 400 },
      { category: 'transport', total: 200 },
    ]);
  });

  it('computes savings rate and percent change', () => {
    expect(savingsRate(txs, '2026-09')).toBe(40);
    expect(savingsRate(txs, '2026-08')).toBe(0);
    expect(percentChange(110, 100)).toBeCloseTo(10);
    expect(percentChange(5, 0)).toBeNull();
  });

  it('finds the same period last month, clamped to month end', () => {
    expect(samePeriodLastMonth('2026-09-10')).toEqual({ from: '2026-08-01', to: '2026-08-10' });
    expect(samePeriodLastMonth('2026-03-31')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('sorts by date desc without mutating', () => {
    const sorted = sortByDateDesc(txs);
    expect(sorted[0].date).toBe('2026-09-03');
    expect(sorted.at(-1)!.date).toBe('2026-08-15');
    expect(txs[0].date).toBe('2026-09-01');
  });
});

describe('payments', () => {
  const today = '2026-09-24';

  it('derives status', () => {
    expect(paymentStatus(bill({ recurrence: 'none', lastPaidDate: '2026-01-01', dueDate: '2026-01-01' }), today)).toBe('paid');
    expect(paymentStatus(bill({ dueDate: '2026-09-22' }), today)).toBe('overdue');
    expect(paymentStatus(bill({ dueDate: '2026-10-22', lastPaidDate: '2026-09-22' }), today)).toBe('paid');
    expect(paymentStatus(bill({ dueDate: '2026-09-27', lastPaidDate: '2026-08-27' }), today)).toBe('upcoming');
  });

  it('describes due dates', () => {
    expect(dueLabel(bill({ dueDate: '2026-09-22' }), today)).toBe('Overdue by 2 days');
    expect(dueLabel(bill({ dueDate: '2026-09-23' }), today)).toBe('Overdue by 1 day');
    expect(dueLabel(bill({ dueDate: '2026-09-24' }), today)).toBe('Due today');
    expect(dueLabel(bill({ dueDate: '2026-09-25' }), today)).toBe('Due tomorrow');
    expect(dueLabel(bill({ dueDate: '2026-09-27' }), today)).toBe('Due in 3 days');
    expect(dueLabel(bill({ dueDate: '2026-10-22', lastPaidDate: '2026-09-22' }), today)).toBe('Paid Sep 22');
  });
});

describe('insights', () => {
  it('reports the biggest drop, the biggest rise and bills due this week', () => {
    const data = make(
      [
        tx({ amount: 100, category: 'food', date: '2026-08-05' }),
        tx({ amount: 50, category: 'food', date: '2026-09-05' }),
        tx({ amount: 20, category: 'entertainment', date: '2026-08-05' }),
        tx({ amount: 40, category: 'entertainment', date: '2026-09-05' }),
        tx({ amount: 500, category: 'shopping', date: '2026-08-20' }),
      ],
      [bill({ dueDate: '2026-09-13', lastPaidDate: '2026-08-13' }), bill({ id: 'p2', dueDate: '2026-10-30' })],
    );
    expect(insights(data, '2026-09-10')).toEqual([
      { emoji: '🍔', text: 'Food spend down 50% 🔥', tone: 'good' },
      { emoji: '🎮', text: 'Entertainment up 100% 👀', tone: 'bad' },
      { emoji: '⏰', text: '1 bill due this week', tone: 'info' },
    ]);
  });

  it('returns nothing for an empty account', () => {
    expect(insights(make([]), '2026-09-10')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/finance.test.ts`
Expected: FAIL, because it cannot resolve `./finance`.

- [ ] **Step 3: Implement `src/lib/finance.ts`**

```ts
import type { CategoryId, FinanceData, ID, Payment, PaymentStatus, Transaction } from '../types';
import { CATEGORIES } from './categories';
import { addDays, addMonths, daysBetween, monthKey, startOfMonth, type ISODate } from './dates';
import { formatDate } from './format';

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export function txEffect(tx: Transaction): number {
  switch (tx.type) {
    case 'income': return tx.amount;
    case 'expense': return -tx.amount;
    case 'transfer': return tx.direction === 'in' ? tx.amount : -tx.amount;
  }
}

const openings = (data: FinanceData, accountId?: ID): number =>
  data.accounts.filter(a => !accountId || a.id === accountId).reduce((s, a) => s + a.openingBalance, 0);

export function balanceAt(data: FinanceData, date: ISODate, accountId?: ID): number {
  const moved = data.transactions
    .filter(t => t.date <= date && (!accountId || t.accountId === accountId))
    .reduce((s, t) => s + txEffect(t), 0);
  return round2(openings(data, accountId) + moved);
}

export function accountBalance(data: FinanceData, accountId: ID): number {
  return round2(openings(data, accountId) + data.transactions.filter(t => t.accountId === accountId).reduce((s, t) => s + txEffect(t), 0));
}

export function totalBalance(data: FinanceData): number {
  return round2(openings(data) + data.transactions.reduce((s, t) => s + txEffect(t), 0));
}

export function rangeTotals(txs: Transaction[], from: ISODate, to: ISODate): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.date < from || t.date > to) continue;
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  return { income: round2(income), expense: round2(expense) };
}

export function monthTotals(txs: Transaction[], month: string): { income: number; expense: number } {
  const from = `${month}-01`;
  return rangeTotals(txs, from, addDays(addMonths(from, 1), -1));
}

export function samePeriodLastMonth(today: ISODate): { from: ISODate; to: ISODate } {
  const from = addMonths(startOfMonth(today), -1);
  const lastDayPrev = addDays(startOfMonth(today), -1);
  const to = addDays(from, daysBetween(startOfMonth(today), today));
  return { from, to: to > lastDayPrev ? lastDayPrev : to };
}

export interface MonthPoint { month: string; income: number; expense: number }

export function monthlySeries(txs: Transaction[], today: ISODate, n: number): MonthPoint[] {
  const first = addMonths(startOfMonth(today), -(n - 1));
  return Array.from({ length: n }, (_, i) => {
    const month = monthKey(addMonths(first, i));
    return { month, ...monthTotals(txs, month) };
  });
}

export interface BalancePoint { date: ISODate; balance: number }

export function balanceSeries(data: FinanceData, today: ISODate, days: number, accountId?: ID): BalancePoint[] {
  const start = addDays(today, -(days - 1));
  let balance = balanceAt(data, addDays(start, -1), accountId);
  const byDate = new Map<ISODate, number>();
  for (const t of data.transactions) {
    if (t.date < start || t.date > today || (accountId && t.accountId !== accountId)) continue;
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + txEffect(t));
  }
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    balance = round2(balance + (byDate.get(date) ?? 0));
    return { date, balance };
  });
}

export interface CategoryTotal { category: CategoryId; total: number }

export function categoryBreakdown(txs: Transaction[], from: ISODate, to: ISODate): CategoryTotal[] {
  const totals = new Map<CategoryId, number>();
  for (const t of txs) {
    if (t.type !== 'expense' || t.date < from || t.date > to) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return [...totals].map(([category, total]) => ({ category, total: round2(total) })).sort((a, b) => b.total - a.total);
}

export function savingsRate(txs: Transaction[], month: string): number {
  const { income, expense } = monthTotals(txs, month);
  return income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
}

export function percentChange(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;
}

export function paymentStatus(p: Payment, today: ISODate): PaymentStatus {
  if (p.recurrence === 'none' && p.lastPaidDate) return 'paid';
  if (p.dueDate < today) return 'overdue';
  if (p.lastPaidDate && monthKey(p.lastPaidDate) === monthKey(today)) return 'paid';
  return 'upcoming';
}

export function dueLabel(p: Payment, today: ISODate): string {
  if (paymentStatus(p, today) === 'paid') return `Paid ${formatDate(p.lastPaidDate!)}`;
  const d = daysBetween(today, p.dueDate);
  if (d < 0) return `Overdue by ${-d} day${d === -1 ? '' : 's'}`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `Due in ${d} days`;
}

export interface Insight { emoji: string; text: string; tone: 'good' | 'bad' | 'info' }

export function insights(data: FinanceData, today: ISODate): Insight[] {
  const out: Insight[] = [];
  const current = categoryBreakdown(data.transactions, startOfMonth(today), today);
  const { from, to } = samePeriodLastMonth(today);
  const previous = categoryBreakdown(data.transactions, from, to);
  const changes = previous.map(p => ({
    category: p.category,
    pct: percentChange(current.find(c => c.category === p.category)?.total ?? 0, p.total)!,
  }));
  const down = [...changes].sort((a, b) => a.pct - b.pct)[0];
  if (down && down.pct <= -5) {
    const c = CATEGORIES[down.category];
    out.push({ emoji: c.emoji, text: `${c.label} spend down ${Math.round(-down.pct)}% 🔥`, tone: 'good' });
  }
  const up = [...changes].sort((a, b) => b.pct - a.pct)[0];
  if (up && up.pct >= 5) {
    const c = CATEGORIES[up.category];
    out.push({ emoji: c.emoji, text: `${c.label} up ${Math.round(up.pct)}% 👀`, tone: 'bad' });
  }
  const weekAhead = addDays(today, 7);
  const due = data.payments.filter(p => paymentStatus(p, today) !== 'paid' && p.dueDate <= weekAhead).length;
  if (due > 0) out.push({ emoji: '⏰', text: `${due} bill${due === 1 ? '' : 's'} due this week`, tone: 'info' });
  return out.slice(0, 3);
}

export function sortByDateDesc(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/finance.test.ts`
Expected: PASS. The insights test: food fell 100→50 (−50%), entertainment rose 20→40 (+100%), and shopping had nothing in the same period last month (Aug 20 is after Aug 10), so it is ignored. Rent is unpaid and due Sep 13 ≤ Sep 17.

- [ ] **Step 5: Commit**

```bash
git add src/lib/finance.ts src/lib/finance.test.ts
git commit -m "feat: add finance selectors"
```

---

### Task 6: Deterministic seed data

**Files:**
- Create: `src/data/seed.ts`
- Test: `src/data/seed.test.ts`

**Interfaces:**
- Consumes: `emptyData` (Task 4), `dates` (Task 2), `accountBalance`, `paymentStatus` (Task 5, tests)
- Produces: `mulberry32(seed: number): () => number; createSeedData(now: Date, profile?: Partial<Profile>): FinanceData`. The result has `onboarding: { setupDone: true, tourDone: false }`, account ids `acc-checking`, `acc-savings`, `acc-credit`, and profile nickname defaulting to `'Alex'`.

- [ ] **Step 1: Write the failing tests**

`src/data/seed.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { accountBalance, paymentStatus } from '../lib/finance';
import { createSeedData } from './seed';

const now = new Date(2026, 8, 24, 10, 0, 0);

describe('seed data', () => {
  const data = createSeedData(now);

  it('is deterministic for a given day', () => {
    expect(createSeedData(now)).toEqual(data);
  });

  it('covers six months up to today', () => {
    const dates = data.transactions.map(t => t.date).sort();
    expect(dates[0]).toBe('2026-04-01');
    expect(dates.at(-1)! <= '2026-09-24').toBe(true);
    expect(data.transactions.length).toBeGreaterThan(200);
  });

  it('uses positive amounts with at most two decimals and unique ids', () => {
    for (const t of data.transactions) {
      expect(t.amount).toBeGreaterThan(0);
      expect(Math.round(t.amount * 100)).toBe(t.amount * 100);
    }
    expect(new Set(data.transactions.map(t => t.id)).size).toBe(data.transactions.length);
  });

  it('creates matching transfer legs', () => {
    const legs = data.transactions.filter(t => t.type === 'transfer');
    const byId = Map.groupBy(legs, t => t.transferId);
    expect(byId.size).toBeGreaterThan(0);
    for (const pair of byId.values()) {
      expect(pair).toHaveLength(2);
      expect(pair.map(t => t.direction).sort()).toEqual(['in', 'out']);
      expect(pair[0].amount).toBe(pair[1].amount);
      expect(pair[0].date).toBe(pair[1].date);
    }
  });

  it('keeps checking in the black', () => {
    expect(accountBalance(data, 'acc-checking')).toBeGreaterThan(0);
  });

  it('seeds bills in every status', () => {
    expect(new Set(data.payments.map(p => paymentStatus(p, '2026-09-24')))).toEqual(new Set(['paid', 'upcoming', 'overdue']));
  });

  it('marks setup done with the tour pending and keeps profile overrides', () => {
    expect(data.onboarding).toEqual({ setupDone: true, tourDone: false });
    expect(data.profile.nickname).toBe('Alex');
    expect(createSeedData(now, { nickname: 'Sam', currency: 'EUR' }).profile).toMatchObject({ nickname: 'Sam', currency: 'EUR' });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/data/seed.test.ts`
Expected: FAIL, because it cannot resolve `./seed`.

- [ ] **Step 3: Implement `src/data/seed.ts`**

```ts
import type { Account, CategoryId, FinanceData, Goal, Payment, Profile, Transaction } from '../types';
import { addDays, addMonths, startOfMonth, toISODate } from '../lib/dates';
import { emptyData } from './defaults';

/** Tiny seeded PRNG so the demo looks identical on every load of the same day. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACCOUNTS: Account[] = [
  { id: 'acc-checking', name: 'Checking', kind: 'checking', openingBalance: 2400, color: 'var(--violet)' },
  { id: 'acc-savings', name: 'Savings', kind: 'savings', openingBalance: 5000, color: 'var(--lime)' },
  { id: 'acc-credit', name: 'Credit card', kind: 'credit', openingBalance: 0, color: 'var(--pink)' },
];

const MONTHLY: { day: number; description: string; category: CategoryId; amount: number; type: 'income' | 'expense'; account: string }[] = [
  { day: 1, description: 'Acme Corp Salary', category: 'salary', amount: 3200, type: 'income', account: 'acc-checking' },
  { day: 3, description: 'Rent', category: 'bills', amount: 900, type: 'expense', account: 'acc-checking' },
  { day: 5, description: 'Spotify', category: 'entertainment', amount: 10.99, type: 'expense', account: 'acc-credit' },
  { day: 8, description: 'Gym membership', category: 'health', amount: 29, type: 'expense', account: 'acc-checking' },
  { day: 12, description: 'Netflix', category: 'entertainment', amount: 15.49, type: 'expense', account: 'acc-credit' },
  { day: 15, description: 'Phone bill', category: 'bills', amount: 35, type: 'expense', account: 'acc-checking' },
  { day: 20, description: 'Internet', category: 'bills', amount: 45, type: 'expense', account: 'acc-checking' },
  { day: 25, description: 'Freelance gig', category: 'salary', amount: 350, type: 'income', account: 'acc-checking' },
];

const DAILY: { category: CategoryId; chance: number; min: number; max: number; account: string; names: string[] }[] = [
  { category: 'food', chance: 0.7, min: 6, max: 38, account: 'acc-checking', names: ['Whole Foods Market', 'Chipotle', 'Starbucks', 'Sweetgreen', "Trader Joe's", 'Pizza night'] },
  { category: 'transport', chance: 0.35, min: 2.5, max: 24, account: 'acc-checking', names: ['Uber Rides', 'Metro card', 'Lime scooter', 'Gas station'] },
  { category: 'shopping', chance: 0.12, min: 15, max: 120, account: 'acc-credit', names: ['Zara', 'Amazon', 'Nike', 'Uniqlo'] },
  { category: 'entertainment', chance: 0.12, min: 8, max: 70, account: 'acc-credit', names: ['PlayStation Store', 'Cinema', 'Concert tickets', 'Steam'] },
  { category: 'health', chance: 0.04, min: 10, max: 60, account: 'acc-checking', names: ['Pharmacy', 'Dentist copay'] },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function createSeedData(now: Date, profile: Partial<Profile> = {}): FinanceData {
  const rand = mulberry32(42);
  const today = toISODate(now);
  const start = addMonths(startOfMonth(today), -5);
  const transactions: Transaction[] = [];
  let n = 0;
  const push = (t: Omit<Transaction, 'id'>) => transactions.push({ id: `seed-tx-${++n}`, ...t });
  const transfer = (date: string, from: string, to: string, amount: number, description: string) => {
    const transferId = `seed-tr-${n + 1}`;
    const base = { date, description, amount, type: 'transfer' as const, category: 'other' as const, transferId };
    push({ ...base, accountId: from, direction: 'out' });
    push({ ...base, accountId: to, direction: 'in' });
  };

  for (let date = start; date <= today; date = addDays(date, 1)) {
    const day = Number(date.slice(8));
    for (const m of MONTHLY) {
      if (m.day === day) push({ date, description: m.description, amount: m.amount, type: m.type, category: m.category, accountId: m.account });
    }
    if (day === 2 || day === 16) transfer(date, 'acc-checking', 'acc-savings', 200, 'To Savings');
    if (day === 22) transfer(date, 'acc-checking', 'acc-credit', 350, 'Card payment');
    for (const d of DAILY) {
      if (rand() < d.chance) {
        push({
          date,
          description: d.names[Math.floor(rand() * d.names.length)],
          amount: round2(d.min + rand() * (d.max - d.min)),
          type: 'expense',
          category: d.category,
          accountId: d.account,
        });
      }
    }
  }

  const monthlyBill = (id: string, name: string, amount: number, category: CategoryId, accountId: string, dueDate: string): Payment =>
    ({ id, name, amount, category, accountId, dueDate, recurrence: 'monthly', lastPaidDate: addMonths(dueDate, -1) });
  const paidBill = (id: string, name: string, amount: number, category: CategoryId, accountId: string, paidOn: string): Payment =>
    ({ id, name, amount, category, accountId, dueDate: addMonths(paidOn, 1), recurrence: 'monthly', lastPaidDate: paidOn });

  const payments: Payment[] = [
    monthlyBill('seed-pay-rent', 'Rent', 900, 'bills', 'acc-checking', addDays(today, 3)),
    paidBill('seed-pay-spotify', 'Spotify', 10.99, 'entertainment', 'acc-credit', addDays(today, -2)),
    monthlyBill('seed-pay-netflix', 'Netflix', 15.49, 'entertainment', 'acc-credit', addDays(today, 9)),
    monthlyBill('seed-pay-phone', 'Phone bill', 35, 'bills', 'acc-checking', addDays(today, -2)),
    monthlyBill('seed-pay-gym', 'Gym membership', 29, 'health', 'acc-checking', addDays(today, 12)),
    paidBill('seed-pay-internet', 'Internet', 45, 'bills', 'acc-checking', addDays(today, -1)),
  ];

  const goals: Goal[] = [
    { id: 'seed-goal-laptop', name: 'New laptop', emoji: '💻', target: 1500, saved: 600, deadline: addMonths(today, 3) },
    { id: 'seed-goal-japan', name: 'Trip to Japan', emoji: '🗾', target: 4000, saved: 600, deadline: addMonths(today, 10) },
  ];

  return {
    ...emptyData({ nickname: 'Alex', avatar: '😎', ...profile }),
    onboarding: { setupDone: true, tourDone: false },
    accounts: ACCOUNTS.map(a => ({ ...a })),
    transactions,
    payments,
    goals,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/data/seed.test.ts`
Expected: PASS (7 tests). `Map.groupBy` needs Node ≥ 21, and Node 22 is installed. If the transaction count assertion fails, print `data.transactions.length` and report it rather than lowering the bar silently.

- [ ] **Step 5: Commit**

```bash
git add src/data/seed.ts src/data/seed.test.ts
git commit -m "feat: add deterministic demo seed data"
```

---

### Task 7: Transaction filters and CSV export

**Files:**
- Create: `src/lib/filters.ts`, `src/lib/csv.ts`
- Test: `src/lib/filters.test.ts`, `src/lib/csv.test.ts`

**Interfaces:**
- Consumes: types, `dates`, `CATEGORIES`, `CATEGORY_IDS`, `txVisual` (Task 2), `txEffect` (Task 5)
- Produces:
  - `type DatePreset = '7d' | '30d' | '90d' | 'all' | 'custom'; type SortKey = 'date' | 'description' | 'category' | 'account' | 'amount'; type SortDir = 'asc' | 'desc'`
  - `interface Filters { q: string; preset: DatePreset; from?: ISODate; to?: ISODate; types: TxType[]; categories: CategoryId[]; accountId?: ID; min?: number; max?: number; sort: { key: SortKey; dir: SortDir }; page: number; pageSize: number }`
  - `DEFAULT_FILTERS: Filters`
  - `applyFilters(txs, f, today): Transaction[]`; `sortTxs(txs, sort, accountNames: Record<ID, string>): Transaction[]`
  - `interface Page<T> { rows: T[]; page: number; totalPages: number; total: number }` and `paginate<T>(items, page, pageSize): Page<T>`
  - `filtersToParams(f): URLSearchParams`; `filtersFromParams(p: URLSearchParams): Filters`; `activeFilterCount(f): number`
  - `toCsv(txs, accountNames): string`; `downloadCsv(filename, csv): void`

- [ ] **Step 1: Write the failing filter tests**

`src/lib/filters.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types';
import {
  DEFAULT_FILTERS, activeFilterCount, applyFilters, filtersFromParams, filtersToParams, paginate, sortTxs, type Filters,
} from './filters';

let n = 0;
const tx = (p: Partial<Transaction>): Transaction => ({
  id: `t${++n}`, date: '2026-09-20', description: 'Coffee', amount: 5, type: 'expense', category: 'food', accountId: 'a', ...p,
});
const today = '2026-09-24';
const txs = [
  tx({ description: 'Salary', type: 'income', category: 'salary', amount: 3000, date: '2026-09-01' }),
  tx({ description: 'Uber', category: 'transport', amount: 12, date: '2026-09-23', accountId: 'b' }),
  tx({ description: 'Old pizza', amount: 20, date: '2026-06-01' }),
  tx({ description: 'Coffee', amount: 5, date: '2026-09-24' }),
];
const f = (patch: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...patch });
const names = { a: 'Checking', b: 'Savings' };

describe('applyFilters', () => {
  it('defaults to the last 30 days', () => {
    expect(applyFilters(txs, DEFAULT_FILTERS, today).map(t => t.description)).toEqual(['Salary', 'Uber', 'Coffee']);
  });

  it('applies presets, including all and custom ranges', () => {
    expect(applyFilters(txs, f({ preset: '7d' }), today)).toHaveLength(2);
    expect(applyFilters(txs, f({ preset: 'all' }), today)).toHaveLength(4);
    expect(applyFilters(txs, f({ preset: 'custom', from: '2026-06-01', to: '2026-06-30' }), today).map(t => t.description)).toEqual(['Old pizza']);
  });

  it('searches description and category label case-insensitively', () => {
    expect(applyFilters(txs, f({ preset: 'all', q: 'UBER' }), today)).toHaveLength(1);
    expect(applyFilters(txs, f({ preset: 'all', q: 'transp' }), today)).toHaveLength(1);
  });

  it('filters by type, category, account and amount range', () => {
    expect(applyFilters(txs, f({ preset: 'all', types: ['income'] }), today)).toHaveLength(1);
    expect(applyFilters(txs, f({ preset: 'all', categories: ['food'] }), today)).toHaveLength(2);
    expect(applyFilters(txs, f({ preset: 'all', accountId: 'b' }), today)).toHaveLength(1);
    expect(applyFilters(txs, f({ preset: 'all', min: 10, max: 100 }), today).map(t => t.amount)).toEqual([12, 20]);
  });
});

describe('sortTxs and paginate', () => {
  it('sorts by each key in both directions', () => {
    expect(sortTxs(txs, { key: 'date', dir: 'desc' }, names)[0].description).toBe('Coffee');
    expect(sortTxs(txs, { key: 'amount', dir: 'desc' }, names)[0].description).toBe('Salary');
    expect(sortTxs(txs, { key: 'amount', dir: 'asc' }, names)[0].description).toBe('Old pizza');
    expect(sortTxs(txs, { key: 'description', dir: 'asc' }, names)[0].description).toBe('Coffee');
    expect(sortTxs(txs, { key: 'account', dir: 'desc' }, names)[0].description).toBe('Uber');
    expect(sortTxs(txs, { key: 'category', dir: 'asc' }, names)[0].category).toBe('food');
  });

  it('paginates and clamps out-of-range pages', () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(paginate(items, 3, 10)).toEqual({ rows: [20, 21, 22], page: 3, totalPages: 3, total: 23 });
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate([], 1, 10)).toEqual({ rows: [], page: 1, totalPages: 1, total: 0 });
  });
});

describe('URL params', () => {
  it('omits defaults', () => {
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('round-trips every field', () => {
    const full = f({
      q: 'pizza night', preset: 'custom', from: '2026-06-01', to: '2026-06-30', types: ['expense', 'transfer'],
      categories: ['food', 'travel'], accountId: 'b', min: 5, max: 99.5, sort: { key: 'amount', dir: 'asc' }, page: 3,
    });
    expect(filtersFromParams(filtersToParams(full))).toEqual(full);
  });

  it('ignores junk from hand-edited URLs', () => {
    const p = new URLSearchParams('page=abc&min=-5&max=lots&type=bogus,income&cat=nope&range=forever&sort=hax:up&from=2026-13-01');
    expect(filtersFromParams(p)).toEqual(f({ types: ['income'] }));
  });

  it('counts active filters', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount(f({ q: 'x', preset: '7d', types: ['income'], min: 1 }))).toBe(4);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/filters.test.ts`
Expected: FAIL, because it cannot resolve `./filters`.

- [ ] **Step 3: Implement `src/lib/filters.ts`**

```ts
import type { CategoryId, ID, Transaction, TxType } from '../types';
import { CATEGORIES, CATEGORY_IDS } from './categories';
import { addDays, isValidISODate, type ISODate } from './dates';
import { txEffect } from './finance';

export type DatePreset = '7d' | '30d' | '90d' | 'all' | 'custom';
export type SortKey = 'date' | 'description' | 'category' | 'account' | 'amount';
export type SortDir = 'asc' | 'desc';

export interface Filters {
  q: string;
  preset: DatePreset;
  from?: ISODate;
  to?: ISODate;
  types: TxType[];
  categories: CategoryId[];
  accountId?: ID;
  min?: number;
  max?: number;
  sort: { key: SortKey; dir: SortDir };
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: Filters = {
  q: '', preset: '30d', types: [], categories: [], sort: { key: 'date', dir: 'desc' }, page: 1, pageSize: 10,
};

const PRESET_DAYS = { '7d': 7, '30d': 30, '90d': 90 } as const;
const PRESETS: DatePreset[] = ['7d', '30d', '90d', 'all', 'custom'];
const TYPES: TxType[] = ['income', 'expense', 'transfer'];
const SORT_KEYS: SortKey[] = ['date', 'description', 'category', 'account', 'amount'];

export function applyFilters(txs: Transaction[], f: Filters, today: ISODate): Transaction[] {
  let from: ISODate | undefined;
  let to: ISODate | undefined;
  if (f.preset === 'custom') {
    from = f.from;
    to = f.to;
  } else if (f.preset !== 'all') {
    from = addDays(today, -(PRESET_DAYS[f.preset] - 1));
  }
  const q = f.q.trim().toLowerCase();
  return txs.filter(t =>
    (!from || t.date >= from)
    && (!to || t.date <= to)
    && (f.types.length === 0 || f.types.includes(t.type))
    && (f.categories.length === 0 || f.categories.includes(t.category))
    && (!f.accountId || t.accountId === f.accountId)
    && (f.min === undefined || t.amount >= f.min)
    && (f.max === undefined || t.amount <= f.max)
    && (!q || t.description.toLowerCase().includes(q) || CATEGORIES[t.category].label.toLowerCase().includes(q)));
}

export function sortTxs(txs: Transaction[], sort: Filters['sort'], accountNames: Record<ID, string>): Transaction[] {
  const value = (t: Transaction): string | number => {
    switch (sort.key) {
      case 'date': return t.date;
      case 'description': return t.description.toLowerCase();
      case 'category': return CATEGORIES[t.category].label;
      case 'account': return accountNames[t.accountId] ?? '';
      case 'amount': return txEffect(t);
    }
  };
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...txs].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return cmp * dir || b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
  });
}

export interface Page<T> { rows: T[]; page: number; totalPages: number; total: number }

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  return { rows: items.slice((p - 1) * pageSize, p * pageSize), page: p, totalPages, total: items.length };
}

export function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.preset !== DEFAULT_FILTERS.preset) p.set('range', f.preset);
  if (f.preset === 'custom' && f.from) p.set('from', f.from);
  if (f.preset === 'custom' && f.to) p.set('to', f.to);
  if (f.types.length) p.set('type', f.types.join(','));
  if (f.categories.length) p.set('cat', f.categories.join(','));
  if (f.accountId) p.set('account', f.accountId);
  if (f.min !== undefined) p.set('min', String(f.min));
  if (f.max !== undefined) p.set('max', String(f.max));
  if (f.sort.key !== 'date' || f.sort.dir !== 'desc') p.set('sort', `${f.sort.key}:${f.sort.dir}`);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

const list = <T extends string>(raw: string | null, allowed: readonly T[]): T[] =>
  (raw ?? '').split(',').filter((v): v is T => (allowed as readonly string[]).includes(v));

const amount = (raw: string | null): number | undefined => {
  if (raw === null || raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function filtersFromParams(p: URLSearchParams): Filters {
  const range = p.get('range');
  const preset = PRESETS.includes(range as DatePreset) ? (range as DatePreset) : DEFAULT_FILTERS.preset;
  const [key, dir] = (p.get('sort') ?? '').split(':');
  const page = Number(p.get('page'));
  const from = p.get('from');
  const to = p.get('to');
  const f: Filters = {
    ...DEFAULT_FILTERS,
    q: p.get('q') ?? '',
    preset,
    types: list(p.get('type'), TYPES),
    categories: list(p.get('cat'), CATEGORY_IDS),
    sort: SORT_KEYS.includes(key as SortKey) && (dir === 'asc' || dir === 'desc')
      ? { key: key as SortKey, dir }
      : DEFAULT_FILTERS.sort,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
  if (preset === 'custom' && from && isValidISODate(from)) f.from = from;
  if (preset === 'custom' && to && isValidISODate(to)) f.to = to;
  const account = p.get('account');
  if (account) f.accountId = account;
  const min = amount(p.get('min'));
  const max = amount(p.get('max'));
  if (min !== undefined) f.min = min;
  if (max !== undefined) f.max = max;
  return f;
}

export function activeFilterCount(f: Filters): number {
  return [
    f.q.trim() !== '', f.preset !== DEFAULT_FILTERS.preset, f.types.length > 0, f.categories.length > 0,
    !!f.accountId, f.min !== undefined, f.max !== undefined,
  ].filter(Boolean).length;
}
```

Note: the round-trip test expects `toEqual(full)`. `filtersFromParams` only sets optional keys when present, so `undefined` keys never appear, and `toEqual` treats missing and `undefined` keys as equal anyway.

- [ ] **Step 4: Run the filter tests to verify they pass**

Run: `npm test -- src/lib/filters.test.ts`
Expected: PASS. In the junk-URL test, `from` is ignored because `range` fell back to `30d`.

- [ ] **Step 5: Write the failing CSV tests**

`src/lib/csv.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types';
import { toCsv } from './csv';

const base: Transaction = { id: '1', date: '2026-09-10', description: 'x', amount: 10, type: 'expense', category: 'food', accountId: 'a' };

describe('toCsv', () => {
  it('writes a header and signed amounts', () => {
    const csv = toCsv([base, { ...base, id: '2', type: 'income', category: 'salary', amount: 3200 }], { a: 'Checking' });
    expect(csv.split('\r\n')).toEqual([
      'Date,Description,Category,Type,Account,Amount',
      '2026-09-10,x,Food,expense,Checking,-10.00',
      '2026-09-10,x,Salary,income,Checking,3200.00',
    ]);
  });

  it('escapes commas, quotes and newlines', () => {
    const csv = toCsv([{ ...base, description: 'Pizza, "extra" cheese\nlate' }], { a: 'Checking' });
    expect(csv.split('\r\n')[1]).toBe('2026-09-10,"Pizza, ""extra"" cheese\nlate",Food,expense,Checking,-10.00');
  });

  it('neutralizes spreadsheet formulas in text cells', () => {
    const csv = toCsv([{ ...base, description: '=HYPERLINK("x")' }, { ...base, description: '@cmd' }], { a: '+Acct' });
    const [, a, b] = csv.split('\r\n');
    expect(a).toBe(`2026-09-10,"'=HYPERLINK(""x"")",Food,expense,'+Acct,-10.00`);
    expect(b).toBe("2026-09-10,'@cmd,Food,expense,'+Acct,-10.00");
  });

  it('labels transfers and unknown accounts', () => {
    const csv = toCsv([{ ...base, type: 'transfer', direction: 'in', accountId: 'gone' }], {});
    expect(csv.split('\r\n')[1]).toBe('2026-09-10,x,Transfer,transfer,,10.00');
  });
});
```

- [ ] **Step 6: Implement `src/lib/csv.ts`**

```ts
import type { ID, Transaction } from '../types';
import { txVisual } from './categories';
import { txEffect } from './finance';

function cell(v: string | number): string {
  if (typeof v === 'number') return v.toFixed(2);
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(txs: Transaction[], accountNames: Record<ID, string>): string {
  const rows = txs.map(t => [t.date, t.description, txVisual(t).label, t.type, accountNames[t.accountId] ?? '', txEffect(t)].map(cell).join(','));
  return ['Date,Description,Category,Type,Account,Amount', ...rows].join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 7: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/filters.ts src/lib/filters.test.ts src/lib/csv.ts src/lib/csv.test.ts
git commit -m "feat: add transaction filters, URL sync and CSV export"
```

---

### Task 8: Amount parsing and form validation

**Files:**
- Create: `src/lib/validation.ts`
- Test: `src/lib/validation.test.ts`

**Interfaces:**
- Consumes: `dates` (Task 2), types
- Produces:
  - `MAX_AMOUNT = 1_000_000`; `parseAmount(raw: string, allowNegative = false): number | null`
  - `type Errors<K extends string> = Partial<Record<K, string>>`; `isValid(errors): boolean`
  - `interface TxForm { type: 'income' | 'expense'; amount: string; description: string; category: CategoryId; accountId: string; date: string }` and `validateTransaction(f, accountIds: string[], today): Errors<keyof TxForm>`
  - `interface TransferForm { fromId: string; toId: string; amount: string; date: string; description: string }` and `validateTransfer(f, accountIds, today)`
  - `interface PaymentForm { name: string; amount: string; category: CategoryId; accountId: string; dueDate: string; recurrence: Recurrence }` and `validatePayment(f, accountIds, today)`
  - `interface GoalForm { name: string; emoji: string; target: string; deadline: string }` and `validateGoal(f, today)`
  - `interface AccountForm { name: string; kind: AccountKind; openingBalance: string; color: string }` and `validateAccount(f)`
  - `amountError(raw): string | undefined`

- [ ] **Step 1: Write the failing tests**

`src/lib/validation.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  isValid, parseAmount, validateAccount, validateGoal, validatePayment, validateTransaction, validateTransfer, type TxForm,
} from './validation';

const today = '2026-09-24';
const txForm = (p: Partial<TxForm> = {}): TxForm => ({
  type: 'expense', amount: '12.50', description: 'Pizza', category: 'food', accountId: 'a', date: today, ...p,
});

describe('parseAmount', () => {
  it('accepts plain and grouped numbers, rounding to cents', () => {
    expect(parseAmount('12')).toBe(12);
    expect(parseAmount(' 1,234.50 ')).toBe(1234.5);
    expect(parseAmount('12.')).toBe(12);
    expect(parseAmount('.5')).toBe(0.5);
    expect(parseAmount('0')).toBe(0);
  });

  it('rejects junk, exponents and negatives unless allowed', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('1e9')).toBeNull();
    expect(parseAmount('12.345')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('-5', true)).toBe(-5);
  });
});

describe('validateTransaction', () => {
  it('passes a valid form', () => {
    expect(isValid(validateTransaction(txForm(), ['a'], today))).toBe(true);
  });

  it('flags each bad field with a friendly message', () => {
    expect(validateTransaction(txForm({ amount: 'abc' }), ['a'], today).amount).toBe('Enter an amount like 12.50');
    expect(validateTransaction(txForm({ amount: '0' }), ['a'], today).amount).toBe('Amount must be more than 0');
    expect(validateTransaction(txForm({ amount: '2000000' }), ['a'], today).amount).toMatch(/1,000,000/);
    expect(validateTransaction(txForm({ description: '   ' }), ['a'], today).description).toBe('Add a short description');
    expect(validateTransaction(txForm({ accountId: 'zzz' }), ['a'], today).accountId).toBe('Choose an account');
    expect(validateTransaction(txForm({ date: '2026-02-30' }), ['a'], today).date).toBe('Pick a valid date');
    expect(validateTransaction(txForm({ date: '2028-01-01' }), ['a'], today).date).toBe('Dates can be at most a year ahead');
  });
});

describe('other validators', () => {
  it('requires two different accounts for a transfer', () => {
    const errs = validateTransfer({ fromId: 'a', toId: 'a', amount: '5', date: today, description: 'x' }, ['a', 'b'], today);
    expect(errs.toId).toBe('Pick two different accounts');
  });

  it('validates payments', () => {
    const errs = validatePayment({ name: '', amount: '-1', category: 'bills', accountId: 'a', dueDate: 'soon', recurrence: 'monthly' }, ['a'], today);
    expect(Object.keys(errs).sort()).toEqual(['amount', 'dueDate', 'name']);
  });

  it('validates goals with an optional future deadline', () => {
    expect(isValid(validateGoal({ name: 'Laptop', emoji: '💻', target: '1500', deadline: '' }, today))).toBe(true);
    expect(validateGoal({ name: 'Laptop', emoji: '💻', target: '1500', deadline: '2020-01-01' }, today).deadline).toBe('Pick a future date');
  });

  it('allows negative opening balances for accounts', () => {
    expect(isValid(validateAccount({ name: 'Card', kind: 'credit', openingBalance: '-120', color: 'var(--pink)' }))).toBe(true);
    expect(validateAccount({ name: 'Card', kind: 'credit', openingBalance: 'x', color: '' }).openingBalance).toBe('Enter a balance like 250 or -120');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/validation.test.ts`
Expected: FAIL, because it cannot resolve `./validation`.

- [ ] **Step 3: Implement `src/lib/validation.ts`**

```ts
import type { AccountKind, CategoryId, Recurrence } from '../types';
import { addDays, isValidISODate, type ISODate } from './dates';

export const MAX_AMOUNT = 1_000_000;

export function parseAmount(raw: string, allowNegative = false): number | null {
  const s = raw.trim().replace(/,/g, '');
  if (!/^-?(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || (!allowNegative && n < 0)) return null;
  return Math.round(n * 100) / 100;
}

export type Errors<K extends string> = Partial<Record<K, string>>;
export const isValid = (errors: object): boolean => Object.keys(errors).length === 0;

export function amountError(raw: string): string | undefined {
  const n = parseAmount(raw);
  if (n === null) return 'Enter an amount like 12.50';
  if (n <= 0) return 'Amount must be more than 0';
  if (n > MAX_AMOUNT) return "That's over 1,000,000. Keep it realistic 😅";
  return undefined;
}

function dateError(date: string, today: ISODate): string | undefined {
  if (!isValidISODate(date)) return 'Pick a valid date';
  if (date > addDays(today, 365)) return 'Dates can be at most a year ahead';
  return undefined;
}

function textError(v: string, max: number, empty: string): string | undefined {
  if (!v.trim()) return empty;
  if (v.trim().length > max) return `Keep it under ${max} characters`;
  return undefined;
}

/** Drops undefined entries so isValid() works. */
function clean<K extends string>(errors: Record<K, string | undefined>): Errors<K> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Errors<K>;
}

export interface TxForm { type: 'income' | 'expense'; amount: string; description: string; category: CategoryId; accountId: string; date: string }

export function validateTransaction(f: TxForm, accountIds: string[], today: ISODate): Errors<keyof TxForm> {
  return clean({
    type: undefined,
    category: undefined,
    amount: amountError(f.amount),
    description: textError(f.description, 60, 'Add a short description'),
    accountId: accountIds.includes(f.accountId) ? undefined : 'Choose an account',
    date: dateError(f.date, today),
  });
}

export interface TransferForm { fromId: string; toId: string; amount: string; date: string; description: string }

export function validateTransfer(f: TransferForm, accountIds: string[], today: ISODate): Errors<keyof TransferForm> {
  return clean({
    fromId: accountIds.includes(f.fromId) ? undefined : 'Choose an account',
    toId: !accountIds.includes(f.toId) ? 'Choose an account' : f.toId === f.fromId ? 'Pick two different accounts' : undefined,
    amount: amountError(f.amount),
    date: dateError(f.date, today),
    description: textError(f.description, 60, 'Add a short description'),
  });
}

export interface PaymentForm { name: string; amount: string; category: CategoryId; accountId: string; dueDate: string; recurrence: Recurrence }

export function validatePayment(f: PaymentForm, accountIds: string[], today: ISODate): Errors<keyof PaymentForm> {
  return clean({
    category: undefined,
    recurrence: undefined,
    name: textError(f.name, 40, 'Give the bill a name'),
    amount: amountError(f.amount),
    accountId: accountIds.includes(f.accountId) ? undefined : 'Choose an account',
    dueDate: dateError(f.dueDate, today),
  });
}

export interface GoalForm { name: string; emoji: string; target: string; deadline: string }

export function validateGoal(f: GoalForm, today: ISODate): Errors<keyof GoalForm> {
  return clean({
    emoji: undefined,
    name: textError(f.name, 40, 'Name your goal'),
    target: amountError(f.target),
    deadline: f.deadline && (!isValidISODate(f.deadline) || f.deadline < today) ? 'Pick a future date' : undefined,
  });
}

export interface AccountForm { name: string; kind: AccountKind; openingBalance: string; color: string }

export function validateAccount(f: AccountForm): Errors<keyof AccountForm> {
  const n = parseAmount(f.openingBalance || '0', true);
  return clean({
    kind: undefined,
    color: undefined,
    name: textError(f.name, 30, 'Name the account'),
    openingBalance: n === null ? 'Enter a balance like 250 or -120' : Math.abs(n) > MAX_AMOUNT ? "That's over 1,000,000. Keep it realistic 😅" : undefined,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/validation.test.ts
git commit -m "feat: add amount parsing and form validation"
```

---

### Task 9: Finance reducer

**Files:**
- Create: `src/state/financeReducer.ts`
- Test: `src/state/financeReducer.test.ts`

**Interfaces:**
- Consumes: types, `addMonths` (Task 2), `round2` (Task 5), `emptyData` (Task 4, tests)
- Produces:
  - `type FinanceAction = { type: 'addTx'; tx: Transaction } | { type: 'editTx'; tx: Transaction } | { type: 'deleteTx'; id: ID } | { type: 'transfer'; legs: [Transaction, Transaction] } | { type: 'payBill'; paymentId: ID; txId: ID; today: ISODate } | { type: 'addPayment' | 'editPayment'; payment: Payment } | { type: 'deletePayment'; id: ID } | { type: 'addAccount' | 'editAccount'; account: Account } | { type: 'deleteAccount'; id: ID } | { type: 'addGoal'; goal: Goal } | { type: 'fundGoal'; id: ID; amount: number } | { type: 'deleteGoal'; id: ID } | { type: 'setProfile'; profile: Partial<Profile> } | { type: 'setOnboarding'; onboarding: Partial<Onboarding> } | { type: 'replaceAll'; data: FinanceData }`
  - `financeReducer(state: FinanceData, action: FinanceAction): FinanceData` (returns the **same reference** for no-ops)
  - `accountInUse(state, id): boolean`
  - `createTransferLegs(input: { fromId; toId; amount; date; description }, ids: { transferId; outId; inId }): [Transaction, Transaction]`
  - `newId(): string` (`crypto.randomUUID()`)

- [ ] **Step 1: Write the failing tests**

`src/state/financeReducer.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { FinanceData, Payment, Transaction } from '../types';
import { emptyData } from '../data/defaults';
import { createTransferLegs, financeReducer } from './financeReducer';

const tx: Transaction = { id: 't1', date: '2026-09-10', description: 'Pizza', amount: 20, type: 'expense', category: 'food', accountId: 'a' };
const rent: Payment = { id: 'p1', name: 'Rent', amount: 900, category: 'bills', accountId: 'a', dueDate: '2026-01-31', recurrence: 'monthly' };
const base = (): FinanceData => ({
  ...emptyData(),
  accounts: [
    { id: 'a', name: 'Checking', kind: 'checking', openingBalance: 100, color: 'var(--violet)' },
    { id: 'b', name: 'Savings', kind: 'savings', openingBalance: 0, color: 'var(--lime)' },
  ],
});

describe('financeReducer', () => {
  it('adds, edits and deletes transactions', () => {
    let s = financeReducer(base(), { type: 'addTx', tx });
    s = financeReducer(s, { type: 'editTx', tx: { ...tx, amount: 25 } });
    expect(s.transactions).toEqual([{ ...tx, amount: 25 }]);
    s = financeReducer(s, { type: 'deleteTx', id: 't1' });
    expect(s.transactions).toEqual([]);
  });

  it('creates transfers and deletes both legs from either side', () => {
    const legs = createTransferLegs({ fromId: 'a', toId: 'b', amount: 50, date: '2026-09-10', description: 'Save' }, { transferId: 'x', outId: 'o', inId: 'i' });
    let s = financeReducer(base(), { type: 'transfer', legs });
    expect(s.transactions.map(t => [t.accountId, t.direction])).toEqual([['a', 'out'], ['b', 'in']]);
    s = financeReducer(s, { type: 'deleteTx', id: 'i' });
    expect(s.transactions).toEqual([]);
  });

  it('refuses to edit transfers', () => {
    const legs = createTransferLegs({ fromId: 'a', toId: 'b', amount: 50, date: '2026-09-10', description: 'Save' }, { transferId: 'x', outId: 'o', inId: 'i' });
    const s = financeReducer(base(), { type: 'transfer', legs });
    expect(financeReducer(s, { type: 'editTx', tx: { ...legs[0], amount: 1 } })).toBe(s);
  });

  it('pays a monthly bill: records an expense and advances the month-end due date', () => {
    let s = financeReducer(base(), { type: 'addPayment', payment: rent });
    s = financeReducer(s, { type: 'payBill', paymentId: 'p1', txId: 'pay-tx', today: '2026-02-01' });
    expect(s.payments[0]).toMatchObject({ dueDate: '2026-02-28', lastPaidDate: '2026-02-01' });
    expect(s.transactions).toEqual([{ id: 'pay-tx', date: '2026-02-01', description: 'Rent', amount: 900, type: 'expense', category: 'bills', accountId: 'a' }]);
  });

  it('pays a one-time bill without moving its due date', () => {
    let s = financeReducer(base(), { type: 'addPayment', payment: { ...rent, recurrence: 'none' } });
    s = financeReducer(s, { type: 'payBill', paymentId: 'p1', txId: 'x', today: '2026-02-01' });
    expect(s.payments[0].dueDate).toBe('2026-01-31');
  });

  it('blocks deleting an account that is in use', () => {
    const s = financeReducer(base(), { type: 'addTx', tx });
    expect(financeReducer(s, { type: 'deleteAccount', id: 'a' })).toBe(s);
    expect(financeReducer(s, { type: 'deleteAccount', id: 'b' }).accounts.map(a => a.id)).toEqual(['a']);
  });

  it('caps goal funding at the target and ignores non-positive amounts', () => {
    let s = financeReducer(base(), { type: 'addGoal', goal: { id: 'g', name: 'Laptop', emoji: '💻', target: 100, saved: 90 } });
    expect(financeReducer(s, { type: 'fundGoal', id: 'g', amount: -5 })).toBe(s);
    s = financeReducer(s, { type: 'fundGoal', id: 'g', amount: 50 });
    expect(s.goals[0].saved).toBe(100);
  });

  it('merges profile and onboarding patches', () => {
    let s = financeReducer(base(), { type: 'setProfile', profile: { nickname: 'Sam' } });
    s = financeReducer(s, { type: 'setOnboarding', onboarding: { tourDone: true } });
    expect(s.profile.nickname).toBe('Sam');
    expect(s.profile.currency).toBe('USD');
    expect(s.onboarding).toEqual({ setupDone: false, tourDone: true });
  });

  it('returns the same state for unknown ids', () => {
    const s = base();
    expect(financeReducer(s, { type: 'deleteTx', id: 'nope' })).toBe(s);
    expect(financeReducer(s, { type: 'payBill', paymentId: 'nope', txId: 'x', today: '2026-01-01' })).toBe(s);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/state/financeReducer.test.ts`
Expected: FAIL, because it cannot resolve `./financeReducer`.

- [ ] **Step 3: Implement `src/state/financeReducer.ts`**

```ts
import type { Account, FinanceData, Goal, ID, Onboarding, Payment, Profile, Transaction } from '../types';
import { addMonths, type ISODate } from '../lib/dates';
import { round2 } from '../lib/finance';

export type FinanceAction =
  | { type: 'addTx'; tx: Transaction }
  | { type: 'editTx'; tx: Transaction }
  | { type: 'deleteTx'; id: ID }
  | { type: 'transfer'; legs: [Transaction, Transaction] }
  | { type: 'payBill'; paymentId: ID; txId: ID; today: ISODate }
  | { type: 'addPayment' | 'editPayment'; payment: Payment }
  | { type: 'deletePayment'; id: ID }
  | { type: 'addAccount' | 'editAccount'; account: Account }
  | { type: 'deleteAccount'; id: ID }
  | { type: 'addGoal'; goal: Goal }
  | { type: 'fundGoal'; id: ID; amount: number }
  | { type: 'deleteGoal'; id: ID }
  | { type: 'setProfile'; profile: Partial<Profile> }
  | { type: 'setOnboarding'; onboarding: Partial<Onboarding> }
  | { type: 'replaceAll'; data: FinanceData };

export const newId = (): string => crypto.randomUUID();

const replace = <T extends { id: ID }>(list: T[], item: T): T[] => list.map(x => (x.id === item.id ? item : x));

export function accountInUse(state: FinanceData, id: ID): boolean {
  return state.transactions.some(t => t.accountId === id) || state.payments.some(p => p.accountId === id);
}

export function createTransferLegs(
  input: { fromId: ID; toId: ID; amount: number; date: ISODate; description: string },
  ids: { transferId: ID; outId: ID; inId: ID },
): [Transaction, Transaction] {
  const base = { date: input.date, description: input.description, amount: input.amount, type: 'transfer' as const, category: 'other' as const, transferId: ids.transferId };
  return [
    { ...base, id: ids.outId, accountId: input.fromId, direction: 'out' },
    { ...base, id: ids.inId, accountId: input.toId, direction: 'in' },
  ];
}

export function financeReducer(state: FinanceData, action: FinanceAction): FinanceData {
  switch (action.type) {
    case 'addTx':
      return { ...state, transactions: [...state.transactions, action.tx] };
    case 'editTx': {
      const old = state.transactions.find(t => t.id === action.tx.id);
      if (!old || old.type === 'transfer' || action.tx.type === 'transfer') return state;
      return { ...state, transactions: replace(state.transactions, action.tx) };
    }
    case 'deleteTx': {
      const t = state.transactions.find(x => x.id === action.id);
      if (!t) return state;
      return { ...state, transactions: state.transactions.filter(x => x.id !== t.id && !(t.transferId && x.transferId === t.transferId)) };
    }
    case 'transfer':
      return { ...state, transactions: [...state.transactions, ...action.legs] };
    case 'payBill': {
      const p = state.payments.find(x => x.id === action.paymentId);
      if (!p) return state;
      const tx: Transaction = { id: action.txId, date: action.today, description: p.name, amount: p.amount, type: 'expense', category: p.category, accountId: p.accountId };
      const months = p.recurrence === 'monthly' ? 1 : p.recurrence === 'yearly' ? 12 : 0;
      const paid: Payment = { ...p, lastPaidDate: action.today, dueDate: months ? addMonths(p.dueDate, months) : p.dueDate };
      return { ...state, transactions: [...state.transactions, tx], payments: replace(state.payments, paid) };
    }
    case 'addPayment':
      return { ...state, payments: [...state.payments, action.payment] };
    case 'editPayment':
      return { ...state, payments: replace(state.payments, action.payment) };
    case 'deletePayment':
      return { ...state, payments: state.payments.filter(p => p.id !== action.id) };
    case 'addAccount':
      return { ...state, accounts: [...state.accounts, action.account] };
    case 'editAccount':
      return { ...state, accounts: replace(state.accounts, action.account) };
    case 'deleteAccount':
      if (accountInUse(state, action.id)) return state;
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.id) };
    case 'addGoal':
      return { ...state, goals: [...state.goals, action.goal] };
    case 'fundGoal': {
      if (!(action.amount > 0) || !state.goals.some(g => g.id === action.id)) return state;
      return { ...state, goals: state.goals.map(g => (g.id === action.id ? { ...g, saved: Math.min(g.target, round2(g.saved + action.amount)) } : g)) };
    }
    case 'deleteGoal':
      return { ...state, goals: state.goals.filter(g => g.id !== action.id) };
    case 'setProfile':
      return { ...state, profile: { ...state.profile, ...action.profile } };
    case 'setOnboarding':
      return { ...state, onboarding: { ...state.onboarding, ...action.onboarding } };
    case 'replaceAll':
      return action.data;
  }
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test && npx tsc --noEmit`
Expected: PASS, with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/state
git commit -m "feat: add finance reducer"
```

---

### Task 10: Design tokens, global styles, icons and UI primitives

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/components.css`, `src/components/Icon.tsx`, `src/components/Field.tsx`, `src/components/Modal.tsx`, `src/components/EmptyState.tsx`, `src/components/StatusBadge.tsx`, `src/components/PageHeader.tsx`, `src/components/ErrorBoundary.tsx`, `src/components/useCountUp.ts`
- Modify: `src/main.tsx` (import the three stylesheets)

**Interfaces:**
- Produces CSS classes used by every later task: `.page .page-header .page-title .page-actions .card .card-flush .card-head .card-head.pad .card-title .btn .btn-primary .btn-glow .btn-secondary .btn-ghost .btn-danger .btn-sm .btn-block .icon-btn .field .field-label .label .field-error .form-error .form-grid .segmented .chip .chip-sm .badge .badge-paid .badge-upcoming .badge-overdue .emoji-circle .amount-in .muted .small .tabular .stack .row .modal .sheet .modal-body .modal-header .modal-actions .toast-stack .toast .empty .empty-emoji .chart .chart-tooltip .grid-line .axis-label .line-path .crosshair .focus-dot .bar-income .bar-expense .donut .donut-ring .donut-center .donut-legend .dot .ring .ring-label .card-emoji`
- Produces components:
  - `Icon({ name: IconName; size?: number })` with `IconName` = `'grid' | 'list' | 'wallet' | 'send' | 'target' | 'sliders' | 'logout' | 'plus' | 'x' | 'chevron-left' | 'chevron-right' | 'download' | 'filter' | 'edit' | 'trash' | 'search' | 'pulse' | 'more' | 'swap'`
  - `Field({ label; error?; children })`, `Modal({ title; onClose; variant?: 'dialog' | 'sheet'; children })`, `EmptyState({ emoji; title; text?; children? })`, `StatusBadge({ status: PaymentStatus })`, `PageHeader({ title; subtitle?; children? })`, `ErrorBoundary({ children })`
  - `useCountUp(target: number, ms = 600): number`

- [ ] **Step 1: Write `src/styles/tokens.css`**

```css
:root,
:root[data-theme='dark'] {
  color-scheme: dark;
  --bg: #0e0e1a;
  --surface: #171728;
  --surface-2: #20203a;
  --border: #2a2a45;
  --text: #f4f3ff;
  --text-muted: #9a98b8;
  --violet: #7c5cff;
  --lime: #c6f432;
  --pink: #ff5ca8;
  --amber: #ffb547;
  --cyan: #3fd8ff;
  --cat-6: #a78bfa;
  --cat-7: #ff8a65;
  --cat-8: #4ade80;
  --cat-9: #f472b6;
  --cat-10: #94a3b8;
  --on-lime: #0e0e1a;
  --grad-hero: linear-gradient(135deg, #7c5cff 0%, #ff5ca8 100%);
  --grad-lime: linear-gradient(135deg, #c6f432 0%, #3fd8ff 100%);
  --glow: 0 8px 32px rgba(124, 92, 255, 0.18);
  --overlay: rgba(8, 8, 20, 0.72);

  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --radius-card: 20px;
  --radius-btn: 14px;
  --radius-modal: 24px;
  --radius-pill: 999px;

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --sidebar-w: 240px;
  --sidebar-w-compact: 76px;
  --bottom-nav-h: 72px;
}

:root[data-theme='light'] {
  color-scheme: light;
  --bg: #f6f5fb;
  --surface: #ffffff;
  --surface-2: #efedf8;
  --border: #e2dff0;
  --text: #14142b;
  --text-muted: #5e5c7a;
  --violet: #6a48f5;
  --lime: #7fa300;
  --pink: #e63e8c;
  --amber: #d98a00;
  --cyan: #0096c7;
  --glow: 0 8px 32px rgba(106, 72, 245, 0.16);
  --overlay: rgba(20, 20, 43, 0.55);
}
```

- [ ] **Step 2: Write `src/styles/global.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font: 400 15px/1.5 var(--font-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
p { margin: 0; }
a { color: var(--violet); text-decoration: none; font-weight: 500; }
a:hover { text-decoration: underline; }
button { font: inherit; color: inherit; }
ul { list-style: none; margin: 0; padding: 0; }
:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
::selection { background: var(--violet); color: #fff; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: var(--surface-2); border-radius: 999px; }

.muted { color: var(--text-muted); }
.small { font-size: 13px; }
.tabular { font-variant-numeric: tabular-nums; }
.stack { display: flex; flex-direction: column; gap: 16px; }
.row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Write `src/styles/components.css`**

```css
/* ---------- Page ---------- */
.page { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
.page-title { font-size: clamp(24px, 4vw, 32px); }
.page-header p { margin-top: 4px; }
.page-actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* ---------- Cards ---------- */
.card {
  position: relative;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 20px;
  transition: transform 200ms var(--ease), box-shadow 200ms var(--ease);
}
.card-flush { padding: 0; overflow: hidden; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.card-head.pad { padding: 20px 20px 0; margin-bottom: 12px; }
.card-title { font: 600 16px var(--font-body); letter-spacing: 0; }
/* Big faded emoji in a card's bottom-right corner (approved dashboard tweak). */
.card-emoji {
  position: absolute; right: -14px; bottom: -18px;
  font-size: 80px; line-height: 1; opacity: 0.1;
  pointer-events: none; user-select: none;
}
@media (min-width: 768px) {
  .card { padding: 24px; }
  .card-flush { padding: 0; }
  .card-head.pad { padding: 24px 24px 0; }
}

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 44px; padding: 0 18px;
  border: 0; border-radius: var(--radius-btn);
  font: 600 14px/1 var(--font-body);
  white-space: nowrap; text-decoration: none; cursor: pointer;
  transition: transform 200ms var(--ease), background 200ms var(--ease), opacity 200ms;
}
.btn:hover { text-decoration: none; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn:not(:disabled):active { transform: scale(0.97); }
.btn-primary { background: var(--violet); color: #fff; }
.btn-primary:not(:disabled):hover { transform: translateY(-2px); }
.btn-glow { background: var(--grad-hero); box-shadow: var(--glow); }
.btn-secondary { background: var(--surface-2); color: var(--text); }
.btn-secondary:not(:disabled):hover { background: var(--border); }
.btn-ghost { background: transparent; color: var(--text-muted); }
.btn-ghost:hover { color: var(--text); }
.btn-danger { background: transparent; color: var(--pink); border: 1px solid currentColor; }
.btn-sm { height: 34px; padding: 0 12px; font-size: 13px; }
.btn-block { width: 100%; }
.icon-btn {
  display: inline-grid; place-items: center; flex-shrink: 0;
  width: 36px; height: 36px; border: 0; border-radius: 12px;
  background: transparent; color: var(--text-muted); cursor: pointer;
}
.icon-btn:hover { background: var(--surface-2); color: var(--text); }

/* ---------- Forms ---------- */
.field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
.field-label, .label {
  font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted);
}
.field input, .field select {
  width: 100%; height: 44px; padding: 0 14px;
  border: 2px solid transparent; border-radius: var(--radius-btn);
  background: var(--surface-2); color: var(--text); font: inherit; outline: none;
}
.field input:focus, .field select:focus { border-color: var(--violet); }
.field-error, .form-error { color: var(--pink); font-size: 13px; }
.form-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }

/* ---------- Segmented control ---------- */
.segmented { display: inline-flex; gap: 2px; padding: 4px; border-radius: var(--radius-btn); background: var(--surface-2); }
.segmented button {
  padding: 6px 14px; border: 1px solid transparent; border-radius: 10px;
  background: transparent; color: var(--text-muted); font: 500 13px var(--font-body); cursor: pointer;
}
.segmented button[aria-pressed='true'] { background: var(--surface); color: var(--text); border-color: var(--border); }

/* ---------- Chips, badges ---------- */
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-pill);
  background: var(--surface-2); color: var(--text); font: 500 14px var(--font-body);
}
button.chip { cursor: pointer; }
.chip[aria-pressed='true'] { background: var(--violet); border-color: var(--violet); color: #fff; }
.chip-sm { padding: 4px 10px; font-size: 12px; color: var(--text-muted); }
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: var(--radius-pill);
  background: var(--surface-2); color: var(--text-muted);
  font: 600 11px var(--font-body); letter-spacing: 0.08em; text-transform: uppercase;
}
.badge-paid { color: var(--lime); }
.badge-upcoming { color: var(--amber); }
.badge-overdue { color: var(--pink); }
.emoji-circle {
  display: inline-grid; place-items: center; flex-shrink: 0;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--surface-2); border: 1px solid var(--border); font-size: 18px;
}
.amount-in { color: var(--lime); }

/* ---------- Modal / sheet (native <dialog>) ---------- */
.modal {
  width: 100%; max-width: min(520px, calc(100vw - 32px));
  padding: 0; border: 0; background: transparent; color: var(--text);
}
.modal::backdrop { background: var(--overlay); backdrop-filter: blur(4px); }
.modal-body {
  display: flex; flex-direction: column; gap: 16px;
  max-height: calc(100dvh - 48px); overflow-y: auto;
  padding: 24px; border: 1px solid var(--border); border-radius: var(--radius-modal); background: var(--surface);
}
.modal[open] .modal-body { animation: pop 220ms var(--ease); }
.modal-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.modal-header h2 { font-size: 20px; }
.modal-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
@keyframes pop { from { opacity: 0; transform: translateY(12px) scale(0.98); } }
@media (max-width: 767px) {
  .modal.sheet { margin: auto 0 0; max-width: 100vw; }
  .modal.sheet .modal-body { max-height: 85dvh; border-radius: var(--radius-modal) var(--radius-modal) 0 0; }
  .modal.sheet[open] .modal-body { animation: slide-up 260ms var(--ease); }
}
@keyframes slide-up { from { transform: translateY(100%); } }

/* ---------- Toast ---------- */
.toast-stack {
  position: fixed; z-index: 100; left: 50%; bottom: calc(var(--bottom-nav-h) + 16px); transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 8px; width: min(420px, calc(100vw - 32px));
}
.toast {
  padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-btn);
  background: var(--surface-2); box-shadow: var(--glow); animation: pop 220ms var(--ease);
}
@media (min-width: 768px) { .toast-stack { bottom: 24px; } }

/* ---------- Empty state ---------- */
.empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; text-align: center; }
.empty-emoji { font-size: 44px; }
.empty h3 { font-size: 18px; }

/* ---------- Charts ---------- */
.chart { position: relative; width: 100%; }
.chart svg { display: block; overflow: visible; }
.chart-tooltip {
  position: absolute; z-index: 5; transform: translate(-50%, calc(-100% - 12px));
  padding: 6px 12px; border: 1px solid var(--border); border-radius: var(--radius-pill);
  background: var(--surface-2); font-size: 12px; white-space: nowrap; pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}
.grid-line { stroke: var(--border); stroke-dasharray: 4 4; }
.axis-label { fill: var(--text-muted); font: 12px var(--font-body); }
.line-path { fill: none; stroke: var(--violet); stroke-width: 2; stroke-linecap: round; }
.crosshair { stroke: var(--border); }
.focus-dot { fill: var(--violet); stroke: var(--bg); stroke-width: 2; }
.bar-income { fill: var(--lime); }
.bar-expense { fill: var(--pink); }
.bar-income:hover, .bar-expense:hover { opacity: 0.8; }

.donut { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.donut-ring { position: relative; }
.donut-center {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}
.donut-center strong { font: 700 20px var(--font-display); }
.donut-center .label { font-size: 10px; }
.donut-legend { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.donut-legend li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; font-size: 14px; }
.donut-legend li > :last-child { font-weight: 600; }
.dot { width: 8px; height: 8px; border-radius: 50%; }

.ring { position: relative; display: inline-grid; place-items: center; }
.ring svg { position: absolute; inset: 0; }
.ring-label { font: 700 22px var(--font-display); }
```

- [ ] **Step 4: Write `src/components/Icon.tsx`**

```tsx
import type { ReactNode } from 'react';

const PATHS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  wallet: <><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" /><path d="M16 14h.01" /></>,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  sliders: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  edit: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  trash: <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  pulse: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  swap: <path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
```

- [ ] **Step 5: Write the small primitives**

`src/components/Field.tsx`:
```tsx
import type { ReactNode } from 'react';

export default function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}
```

`src/components/Modal.tsx`:
```tsx
import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

interface Props { title: string; onClose: () => void; variant?: 'dialog' | 'sheet'; children: ReactNode }

/** Native <dialog>: gives us focus trapping, Esc-to-close and a ::backdrop for free. */
export default function Modal({ title, onClose, variant = 'dialog', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${variant === 'sheet' ? 'sheet' : ''}`}
      aria-label={title}
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === ref.current) onClose(); }}
    >
      <div className="modal-body">
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
```

`src/components/EmptyState.tsx`:
```tsx
import type { ReactNode } from 'react';

export default function EmptyState({ emoji, title, text, children }: { emoji: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-emoji" aria-hidden="true">{emoji}</div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  );
}
```

`src/components/StatusBadge.tsx`:
```tsx
import type { PaymentStatus } from '../types';

const LABEL: Record<PaymentStatus, string> = { paid: '✓ Paid', upcoming: '● Upcoming', overdue: '! Overdue' };

export default function StatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`badge badge-${status}`}>{LABEL[status]}</span>;
}
```

`src/components/PageHeader.tsx`:
```tsx
import type { ReactNode } from 'react';

export default function PageHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}
```

`src/components/ErrorBoundary.tsx`:
```tsx
import { Component, type ReactNode } from 'react';

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="card empty">
        <div className="empty-emoji" aria-hidden="true">🫠</div>
        <h3>Something broke</h3>
        <p className="muted">This page hit an error. Your data is safe.</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}
```

`src/components/useCountUp.ts`:
```ts
import { useEffect, useState } from 'react';
import { motionMs } from '../lib/motion';

/** Animates from 0 to `target` (ease-out cubic); jumps straight there with reduced motion. */
export function useCountUp(target: number, ms = 600): number {
  const [value, setValue] = useState(() => (motionMs(ms) === 0 ? target : 0));
  useEffect(() => {
    const duration = motionMs(ms);
    if (duration === 0) {
      setValue(target);
      return;
    }
    const t0 = performance.now();
    let raf = requestAnimationFrame(function tick(t) {
      const k = Math.min(1, (t - t0) / duration);
      setValue(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}
```

- [ ] **Step 6: Import the stylesheets in `src/main.tsx`**

Add these lines at the top of `src/main.tsx`, below the existing imports:
```tsx
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';
```

- [ ] **Step 7: Verify and commit**

Run: `npm run build`
Expected: builds with no type errors. The unused components are fine, because they are tree-shaken.

```bash
git add src/styles src/components src/main.tsx
git commit -m "feat: add design tokens, global styles and UI primitives"
```

---

### Task 11: Contexts, routing, guards and auth pages

**Files:**
- Create: `src/state/ToastContext.tsx`, `src/state/AuthContext.tsx`, `src/state/FinanceContext.tsx`, `src/components/guards.tsx`, `src/pages/AuthLayout.tsx`, `src/pages/AuthLayout.module.css`, `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`
- Modify: `src/App.tsx` (replace the placeholder)

**Interfaces:**
- Consumes: `storage`, `emptyData`, `createSeedData`, `createUser`, `verifyLogin`, `AuthError`, `DEMO_EMAIL`, `DEMO_PASSWORD`, `passwordStrength`, `financeReducer`, `FinanceAction`, `toISODate`
- Produces:
  - `useToast(): (message: string) => void`
  - `useAuth(): { user: User | null; register(input: RegisterInput): Promise<void>; login(email, password): Promise<void>; demoLogin(): Promise<void>; logout(): void }`. Errors are thrown as `AuthError`.
  - `useFinance(): { data: FinanceData; dispatch: Dispatch<FinanceAction>; today: ISODate }`
  - `FinanceProvider({ userId, children })`
  - Guards: `PublicOnly`, `RequireAuth` (mounts `FinanceProvider` keyed by user id), `RequireSetup`
  - Routes. Public: `/welcome`, `/login`, `/register`. Auth: `/setup`. App (inside `AppLayout`, added in Task 12): `/`, `/transactions`, `/accounts`, `/payments`, `/goals`, `/settings`.

- [ ] **Step 1: Write `src/state/ToastContext.tsx`**

```tsx
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const show = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map(t => <div key={t.id} className="toast">{t.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

- [ ] **Step 2: Write `src/state/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { storage } from '../data/storage';
import { emptyData } from '../data/defaults';
import { createSeedData } from '../data/seed';
import { AuthError, DEMO_EMAIL, DEMO_PASSWORD, createUser, verifyLogin, type RegisterInput } from '../lib/auth';

interface AuthValue {
  user: User | null;
  register(input: RegisterInput): Promise<void>;
  login(email: string, password: string): Promise<void>;
  demoLogin(): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const session = storage.getSession();
    return session ? storage.getUsers().find(u => u.id === session.userId) ?? null : null;
  });

  const start = (u: User) => {
    storage.setSession({ userId: u.id });
    setUser(u);
  };

  const value: AuthValue = {
    user,
    async register(input) {
      const users = storage.getUsers();
      const u = await createUser(users, input, new Date());
      storage.saveUsers([...users, u]);
      storage.saveData(u.id, emptyData({ nickname: u.name.split(' ')[0] }));
      start(u);
    },
    async login(email, password) {
      const u = await verifyLogin(storage.getUsers(), email, password);
      if (!u) throw new AuthError('Email or password is incorrect');
      start(u);
    },
    async demoLogin() {
      const users = storage.getUsers();
      let u = users.find(x => x.email === DEMO_EMAIL);
      if (!u) {
        u = await createUser(users, { name: 'Alex', email: DEMO_EMAIL, password: DEMO_PASSWORD }, new Date());
        storage.saveUsers([...users, u]);
      }
      storage.saveData(u.id, createSeedData(new Date()));
      storage.setWelcomeSeen(true);
      start(u);
    },
    logout() {
      storage.setSession(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
```

- [ ] **Step 3: Write `src/state/FinanceContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import type { FinanceData } from '../types';
import { storage } from '../data/storage';
import { emptyData } from '../data/defaults';
import { toISODate, type ISODate } from '../lib/dates';
import { financeReducer, type FinanceAction } from './financeReducer';
import { useToast } from './ToastContext';

interface FinanceValue { data: FinanceData; dispatch: Dispatch<FinanceAction>; today: ISODate }

const FinanceContext = createContext<FinanceValue | null>(null);

export function FinanceProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const toast = useToast();
  const [loaded] = useState(() => storage.loadData(userId));
  const [data, dispatch] = useReducer(financeReducer, loaded, r => (r.status === 'ok' ? r.data : emptyData()));
  const warned = useRef(false);

  useEffect(() => {
    if (loaded.status === 'corrupt' && !warned.current) {
      warned.current = true;
      toast("We couldn't read your saved data, so we started fresh.");
    }
  }, [loaded, toast]);

  useEffect(() => {
    storage.saveData(userId, data);
  }, [userId, data]);

  useEffect(() => {
    document.documentElement.dataset.theme = data.profile.theme;
    return () => { document.documentElement.dataset.theme = 'dark'; };
  }, [data.profile.theme]);

  return <FinanceContext.Provider value={{ data, dispatch, today: toISODate(new Date()) }}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceValue {
  const v = useContext(FinanceContext);
  if (!v) throw new Error('useFinance must be used inside <FinanceProvider>');
  return v;
}
```

- [ ] **Step 4: Write `src/components/guards.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { FinanceProvider, useFinance } from '../state/FinanceContext';
import { storage } from '../data/storage';

export function PublicOnly() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

export function RequireAuth() {
  const { user } = useAuth();
  if (!user) return <Navigate to={storage.getWelcomeSeen() ? '/login' : '/welcome'} replace />;
  return (
    <FinanceProvider key={user.id} userId={user.id}>
      <Outlet />
    </FinanceProvider>
  );
}

export function RequireSetup() {
  const { data } = useFinance();
  return data.onboarding.setupDone ? <Outlet /> : <Navigate to="/setup" replace />;
}
```

- [ ] **Step 5: Write the auth pages**

`src/pages/AuthLayout.module.css`:
```css
.page { min-height: 100dvh; display: grid; grid-template-columns: 1fr; }
.brand {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; justify-content: space-between; gap: 32px;
  padding: 24px; background: var(--grad-hero); color: #fff;
}
.brand::after {
  content: ''; position: absolute; width: 360px; height: 360px; right: -120px; bottom: -120px;
  border-radius: 50%; background: var(--lime); filter: blur(90px); opacity: 0.35;
}
.logo { display: flex; align-items: center; gap: 8px; font: 700 24px var(--font-display); }
.tagline { font-size: clamp(28px, 5vw, 48px); }
.stickers { display: none; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
.stickers span { padding: 8px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.2); font-weight: 600; }
.note { position: relative; z-index: 1; font-size: 13px; opacity: 0.85; }
.formSide { display: grid; place-items: center; padding: 32px 16px 48px; }
.formBox { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 20px; }
.title { font-size: 32px; }
.strength { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.strength span { height: 4px; border-radius: 4px; background: var(--surface-2); }
.weak span:nth-child(1) { background: var(--pink); }
.ok span:nth-child(-n + 2) { background: var(--amber); }
.strong span { background: var(--lime); }
@media (min-width: 900px) {
  .page { grid-template-columns: 1fr 1fr; }
  .brand { padding: 48px; }
  .stickers { display: flex; }
}
```

`src/pages/AuthLayout.tsx`:
```tsx
import type { ReactNode } from 'react';
import Icon from '../components/Icon';
import s from './AuthLayout.module.css';

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className={s.page}>
      <aside className={s.brand}>
        <div className={s.logo}><Icon name="pulse" size={28} /> Pulse</div>
        <div>
          <h2 className={s.tagline}>Your money,<br />finally readable.</h2>
          <div className={s.stickers}><span>💸 Track</span><span>📊 See</span><span>🎯 Save</span></div>
        </div>
        <p className={s.note}>Pulse is a simulation. Your data stays in this browser, so please don't reuse a real password.</p>
      </aside>
      <main className={s.formSide}>
        <div className={s.formBox}>
          <div>
            <h1 className={s.title}>{title}</h1>
            <p className="muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
```

`src/pages/LoginPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { AuthError } from '../lib/auth';
import { useAuth } from '../state/AuthContext';
import AuthLayout from './AuthLayout';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
      navigate('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back 👋" subtitle="Log in to check your Pulse.">
      <form className="stack" noValidate onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => login(email, password)); }}>
        <Field label="Email"><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>Log in</button>
        <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={() => run(demoLogin)}>✨ Try the demo account</button>
      </form>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}
```

`src/pages/RegisterPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { AuthError, passwordStrength } from '../lib/auth';
import { useAuth } from '../state/AuthContext';
import AuthLayout from './AuthLayout';
import s from './AuthLayout.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(form.password);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/setup');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your Pulse ✨" subtitle="Takes 30 seconds. No bank connection, ever.">
      <form className="stack" noValidate onSubmit={submit}>
        <Field label="Name"><input autoComplete="given-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><input type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password">
          <input type="password" autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </Field>
        {form.password && (
          <div>
            <div className={`${s.strength} ${s[strength]}`} aria-hidden="true"><span /><span /><span /></div>
            <p className="muted small">Password strength: {strength}</p>
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>Create account</button>
      </form>
      <p className="muted">Already have one? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
```

- [ ] **Step 6: Wire routes in `src/App.tsx` (placeholder pages for now)**

Task 12 adds `AppLayout` and later tasks add the pages. For now, a `Stub` component keeps the router compiling.

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireAuth, RequireSetup } from './components/guards';
import { AuthProvider, useAuth } from './state/AuthContext';
import { ToastProvider } from './state/ToastContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function Stub({ name }: { name: string }) {
  const { logout } = useAuth();
  return <div className="page"><h1>{name}</h1><button className="btn btn-secondary" onClick={logout}>Log out</button></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/welcome" element={<Stub name="Welcome" />} />
            <Route element={<PublicOnly />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="/setup" element={<Stub name="Setup" />} />
              <Route element={<RequireSetup />}>
                <Route index element={<Stub name="Dashboard" />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 7: Verify in the browser**

Run: `npm run build` (expect no errors), then `npm run dev` and open the printed URL.

Check by hand:
1. A fresh visit to `/` redirects to `/welcome` (the stub).
2. `/login` → "Try the demo account" lands on the Dashboard stub. Reloading keeps you logged in.
3. Log out → `/login` works. Wrong password shows "Email or password is incorrect".
4. `/register` with a new email lands on the Setup stub.
5. In DevTools, set `localStorage['pulse.data.<id>'] = '{bad'` and reload. You should see a toast, the Setup stub (fresh data) and no crash.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add auth and finance contexts, guards and auth pages"
```

---

### Task 12: App layout shell (sidebar, bottom nav, transaction modal)

**Files:**
- Create: `src/components/layout/nav.ts`, `src/components/layout/layoutContext.ts`, `src/components/layout/AppLayout.tsx`, `src/components/layout/AppLayout.module.css`, `src/components/layout/Sidebar.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/MobileTopBar.tsx`, `src/components/TransactionModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useFinance`, `useAuth`, `Icon`, `Modal`, `Field`, `EmptyState`, `validateTransaction`, `parseAmount`, `isValid`, `newId`, `CATEGORIES`, `CATEGORY_IDS`
- Produces:
  - `useLayout(): { openQuickAdd(): void }` for pages rendered inside `AppLayout`
  - `TransactionModal({ tx?: Transaction; onClose })` (add, edit and delete; transfers are not passed in)
  - `data-tour` targets: `nav` (sidebar nav and bottom nav), `profile` (sidebar user block and mobile avatar), `quick-add` (the mobile FAB). The dashboard adds `balance`, `charts` and a desktop `quick-add`.
  - Sets `AppLayout` as the route element wrapping all app pages. `GuidedTour` is added to it in Task 20.

- [ ] **Step 1: Write the nav config and layout context**

`src/components/layout/nav.ts`:
```ts
import type { IconName } from '../Icon';

export const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'grid' },
  { to: '/transactions', label: 'Transactions', icon: 'list' },
  { to: '/accounts', label: 'Accounts', icon: 'wallet' },
  { to: '/payments', label: 'Payments', icon: 'send' },
  { to: '/goals', label: 'Goals', icon: 'target' },
  { to: '/settings', label: 'Settings', icon: 'sliders' },
];
```

`src/components/layout/layoutContext.ts`:
```ts
import { useOutletContext } from 'react-router-dom';

export interface LayoutContext { openQuickAdd: () => void }

export const useLayout = () => useOutletContext<LayoutContext>();
```

- [ ] **Step 2: Write `src/components/layout/AppLayout.module.css`**

```css
.shell { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 1fr); }
.main { min-width: 0; display: flex; flex-direction: column; }
.content { padding: 16px 16px calc(var(--bottom-nav-h) + 32px); }

/* Sidebar: hidden on mobile, icon-only 768–1199px, full ≥1200px */
.sidebar { display: none; }
.label { display: none; }
.logo { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 12px; color: var(--violet); font: 700 24px var(--font-display); }
.nav { display: flex; flex: 1; flex-direction: column; gap: 6px; }
.navItem {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 12px; border-radius: var(--radius-pill);
  color: var(--text-muted); font-weight: 500; text-decoration: none;
  transition: background 200ms, color 200ms;
}
.navItem:hover { background: var(--surface-2); color: var(--text); text-decoration: none; }
.active, .active:hover { background: var(--violet); color: #fff; }
.user { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border); }
.userLink { display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; }
.userLink:hover { text-decoration: none; }

@media (min-width: 768px) {
  .shell { grid-template-columns: var(--sidebar-w-compact) minmax(0, 1fr); }
  .sidebar {
    position: sticky; top: 0; height: 100dvh;
    display: flex; flex-direction: column; gap: 16px;
    padding: 20px 12px; border-right: 1px solid var(--border);
  }
  .content { padding: 28px 24px 48px; }
  .topBar, .bottomNav { display: none !important; }
}
@media (min-width: 1200px) {
  .shell { grid-template-columns: var(--sidebar-w) minmax(0, 1fr); }
  .sidebar { padding: 24px 16px; }
  .label { display: inline; }
  .logo { justify-content: flex-start; }
  .navItem { justify-content: flex-start; padding: 12px 16px; }
  .user { flex-direction: row; justify-content: space-between; }
  .content { padding: 32px; }
}

/* Mobile top bar + bottom tab bar */
.topBar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 85%, transparent); backdrop-filter: blur(12px);
}
.bottomNav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
  display: grid; grid-template-columns: repeat(5, 1fr); align-items: center;
  height: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid var(--border); background: var(--surface);
}
.tab {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: 0; background: none; color: var(--text-muted); cursor: pointer;
  font: 500 11px var(--font-body); text-decoration: none;
}
.tab:hover { text-decoration: none; }
.tabActive { color: var(--violet); }
.fab {
  justify-self: center; display: grid; place-items: center;
  width: 56px; height: 56px; margin-top: -28px;
  border: 4px solid var(--bg); border-radius: 50%;
  background: var(--grad-hero); color: #fff; box-shadow: var(--glow); cursor: pointer;
}
.moreList { display: flex; flex-direction: column; gap: 8px; }
.moreItem {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  border: 0; border-radius: var(--radius-btn); background: var(--surface-2);
  color: var(--text); font: 500 16px var(--font-body); text-align: left; text-decoration: none; cursor: pointer;
}
```

- [ ] **Step 3: Write `Sidebar.tsx`, `MobileTopBar.tsx` and `BottomNav.tsx`**

`src/components/layout/Sidebar.tsx`:
```tsx
import { NavLink } from 'react-router-dom';
import Icon from '../Icon';
import { useAuth } from '../../state/AuthContext';
import { useFinance } from '../../state/FinanceContext';
import { NAV_ITEMS } from './nav';
import s from './AppLayout.module.css';

export default function Sidebar() {
  const { data } = useFinance();
  const { logout } = useAuth();
  return (
    <aside className={s.sidebar}>
      <div className={s.logo}><Icon name="pulse" size={26} /><span className={s.label}>Pulse</span></div>
      <nav className={s.nav} aria-label="Main" data-tour="nav">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} title={item.label}
            className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}>
            <Icon name={item.icon} />
            <span className={s.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={s.user} data-tour="profile">
        <NavLink to="/settings" className={s.userLink} title="Profile settings">
          <span className="emoji-circle">{data.profile.avatar}</span>
          <span className={s.label}>{data.profile.nickname || 'You'}</span>
        </NavLink>
        <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><Icon name="logout" size={18} /></button>
      </div>
    </aside>
  );
}
```

`src/components/layout/MobileTopBar.tsx`:
```tsx
import { Link } from 'react-router-dom';
import Icon from '../Icon';
import { useFinance } from '../../state/FinanceContext';
import s from './AppLayout.module.css';

export default function MobileTopBar() {
  const { data } = useFinance();
  return (
    <header className={s.topBar}>
      <div className={s.logo}><Icon name="pulse" size={22} /> Pulse</div>
      <Link to="/settings" className="emoji-circle" aria-label="Profile settings" data-tour="profile">{data.profile.avatar}</Link>
    </header>
  );
}
```

`src/components/layout/BottomNav.tsx`:
```tsx
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Icon, { type IconName } from '../Icon';
import Modal from '../Modal';
import { useAuth } from '../../state/AuthContext';
import s from './AppLayout.module.css';

const MORE = [
  { to: '/accounts', label: '💳 Accounts' },
  { to: '/goals', label: '🎯 Goals' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function BottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const [more, setMore] = useState(false);
  const { logout } = useAuth();
  const tab = (to: string, label: string, icon: IconName) => (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => `${s.tab} ${isActive ? s.tabActive : ''}`}>
      <Icon name={icon} /><span>{label}</span>
    </NavLink>
  );
  return (
    <>
      <nav className={s.bottomNav} aria-label="Main" data-tour="nav">
        {tab('/', 'Home', 'grid')}
        {tab('/transactions', 'Activity', 'list')}
        <button className={s.fab} onClick={onQuickAdd} aria-label="Add transaction" data-tour="quick-add"><Icon name="plus" size={26} /></button>
        {tab('/payments', 'Bills', 'send')}
        <button className={s.tab} onClick={() => setMore(true)}><Icon name="more" /><span>More</span></button>
      </nav>
      {more && (
        <Modal title="More" variant="sheet" onClose={() => setMore(false)}>
          <div className={s.moreList}>
            {MORE.map(m => <Link key={m.to} to={m.to} className={s.moreItem} onClick={() => setMore(false)}>{m.label}</Link>)}
            <button className={s.moreItem} onClick={logout}>👋 Log out</button>
          </div>
        </Modal>
      )}
    </>
  );
}
```

- [ ] **Step 4: Write `src/components/TransactionModal.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CategoryId, Transaction } from '../types';
import { CATEGORIES, CATEGORY_IDS } from '../lib/categories';
import { isValid, parseAmount, validateTransaction, type Errors, type TxForm } from '../lib/validation';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import EmptyState from './EmptyState';
import Field from './Field';
import Modal from './Modal';

export default function TransactionModal({ tx, onClose }: { tx?: Transaction; onClose: () => void }) {
  const { data, dispatch, today } = useFinance();
  const accounts = data.accounts;
  const [form, setForm] = useState<TxForm>(() => (tx && tx.type !== 'transfer'
    ? { type: tx.type, amount: String(tx.amount), description: tx.description, category: tx.category, accountId: tx.accountId, date: tx.date }
    : { type: 'expense', amount: '', description: '', category: 'food', accountId: accounts[0]?.id ?? '', date: today }));
  const [errors, setErrors] = useState<Errors<keyof TxForm>>({});
  const set = <K extends keyof TxForm>(key: K, value: TxForm[K]) => setForm(f => ({ ...f, [key]: value }));

  if (accounts.length === 0) {
    return (
      <Modal title="Add transaction" onClose={onClose}>
        <EmptyState emoji="💳" title="Add an account first" text="Every transaction lives in an account.">
          <Link className="btn btn-primary" to="/accounts" onClick={onClose}>Go to accounts</Link>
        </EmptyState>
      </Modal>
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateTransaction(form, accounts.map(a => a.id), today);
    setErrors(errs);
    if (!isValid(errs)) return;
    const next: Transaction = {
      id: tx?.id ?? newId(), date: form.date, description: form.description.trim(),
      amount: parseAmount(form.amount)!, type: form.type, category: form.category, accountId: form.accountId,
    };
    dispatch(tx ? { type: 'editTx', tx: next } : { type: 'addTx', tx: next });
    onClose();
  }

  function remove() {
    if (tx && confirm('Delete this transaction?')) {
      dispatch({ type: 'deleteTx', id: tx.id });
      onClose();
    }
  }

  return (
    <Modal title={tx ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <div className="segmented" role="group" aria-label="Type">
          {(['expense', 'income'] as const).map(t => (
            <button key={t} type="button" aria-pressed={form.type === t}
              onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? 'salary' : 'food' }))}>
              {t === 'expense' ? '💸 Expense' : '💰 Income'}
            </button>
          ))}
        </div>
        <Field label="Amount" error={errors.amount}>
          <input inputMode="decimal" placeholder="0.00" autoFocus value={form.amount} onChange={e => set('amount', e.target.value)} />
        </Field>
        <Field label="Description" error={errors.description}>
          <input maxLength={60} placeholder="e.g. Pizza night" value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
        <div className="form-grid">
          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value as CategoryId)}>
              {CATEGORY_IDS.map(c => <option key={c} value={c}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</option>)}
            </select>
          </Field>
          <Field label="Account" error={errors.accountId}>
            <select value={form.accountId} onChange={e => set('accountId', e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Date" error={errors.date}>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
        <div className="modal-actions">
          {tx && <button type="button" className="btn btn-danger" onClick={remove}>Delete</button>}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{tx ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 5: Write `src/components/layout/AppLayout.tsx`**

```tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import TransactionModal from '../TransactionModal';
import BottomNav from './BottomNav';
import MobileTopBar from './MobileTopBar';
import Sidebar from './Sidebar';
import type { LayoutContext } from './layoutContext';
import s from './AppLayout.module.css';

export default function AppLayout() {
  const [quickAdd, setQuickAdd] = useState(false);
  const { pathname } = useLocation();
  const context: LayoutContext = { openQuickAdd: () => setQuickAdd(true) };
  return (
    <div className={s.shell}>
      <Sidebar />
      <div className={s.main}>
        <MobileTopBar />
        <main className={s.content}>
          <ErrorBoundary key={pathname}>
            <Outlet context={context} />
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav onQuickAdd={() => setQuickAdd(true)} />
      {quickAdd && <TransactionModal onClose={() => setQuickAdd(false)} />}
    </div>
  );
}
```

- [ ] **Step 6: Mount the layout in `src/App.tsx`**

Replace the `RequireSetup` block with the layout wrapping stub routes for every app page:
```tsx
              <Route element={<RequireSetup />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Stub name="Dashboard" />} />
                  <Route path="transactions" element={<Stub name="Transactions" />} />
                  <Route path="accounts" element={<Stub name="Accounts" />} />
                  <Route path="payments" element={<Stub name="Payments" />} />
                  <Route path="goals" element={<Stub name="Goals" />} />
                  <Route path="settings" element={<Stub name="Settings" />} />
                </Route>
              </Route>
```
Add `import AppLayout from './components/layout/AppLayout';`.

- [ ] **Step 7: Verify in the browser**

Run: `npm run build`, then `npm run dev`. Log in with the demo account.

Check by hand:
1. At 1280px: full sidebar with labels, and the violet active pill follows the route.
2. At 900px: icon-only sidebar.
3. At 375px (DevTools device mode): top bar with avatar, bottom tabs, and "More" opens the sheet.
4. The FAB opens "Add transaction". Adding one with an empty amount shows "Enter an amount like 12.50". A valid one closes the modal. Esc and a backdrop click both close it.
5. No horizontal scroll at 375px.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add responsive app shell and transaction modal"
```

---

### Task 13: D3 charts

**Files:**
- Create: `src/charts/useChartSize.ts`, `src/charts/ChartTooltip.tsx`, `src/charts/LineChart.tsx`, `src/charts/BarChart.tsx`, `src/charts/DonutChart.tsx`, `src/charts/Sparkline.tsx`, `src/charts/ProgressRing.tsx`

**Interfaces:**
- Consumes: `BalancePoint`, `MonthPoint`, `CategoryTotal` (Task 5), `CATEGORIES`, `formatMoney`, `formatDate`, `formatMonth`, `isoToDate`, `motionMs`
- Produces:
  - `useChartWidth<T extends HTMLElement>(): [RefObject<T | null>, number]`
  - `interface Tip { x: number; y: number; content: ReactNode }` and `ChartTooltip({ tip })`
  - `LineChart({ data: BalancePoint[]; currency; height?: number = 280 })`
  - `BarChart({ data: MonthPoint[]; currency; height?: number = 240 })`
  - `DonutChart({ data: CategoryTotal[]; currency; size?: number = 180; legend?: boolean = true })`
  - `Sparkline({ data: number[]; color?: string; height?: number = 44 })`
  - `ProgressRing({ value: number /* 0..1 */; size?: number = 120; stroke?: number = 10 })`

**Pattern for every chart:** React renders `<svg ref>`. A `useEffect` keyed on data and size clears it and redraws with D3 (scales, shapes, joins, transitions via `motionMs()`). Hover state goes to React (`setTip`), which does not re-trigger the draw effect. Colors come from CSS classes or `.style('fill', 'var(--x)')`.

- [ ] **Step 1: Write the sizing hook and tooltip**

`src/charts/useChartSize.ts`:
```ts
import { useEffect, useRef, useState, type RefObject } from 'react';

/** Tracks an element's content width so charts redraw responsively. */
export function useChartWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
```

`src/charts/ChartTooltip.tsx`:
```tsx
import type { ReactNode } from 'react';

export interface Tip { x: number; y: number; content: ReactNode }

export default function ChartTooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return <div className="chart-tooltip" style={{ left: tip.x, top: tip.y }}>{tip.content}</div>;
}
```

- [ ] **Step 2: Write `src/charts/LineChart.tsx`**

```tsx
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Currency } from '../types';
import type { BalancePoint } from '../lib/finance';
import { isoToDate } from '../lib/dates';
import { formatDate, formatMoney } from '../lib/format';
import { motionMs } from '../lib/motion';
import ChartTooltip, { type Tip } from './ChartTooltip';
import { useChartWidth } from './useChartSize';

interface P { date: Date; iso: string; value: number }

export default function LineChart({ data, currency, height = 280 }: { data: BalancePoint[]; currency: Currency; height?: number }) {
  const [wrapRef, width] = useChartWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const gradId = `line-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || width === 0 || data.length < 2) return;
    const m = { top: 16, right: 12, bottom: 28, left: 12 };
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const points: P[] = data.map(d => ({ date: isoToDate(d.date), iso: d.date, value: d.balance }));
    const x = d3.scaleUtc().domain([points[0].date, points[points.length - 1].date]).range([m.left, width - m.right]);
    const lo = d3.min(points, p => p.value)!;
    const hi = d3.max(points, p => p.value)!;
    const pad = (hi - lo) * 0.15 || Math.abs(hi) * 0.1 || 1;
    const y = d3.scaleLinear().domain([lo - pad, hi + pad]).nice(4).range([height - m.bottom, m.top]);

    const grad = svg.append('defs').append('linearGradient').attr('id', gradId).attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').style('stop-color', 'var(--violet)').style('stop-opacity', 0.3);
    grad.append('stop').attr('offset', '100%').style('stop-color', 'var(--violet)').style('stop-opacity', 0);

    svg.append('g').selectAll('line').data(y.ticks(4)).join('line')
      .attr('class', 'grid-line').attr('x1', m.left).attr('x2', width - m.right).attr('y1', d => y(d)).attr('y2', d => y(d));

    const tickFormat = d3.utcFormat(data.length > 45 ? '%b' : '%b %d');
    svg.append('g').selectAll('text').data(x.ticks(width < 500 ? 3 : 6)).join('text')
      .attr('class', 'axis-label').attr('x', d => x(d)).attr('y', height - 6).attr('text-anchor', 'middle').text(d => tickFormat(d));

    const area = d3.area<P>().x(p => x(p.date)).y0(height - m.bottom).y1(p => y(p.value)).curve(d3.curveMonotoneX);
    const line = d3.line<P>().x(p => x(p.date)).y(p => y(p.value)).curve(d3.curveMonotoneX);
    svg.append('path').datum(points).attr('d', area).style('fill', `url(#${gradId})`);
    const path = svg.append('path').datum(points).attr('class', 'line-path').attr('d', line);
    const len = path.node()!.getTotalLength();
    path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
      .transition().duration(motionMs()).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    const focus = svg.append('g').style('display', 'none');
    focus.append('line').attr('class', 'crosshair').attr('y1', m.top).attr('y2', height - m.bottom);
    const dot = focus.append('circle').attr('class', 'focus-dot').attr('r', 5);
    const bisect = d3.bisector<P, Date>(p => p.date).center;

    svg.append('rect').attr('x', m.left).attr('width', width - m.left - m.right).attr('height', height).style('fill', 'transparent')
      .on('pointermove', (event: PointerEvent) => {
        const p = points[bisect(points, x.invert(d3.pointer(event)[0]))];
        focus.style('display', null).attr('transform', `translate(${x(p.date)},0)`);
        dot.attr('cy', y(p.value));
        setTip({ x: x(p.date), y: y(p.value), content: <><strong>{formatMoney(p.value, currency)}</strong> <span className="muted">{formatDate(p.iso)}</span></> });
      })
      .on('pointerleave', () => {
        focus.style('display', 'none');
        setTip(null);
      });
  }, [data, width, height, currency, gradId]);

  const first = data[0]?.balance ?? 0;
  const last = data.at(-1)?.balance ?? 0;
  return (
    <div ref={wrapRef} className="chart" style={{ height }} role="img"
      aria-label={`Balance over the last ${data.length} days, from ${formatMoney(first, currency)} to ${formatMoney(last, currency)}`}>
      <svg ref={svgRef} width={width} height={height} />
      <ChartTooltip tip={tip} />
    </div>
  );
}
```

- [ ] **Step 3: Write `src/charts/BarChart.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Currency } from '../types';
import type { MonthPoint } from '../lib/finance';
import { formatMoney, formatMonth } from '../lib/format';
import { motionMs } from '../lib/motion';
import ChartTooltip, { type Tip } from './ChartTooltip';
import { useChartWidth } from './useChartSize';

const KEYS = ['income', 'expense'] as const;
type Key = (typeof KEYS)[number];

export default function BarChart({ data, currency, height = 240 }: { data: MonthPoint[]; currency: Currency; height?: number }) {
  const [wrapRef, width] = useChartWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || width === 0) return;
    const m = { top: 12, right: 8, bottom: 28, left: 8 };
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const x0 = d3.scaleBand<string>().domain(data.map(d => d.month)).range([m.left, width - m.right]).paddingInner(0.35).paddingOuter(0.2);
    const groupWidth = Math.min(x0.bandwidth(), 64);
    const offset = (x0.bandwidth() - groupWidth) / 2;
    const x1 = d3.scaleBand<Key>().domain(KEYS).range([0, groupWidth]).padding(0.12);
    const max = d3.max(data, d => Math.max(d.income, d.expense)) || 1;
    const y = d3.scaleLinear().domain([0, max]).nice(3).range([height - m.bottom, m.top]);

    svg.append('g').selectAll('line').data(y.ticks(3)).join('line')
      .attr('class', 'grid-line').attr('x1', m.left).attr('x2', width - m.right).attr('y1', d => y(d)).attr('y2', d => y(d));

    svg.append('g').selectAll('g').data(data).join('g')
      .attr('transform', d => `translate(${x0(d.month)! + offset},0)`)
      .selectAll('rect')
      .data(d => KEYS.map(key => ({ key, month: d.month, value: d[key] })))
      .join('rect')
      .attr('class', d => `bar-${d.key}`)
      .attr('x', d => x1(d.key)!).attr('width', x1.bandwidth()).attr('rx', 4)
      .attr('y', y(0)).attr('height', 0)
      .on('pointerenter', (_event, d) => setTip({
        x: x0(d.month)! + offset + x1(d.key)! + x1.bandwidth() / 2,
        y: y(d.value),
        content: <>{d.key === 'income' ? 'Income' : 'Expenses'} · {formatMonth(d.month)}: <strong>{formatMoney(d.value, currency)}</strong></>,
      }))
      .on('pointerleave', () => setTip(null))
      .transition().duration(motionMs()).delay((_d, i) => i * 60).ease(d3.easeCubicOut)
      .attr('y', d => y(d.value)).attr('height', d => y(0) - y(d.value));

    svg.append('g').selectAll('text').data(data).join('text')
      .attr('class', 'axis-label').attr('x', d => x0(d.month)! + x0.bandwidth() / 2).attr('y', height - 6)
      .attr('text-anchor', 'middle').text(d => formatMonth(d.month));
  }, [data, width, height, currency]);

  return (
    <div ref={wrapRef} className="chart" style={{ height }} role="img"
      aria-label={`Income versus expenses for the last ${data.length} months`}>
      <svg ref={svgRef} width={width} height={height} />
      <ChartTooltip tip={tip} />
    </div>
  );
}
```

- [ ] **Step 4: Write `src/charts/DonutChart.tsx`**

This follows the approved "option A" donut: a 180px ring with the total in the center, and a legend of colored dot, emoji and name, and percentage.

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Currency } from '../types';
import type { CategoryTotal } from '../lib/finance';
import { CATEGORIES } from '../lib/categories';
import { formatMoney } from '../lib/format';
import { motionMs } from '../lib/motion';
import ChartTooltip, { type Tip } from './ChartTooltip';

interface Slice { key: string; label: string; emoji: string; color: string; total: number }

function toSlices(data: CategoryTotal[]): Slice[] {
  const slices = data.map(d => ({ key: d.category, ...CATEGORIES[d.category], total: d.total }));
  if (slices.length <= 5) return slices;
  const rest = d3.sum(slices.slice(4), s => s.total);
  return [...slices.slice(0, 4), { key: 'rest', label: 'Everything else', emoji: '➕', color: 'var(--text-muted)', total: rest }];
}

interface Props { data: CategoryTotal[]; currency: Currency; size?: number; legend?: boolean }

export default function DonutChart({ data, currency, size = 180, legend = true }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const slices = useMemo(() => toSlices(data), [data]);
  const total = d3.sum(slices, s => s.total);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();
    const r = size / 2;
    const g = svg.append('g').attr('transform', `translate(${r},${r})`);
    if (total === 0) {
      g.append('circle').attr('r', r * 0.85).style('fill', 'none').style('stroke', 'var(--surface-2)').style('stroke-width', r * 0.3);
      return;
    }
    const arc = d3.arc<d3.PieArcDatum<Slice>>().innerRadius(r * 0.7).outerRadius(r).cornerRadius(4).padAngle(0.02);
    const pie = d3.pie<Slice>().value(s => s.total).sort(null);
    g.selectAll('path').data(pie(slices)).join('path')
      .style('fill', d => d.data.color)
      .on('pointerenter', (_event, d) => {
        const [cx, cy] = arc.centroid(d);
        setTip({ x: r + cx, y: r + cy, content: <>{d.data.emoji} {d.data.label}: <strong>{formatMoney(d.data.total, currency)}</strong></> });
      })
      .on('pointerleave', () => setTip(null))
      .transition().duration(motionMs(700)).ease(d3.easeCubicOut)
      .attrTween('d', d => {
        const i = d3.interpolate({ ...d, endAngle: d.startAngle }, d);
        return t => arc(i(t)) ?? '';
      });
  }, [slices, total, size, currency]);

  return (
    <div className="donut">
      <div className="donut-ring" style={{ width: size, height: size }} role="img" aria-label={`Spending by category, total ${formatMoney(total, currency)}`}>
        <svg ref={svgRef} width={size} height={size} />
        <div className="donut-center">
          <span className="label">Total</span>
          <strong className="tabular">{formatMoney(total, currency, { compact: total >= 100_000 })}</strong>
        </div>
        <ChartTooltip tip={tip} />
      </div>
      {legend && total > 0 && (
        <ul className="donut-legend">
          {slices.map(s => (
            <li key={s.key}>
              <span className="dot" style={{ background: s.color }} />
              <span>{s.emoji} {s.label}</span>
              <span className="tabular">{Math.round((s.total / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write `src/charts/Sparkline.tsx` and `src/charts/ProgressRing.tsx`**

`src/charts/Sparkline.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motionMs } from '../lib/motion';
import { useChartWidth } from './useChartSize';

export default function Sparkline({ data, color = 'var(--violet)', height = 44 }: { data: number[]; color?: string; height?: number }) {
  const [wrapRef, width] = useChartWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || width === 0 || data.length < 2) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const x = d3.scaleLinear().domain([0, data.length - 1]).range([2, width - 2]);
    const [lo, hi] = d3.extent(data) as [number, number];
    const y = d3.scaleLinear().domain(lo === hi ? [lo - 1, hi + 1] : [lo, hi]).range([height - 4, 4]);
    const line = d3.line<number>().x((_d, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX);
    const path = svg.append('path').datum(data).attr('d', line)
      .style('fill', 'none').style('stroke', color).style('stroke-width', 2).style('stroke-linecap', 'round');
    const len = path.node()!.getTotalLength();
    path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
      .transition().duration(motionMs()).attr('stroke-dashoffset', 0);
  }, [data, width, height, color]);

  return <div ref={wrapRef} style={{ height }} aria-hidden="true"><svg ref={svgRef} width={width} height={height} /></div>;
}
```

`src/charts/ProgressRing.tsx`:
```tsx
import { useEffect, useId, useRef } from 'react';
import * as d3 from 'd3';
import { motionMs } from '../lib/motion';

export default function ProgressRing({ value, size = 120, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const prev = useRef(0);
  const gradId = `ring-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const pct = Math.max(0, Math.min(1, value));

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();
    const r = size / 2;
    const grad = svg.append('defs').append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('x2', '100%');
    grad.append('stop').attr('offset', '0%').style('stop-color', 'var(--violet)');
    grad.append('stop').attr('offset', '100%').style('stop-color', 'var(--pink)');
    const g = svg.append('g').attr('transform', `translate(${r},${r})`);
    const arc = d3.arc<{ endAngle: number }>().innerRadius(r - stroke).outerRadius(r).startAngle(0).cornerRadius(stroke / 2);
    g.append('path').attr('d', arc({ endAngle: Math.PI * 2 })).style('fill', 'var(--surface-2)');
    const from = prev.current;
    prev.current = pct;
    g.append('path').style('fill', `url(#${gradId})`)
      .transition().duration(motionMs()).ease(d3.easeCubicOut)
      .attrTween('d', () => {
        const i = d3.interpolate(from * Math.PI * 2, pct * Math.PI * 2);
        return t => arc({ endAngle: i(t) }) ?? '';
      });
  }, [pct, size, stroke, gradId]);

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg ref={svgRef} width={size} height={size} role="img" aria-label={`${Math.round(pct * 100)}% saved`} />
      <span className="ring-label">{Math.round(pct * 100)}%</span>
    </div>
  );
}
```

- [ ] **Step 6: Type-check and commit**

Run: `npm run build`
Expected: no type errors. If `@types/d3` rejects a `.on(...)` handler signature, type the event parameter as `PointerEvent` or `unknown` rather than adding `any`.

```bash
git add src/charts
git commit -m "feat: add D3 line, bar, donut, sparkline and progress ring charts"
```

---

### Task 14: Dashboard page

**Files:**
- Create: `src/pages/DashboardPage.tsx`, `src/pages/DashboardPage.module.css`, `src/components/TransactionList.tsx`, `src/components/TransactionList.module.css`
- Modify: `src/App.tsx` (route `index` → `DashboardPage`)

**Interfaces:**
- Consumes: finance selectors (Task 5), charts (Task 13), `useLayout` (Task 12), `useCountUp`, `StatusBadge`, `EmptyState`, `PageHeader`, `Icon`, `newId`, `txVisual`, `formatMoney`, `formatRelativeDay`, `formatPercent`
- Produces:
  - `TransactionList({ rows: Transaction[]; currency; today; accountNames?: Record<ID, string>; sort?: Filters['sort']; onSort?: (key: SortKey) => void; onSelect?: (tx: Transaction) => void })`, reused by Transactions in Task 15
  - `data-tour` targets `balance`, `charts` and the desktop `quick-add`

**Design:** follow `docs/design/dashboard-reference.html` (the approved B layout), plus two approved tweaks:
1. **Each KPI card shows a large faded emoji in its background**, bottom-right, 80px at 10% opacity (`.card-emoji`): Total balance 💸, Income 💰, Expenses 🧾, Savings rate 🏦.
2. **The category card uses the option A donut** (`DonutChart`: 180px ring, total centered, legend with dot, emoji, name and %) in the same right-hand column next to "Income vs expenses".

Insight chips stay plain, not rotated.

- [ ] **Step 1: Write `src/components/TransactionList.module.css`**

```css
.list { width: 100%; }
.header, .row { display: grid; align-items: center; gap: 16px; padding: 0 20px; }
.withAccount .header, .withAccount .row { grid-template-columns: minmax(0, 2.4fr) 1.3fr 1fr 0.9fr 1fr; }
.noAccount .header, .noAccount .row { grid-template-columns: minmax(0, 2.4fr) 1.3fr 0.9fr 1fr; }
.header { display: none; padding-top: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.headCell {
  padding: 0; border: 0; background: none; text-align: left; cursor: pointer;
  color: var(--text-muted); font: 600 12px var(--font-body); letter-spacing: 0.08em; text-transform: uppercase;
}
span.headCell { cursor: default; }
.right { text-align: right; }
.row {
  width: 100%; min-height: 64px; padding-top: 12px; padding-bottom: 12px;
  border: 0; border-bottom: 1px solid var(--border); background: none; color: inherit; text-align: left; font: inherit;
  transition: background 200ms;
}
li:last-child .row { border-bottom: 0; }
button.row { cursor: pointer; }
button.row:hover { background: var(--surface-2); }
.desc { display: flex; align-items: center; gap: 12px; min-width: 0; }
.desc > span:last-child { min-width: 0; display: flex; flex-direction: column; }
.title { font-weight: 500; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { font-size: 12px; color: var(--text-muted); }
.cell { display: none; font-size: 13px; }
.amount { font: 600 15px var(--font-display); text-align: right; white-space: nowrap; }

/* Mobile: rows become compact cards (emoji · text · amount) */
@media (max-width: 767px) {
  .withAccount .row, .noAccount .row { grid-template-columns: minmax(0, 1fr) auto; }
}
@media (min-width: 768px) {
  .header { display: grid; }
  .cell { display: block; }
  .meta { display: none; }
}
```

- [ ] **Step 2: Write `src/components/TransactionList.tsx`**

```tsx
import type { Currency, ID, Transaction } from '../types';
import type { Filters, SortKey } from '../lib/filters';
import { txVisual } from '../lib/categories';
import type { ISODate } from '../lib/dates';
import { txEffect } from '../lib/finance';
import { formatMoney, formatRelativeDay } from '../lib/format';
import s from './TransactionList.module.css';

interface Props {
  rows: Transaction[];
  currency: Currency;
  today: ISODate;
  accountNames?: Record<ID, string>;
  sort?: Filters['sort'];
  onSort?: (key: SortKey) => void;
  onSelect?: (tx: Transaction) => void;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'account', label: 'Account' },
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

export default function TransactionList({ rows, currency, today, accountNames, sort, onSort, onSelect }: Props) {
  const columns = COLUMNS.filter(c => c.key !== 'account' || accountNames);
  return (
    <div className={`${s.list} ${accountNames ? s.withAccount : s.noAccount}`}>
      <div className={s.header}>
        {columns.map(c => {
          const cls = `${s.headCell} ${c.key === 'amount' ? s.right : ''}`;
          const arrow = sort?.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
          return onSort
            ? <button key={c.key} type="button" className={cls} onClick={() => onSort(c.key)} aria-label={`Sort by ${c.label}`}>{c.label}{arrow}</button>
            : <span key={c.key} className={cls}>{c.label}</span>;
        })}
      </div>
      <ul>
        {rows.map(tx => {
          const v = txVisual(tx);
          const effect = txEffect(tx);
          const account = accountNames ? accountNames[tx.accountId] ?? '—' : null;
          const when = formatRelativeDay(tx.date, today);
          const content = (
            <>
              <span className={s.desc}>
                <span className="emoji-circle">{v.emoji}</span>
                <span>
                  <span className={s.title}>{tx.description}</span>
                  <span className={s.meta}>{v.label} · {when}{account ? ` · ${account}` : ''}</span>
                </span>
              </span>
              <span className={s.cell}><span className="chip chip-sm">{v.emoji} {v.label}</span></span>
              {account !== null && <span className={`${s.cell} muted`}>{account}</span>}
              <span className={`${s.cell} muted`}>{when}</span>
              <span className={`${s.amount} tabular ${effect > 0 ? 'amount-in' : ''}`}>{formatMoney(effect, currency, { sign: true })}</span>
            </>
          );
          return (
            <li key={tx.id}>
              {onSelect
                ? <button type="button" className={s.row} onClick={() => onSelect(tx)} title={tx.type === 'transfer' ? 'Delete transfer' : 'Edit'}>{content}</button>
                : <div className={s.row}>{content}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/pages/DashboardPage.module.css`**

```css
.kpis { display: grid; gap: 16px; grid-template-columns: 1fr; }
.kpi { overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
.kpi > :not(:global(.card-emoji)) { position: relative; z-index: 1; }
.kpiValue { font: 700 32px var(--font-display); letter-spacing: -0.02em; margin-top: 8px; }
.hero { border: 0; background: var(--grad-hero); color: #fff; box-shadow: var(--glow); }
.hero :global(.label) { color: rgba(255, 255, 255, 0.8); }
.heroValue { font: 700 clamp(36px, 5vw, 48px) var(--font-display); letter-spacing: -0.02em; margin-top: 8px; }
.heroChip { align-self: flex-start; padding: 4px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.2); font-size: 14px; font-weight: 500; }
.delta { align-self: flex-start; padding: 4px 10px; border-radius: 999px; background: var(--surface-2); font-size: 13px; font-weight: 500; color: var(--text-muted); }
.good { color: var(--lime); }
.bad { color: var(--pink); }
.info { color: var(--amber); }
.meter { height: 8px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.meter > div { height: 100%; border-radius: inherit; background: var(--lime); transition: width 600ms var(--ease); }
.insights { display: flex; flex-wrap: wrap; gap: 12px; }
.split { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
.legend { display: flex; gap: 16px; font-size: 12px; }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend i { width: 12px; height: 12px; border-radius: 3px; }
.bills { display: flex; flex-direction: column; gap: 16px; }
.bill { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.billInfo { display: flex; align-items: center; gap: 12px; min-width: 0; }
.billName { font-weight: 500; font-size: 14px; }
.billRight { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.billAmount { font: 600 15px var(--font-display); }
.addBtn { display: none; }
@media (min-width: 600px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 768px) { .addBtn { display: inline-flex; } }
@media (min-width: 1024px) { .split { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); } }
@media (min-width: 1200px) { .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (hover: hover) { .kpi:hover { transform: translateY(-2px); } }
```

- [ ] **Step 4: Write `src/pages/DashboardPage.tsx`**

```tsx
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Payment } from '../types';
import BarChart from '../charts/BarChart';
import DonutChart from '../charts/DonutChart';
import LineChart from '../charts/LineChart';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import TransactionList from '../components/TransactionList';
import { useCountUp } from '../components/useCountUp';
import { useLayout } from '../components/layout/layoutContext';
import { CATEGORIES } from '../lib/categories';
import { addDays, monthKey, startOfMonth } from '../lib/dates';
import {
  balanceAt, balanceSeries, categoryBreakdown, dueLabel, insights, monthlySeries, paymentStatus, percentChange,
  rangeTotals, samePeriodLastMonth, savingsRate, sortByDateDesc, totalBalance,
} from '../lib/finance';
import { formatMoney, formatPercent } from '../lib/format';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import s from './DashboardPage.module.css';

function Kpi({ label, value, emoji, children }: { label: string; value: string; emoji: string; children: ReactNode }) {
  return (
    <div className={`card ${s.kpi}`}>
      <div>
        <p className="label">{label}</p>
        <p className={`${s.kpiValue} tabular`}>{value}</p>
      </div>
      {children}
      <span className="card-emoji" aria-hidden="true">{emoji}</span>
    </div>
  );
}

function Delta({ value, goodWhenUp = true }: { value: number | null; goodWhenUp?: boolean }) {
  if (value === null) return <span className={s.delta}>New this month</span>;
  const up = value >= 0;
  return <span className={`${s.delta} ${up === goodWhenUp ? s.good : s.bad}`}>{up ? '▲' : '▼'} {Math.abs(Math.round(value))}% vs last month</span>;
}

function BillRow({ payment }: { payment: Payment }) {
  const { data, dispatch, today } = useFinance();
  const status = paymentStatus(payment, today);
  return (
    <li className={s.bill}>
      <div className={s.billInfo}>
        <span className="emoji-circle">{CATEGORIES[payment.category].emoji}</span>
        <div>
          <p className={s.billName}>{payment.name}</p>
          <p className="muted small">{dueLabel(payment, today)}</p>
        </div>
      </div>
      <div className={s.billRight}>
        <span className={`${s.billAmount} tabular`}>{formatMoney(payment.amount, data.profile.currency)}</span>
        {status === 'paid'
          ? <StatusBadge status={status} />
          : <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'payBill', paymentId: payment.id, txId: newId(), today })}>Mark paid</button>}
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const { data, today } = useFinance();
  const { openQuickAdd } = useLayout();
  const [range, setRange] = useState<7 | 30 | 90>(90);
  const cur = data.profile.currency;

  const kpi = useMemo(() => {
    const now = rangeTotals(data.transactions, startOfMonth(today), today);
    const { from, to } = samePeriodLastMonth(today);
    const prev = rangeTotals(data.transactions, from, to);
    const total = totalBalance(data);
    return {
      now, prev, total,
      balanceDelta: percentChange(total, balanceAt(data, addDays(today, -30))),
      rate: savingsRate(data.transactions, monthKey(today)),
    };
  }, [data, today]);
  const series = useMemo(() => balanceSeries(data, today, range), [data, today, range]);
  const monthly = useMemo(() => monthlySeries(data.transactions, today, 6), [data.transactions, today]);
  const breakdown = useMemo(() => categoryBreakdown(data.transactions, startOfMonth(today), today), [data.transactions, today]);
  const tips = useMemo(() => insights(data, today), [data, today]);
  const recent = useMemo(() => sortByDateDesc(data.transactions).slice(0, 5), [data.transactions]);
  const bills = useMemo(() => [...data.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3), [data.payments]);
  const balance = useCountUp(kpi.total);

  return (
    <div className="page">
      <PageHeader title={`Hey ${data.profile.nickname || 'there'} 👋`} subtitle="Here's your money this month">
        <button className={`btn btn-primary btn-glow ${s.addBtn}`} onClick={openQuickAdd} data-tour="quick-add">
          <Icon name="plus" /> Add transaction
        </button>
      </PageHeader>

      <section className={s.kpis} aria-label="Summary">
        <div className={`card ${s.kpi} ${s.hero}`} data-tour="balance">
          <div>
            <p className="label">Total balance</p>
            <p className={`${s.heroValue} tabular`}>{formatMoney(balance, cur)}</p>
          </div>
          {kpi.balanceDelta !== null && (
            <span className={s.heroChip}>{kpi.balanceDelta >= 0 ? '▲' : '▼'} {Math.abs(kpi.balanceDelta).toFixed(1)}% vs last month</span>
          )}
          <span className="card-emoji" aria-hidden="true">💸</span>
        </div>
        <Kpi label="Income this month" value={formatMoney(kpi.now.income, cur)} emoji="💰">
          <Delta value={percentChange(kpi.now.income, kpi.prev.income)} />
        </Kpi>
        <Kpi label="Expenses this month" value={formatMoney(kpi.now.expense, cur)} emoji="🧾">
          <Delta value={percentChange(kpi.now.expense, kpi.prev.expense)} goodWhenUp={false} />
        </Kpi>
        <Kpi label="Savings rate" value={formatPercent(kpi.rate)} emoji="🏦">
          <div className={s.meter} role="presentation"><div style={{ width: `${Math.max(0, Math.min(100, kpi.rate))}%` }} /></div>
        </Kpi>
      </section>

      {tips.length > 0 && (
        <div className={s.insights}>
          {tips.map(t => <span key={t.text} className={`chip ${s[t.tone]}`}>{t.emoji} {t.text}</span>)}
        </div>
      )}

      <section className="card" data-tour="charts">
        <div className="card-head">
          <h2 className="card-title">Balance over time</h2>
          <div className="segmented" role="group" aria-label="Range">
            {([90, 30, 7] as const).map(r => (
              <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>{r}D</button>
            ))}
          </div>
        </div>
        <LineChart data={series} currency={cur} />
      </section>

      <div className={s.split}>
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Income vs expenses</h2>
            <div className={s.legend}>
              <span><i style={{ background: 'var(--lime)' }} />Income</span>
              <span><i style={{ background: 'var(--pink)' }} />Expenses</span>
            </div>
          </div>
          <BarChart data={monthly} currency={cur} />
        </section>
        <section className="card">
          <div className="card-head"><h2 className="card-title">Spending by category</h2></div>
          {breakdown.length
            ? <DonutChart data={breakdown} currency={cur} />
            : <EmptyState emoji="🧾" title="No spending yet" text="This month's expenses show up here." />}
        </section>
      </div>

      <div className={s.split}>
        <section className="card card-flush">
          <div className="card-head pad">
            <h2 className="card-title">Recent transactions</h2>
            <Link to="/transactions">See all</Link>
          </div>
          {recent.length
            ? <TransactionList rows={recent} currency={cur} today={today} />
            : <EmptyState emoji="✨" title="No transactions yet" text="Tap + to add your first one." />}
        </section>
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Upcoming bills</h2>
            <Link to="/payments">See all</Link>
          </div>
          {bills.length
            ? <ul className={s.bills}>{bills.map(p => <BillRow key={p.id} payment={p} />)}</ul>
            : <EmptyState emoji="🧘" title="No bills yet" text="Add rent and subscriptions in Payments." />}
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Route it**

In `src/App.tsx`, replace `<Route index element={<Stub name="Dashboard" />} />` with `<Route index element={<DashboardPage />} />` and add `import DashboardPage from './pages/DashboardPage';`.

- [ ] **Step 6: Verify against the reference**

Run: `npm run build`, then `npm run dev`. Log in with the demo account.

Open `docs/design/dashboard-reference.html` in a second tab and compare at 1440px:
- KPI row: gradient balance card plus 3 tiles, **each with a big faded emoji bottom-right** (💸 💰 🧾 🏦).
- Insight chips.
- A full-width balance chart. The 90D/30D/7D buttons redraw it, with a draw-in animation and a hover crosshair and tooltip.
- Grouped bars with hover tooltips next to the **option A donut** (180px, total centered, legend with dot, emoji, name and %).
- Recent transactions and bills. "Mark paid" turns a bill into a ✓ Paid badge and adds a transaction.

Then check 375px: single column, no horizontal scroll, charts resize. In DevTools Rendering, turn on `prefers-reduced-motion: reduce`: there are no animations and the balance shows its final value immediately. Toggle `data-theme="light"` on `<html>`: the charts recolor.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: add dashboard with KPIs, insights and D3 charts"
```

---

### Task 15: Transactions page (filters, table, CSV)

**Files:**
- Create: `src/components/FilterBar.tsx`, `src/components/FilterBar.module.css`, `src/pages/TransactionsPage.tsx`, `src/pages/TransactionsPage.module.css`
- Modify: `src/App.tsx` (route `transactions`)

**Interfaces:**
- Consumes: `filters.ts` (Task 7), `toCsv`, `downloadCsv`, `TransactionList` (Task 14), `TransactionModal` (Task 12), `Modal`, `Field`, `parseAmount`, `txEffect`
- Produces: `FilterBar({ filters: Filters; accounts: Account[]; onChange(patch: Partial<Filters>): void; onReset(): void })`

- [ ] **Step 1: Write `src/components/FilterBar.module.css`**

```css
.bar { display: flex; flex-direction: column; gap: 16px; }
.row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.search {
  flex: 1 1 260px; display: flex; align-items: center; gap: 8px;
  height: 44px; padding: 0 14px; border: 2px solid transparent; border-radius: var(--radius-btn);
  background: var(--surface-2); color: var(--text-muted);
}
.search:focus-within { border-color: var(--violet); }
.search input { flex: 1; min-width: 0; border: 0; outline: none; background: none; color: var(--text); font: inherit; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chips :global(.chip) { padding: 6px 12px; font-size: 13px; }
.small { flex: 0 1 140px; }
```

- [ ] **Step 2: Write `src/components/FilterBar.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Account, TxType } from '../types';
import { CATEGORIES, CATEGORY_IDS } from '../lib/categories';
import { activeFilterCount, type Filters } from '../lib/filters';
import { parseAmount } from '../lib/validation';
import Field from './Field';
import Icon from './Icon';
import s from './FilterBar.module.css';

interface Props { filters: Filters; accounts: Account[]; onChange: (patch: Partial<Filters>) => void; onReset: () => void }

const PRESETS: { value: Filters['preset']; label: string }[] = [
  { value: '7d', label: '7D' }, { value: '30d', label: '30D' }, { value: '90d', label: '90D' },
  { value: 'all', label: 'All' }, { value: 'custom', label: 'Custom' },
];
const TYPES: { value: TxType; label: string }[] = [
  { value: 'income', label: '💰 Income' }, { value: 'expense', label: '💸 Expense' }, { value: 'transfer', label: '🔁 Transfer' },
];

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

/** Keeps a free-typed draft and commits a parsed number on blur/Enter, so "12." isn't eaten mid-typing. */
function AmountInput({ label, value, onCommit }: { label: string; value?: number; onCommit: (v: number | undefined) => void }) {
  const [draft, setDraft] = useState(value?.toString() ?? '');
  useEffect(() => setDraft(value?.toString() ?? ''), [value]);
  const commit = () => {
    const next = draft.trim() === '' ? undefined : parseAmount(draft) ?? undefined;
    if (next === undefined) setDraft('');
    if (next !== value) onCommit(next);
  };
  return (
    <div className={s.small}>
      <Field label={label}>
        <input inputMode="decimal" placeholder="0" value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); }} />
      </Field>
    </div>
  );
}

export default function FilterBar({ filters, accounts, onChange, onReset }: Props) {
  return (
    <div className={s.bar}>
      <div className={s.row}>
        <label className={s.search}>
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search description or category" aria-label="Search"
            value={filters.q} onChange={e => onChange({ q: e.target.value })} />
        </label>
        <div className="segmented" role="group" aria-label="Date range">
          {PRESETS.map(p => (
            <button key={p.value} type="button" aria-pressed={filters.preset === p.value} onClick={() => onChange({ preset: p.value })}>{p.label}</button>
          ))}
        </div>
      </div>

      {filters.preset === 'custom' && (
        <div className={s.row}>
          <Field label="From"><input type="date" value={filters.from ?? ''} onChange={e => onChange({ from: e.target.value || undefined })} /></Field>
          <Field label="To"><input type="date" value={filters.to ?? ''} onChange={e => onChange({ to: e.target.value || undefined })} /></Field>
        </div>
      )}

      <div className={s.chips} role="group" aria-label="Type">
        {TYPES.map(t => (
          <button key={t.value} type="button" className="chip" aria-pressed={filters.types.includes(t.value)}
            onClick={() => onChange({ types: toggle(filters.types, t.value) })}>{t.label}</button>
        ))}
      </div>

      <div className={s.chips} role="group" aria-label="Categories">
        {CATEGORY_IDS.map(c => (
          <button key={c} type="button" className="chip" aria-pressed={filters.categories.includes(c)}
            onClick={() => onChange({ categories: toggle(filters.categories, c) })}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</button>
        ))}
      </div>

      <div className={s.row}>
        <Field label="Account">
          <select value={filters.accountId ?? ''} onChange={e => onChange({ accountId: e.target.value || undefined })}>
            <option value="">All accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <AmountInput label="Min amount" value={filters.min} onCommit={min => onChange({ min })} />
        <AmountInput label="Max amount" value={filters.max} onCommit={max => onChange({ max })} />
        {activeFilterCount(filters) > 0 && <button type="button" className="btn btn-ghost" onClick={onReset}>Reset filters</button>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/pages/TransactionsPage.module.css`**

```css
.filtersDesktop { display: none; }
.filtersButton { align-self: flex-start; }
.pager { display: flex; align-items: center; justify-content: center; gap: 16px; }
@media (min-width: 768px) {
  .filtersDesktop { display: block; }
  .filtersButton { display: none; }
}
```

- [ ] **Step 4: Write `src/pages/TransactionsPage.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Transaction } from '../types';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import TransactionList from '../components/TransactionList';
import TransactionModal from '../components/TransactionModal';
import { downloadCsv, toCsv } from '../lib/csv';
import { activeFilterCount, applyFilters, filtersFromParams, filtersToParams, paginate, sortTxs, type Filters, type SortKey } from '../lib/filters';
import { txEffect } from '../lib/finance';
import { formatMoney } from '../lib/format';
import { useFinance } from '../state/FinanceContext';
import s from './TransactionsPage.module.css';

export default function TransactionsPage() {
  const { data, dispatch, today } = useFinance();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null);
  const [sheet, setSheet] = useState(false);
  const cur = data.profile.currency;

  const filters = useMemo(() => filtersFromParams(params), [params]);
  const accountNames = useMemo(() => Object.fromEntries(data.accounts.map(a => [a.id, a.name])), [data.accounts]);
  const filtered = useMemo(
    () => sortTxs(applyFilters(data.transactions, filters, today), filters.sort, accountNames),
    [data.transactions, filters, today, accountNames],
  );
  const page = paginate(filtered, filters.page, filters.pageSize);
  const count = activeFilterCount(filters);
  const net = filtered.reduce((sum, t) => sum + (t.type === 'transfer' ? 0 : txEffect(t)), 0);

  const update = (patch: Partial<Filters>) => setParams(filtersToParams({ ...filters, page: 1, ...patch }), { replace: true });
  const reset = () => setParams(new URLSearchParams(), { replace: true });
  const onSort = (key: SortKey) => update({
    sort: {
      key,
      dir: filters.sort.key === key
        ? (filters.sort.dir === 'asc' ? 'desc' : 'asc')
        : (key === 'date' || key === 'amount' ? 'desc' : 'asc'),
    },
  });
  const onSelect = (tx: Transaction) => {
    if (tx.type !== 'transfer') return setEditing(tx);
    if (confirm('Delete this transfer? Both sides will be removed.')) dispatch({ type: 'deleteTx', id: tx.id });
  };

  const bar = <FilterBar filters={filters} accounts={data.accounts} onChange={update} onReset={reset} />;

  return (
    <div className="page">
      <PageHeader title="Transactions" subtitle={`${filtered.length} result${filtered.length === 1 ? '' : 's'} · net ${formatMoney(net, cur, { sign: true })}`}>
        <button className="btn btn-secondary" disabled={!filtered.length}
          onClick={() => downloadCsv(`pulse-transactions-${today}.csv`, toCsv(filtered, accountNames))}>
          <Icon name="download" /> Export CSV
        </button>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" /> Add</button>
      </PageHeader>

      <div className={`card ${s.filtersDesktop}`}>{bar}</div>
      <button className={`btn btn-secondary ${s.filtersButton}`} onClick={() => setSheet(true)}>
        <Icon name="filter" /> Filters{count ? ` (${count})` : ''}
      </button>

      <section className="card card-flush">
        {page.total === 0 ? (
          <EmptyState emoji="🔍" title="Nothing matches" text="Try a wider date range or fewer filters.">
            {count > 0 && <button className="btn btn-secondary" onClick={reset}>Clear filters</button>}
          </EmptyState>
        ) : (
          <TransactionList rows={page.rows} currency={cur} today={today} accountNames={accountNames}
            sort={filters.sort} onSort={onSort} onSelect={onSelect} />
        )}
      </section>

      {page.totalPages > 1 && (
        <nav className={s.pager} aria-label="Pagination">
          <button className="btn btn-secondary" disabled={page.page <= 1} onClick={() => update({ page: page.page - 1 })}><Icon name="chevron-left" /> Prev</button>
          <span className="muted">Page {page.page} of {page.totalPages}</span>
          <button className="btn btn-secondary" disabled={page.page >= page.totalPages} onClick={() => update({ page: page.page + 1 })}>Next <Icon name="chevron-right" /></button>
        </nav>
      )}

      {sheet && (
        <Modal title="Filters" variant="sheet" onClose={() => setSheet(false)}>
          {bar}
          <button className="btn btn-primary btn-block" onClick={() => setSheet(false)}>Show {filtered.length} results</button>
        </Modal>
      )}
      {editing && <TransactionModal tx={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
```

- [ ] **Step 5: Route it**

In `src/App.tsx`, replace the `transactions` stub with `<Route path="transactions" element={<TransactionsPage />} />` and import `TransactionsPage`.

- [ ] **Step 6: Verify in the browser**

Run: `npm run build`, then `npm run dev` with the demo account → Transactions.

Check by hand:
1. It defaults to 30 days, 10 rows and page 1 of N.
2. Clicking a column header sorts, and a second click reverses. The URL shows `?sort=amount:asc`.
3. Typing in search filters live. Toggling chips, choosing an account and entering a min amount of `20` then Enter all filter.
4. Reload: the filters survive. Copy the URL into a new tab and you get the same view.
5. Hand-edit the URL to `/transactions?page=abc&min=-5&range=nope`: the default view shows, with no crash.
6. Export CSV downloads a file that opens cleanly in a spreadsheet.
7. Clicking an expense row opens edit. Change the amount and save, and the list updates. Delete from the modal works. Clicking a transfer row asks to delete both legs.
8. At 375px, rows are compact cards, and the "Filters (n)" button opens a bottom sheet.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: add transactions page with URL-synced filters and CSV export"
```

---

### Task 16: Accounts page (cards, sparklines, transfers)

**Files:**
- Create: `src/pages/AccountsPage.tsx`, `src/pages/AccountsPage.module.css`, `src/pages/AccountModal.tsx`, `src/pages/TransferModal.tsx`
- Modify: `src/App.tsx` (route `accounts`)

**Interfaces:**
- Consumes: `accountBalance`, `balanceSeries`, `totalBalance` (Task 5), `Sparkline` (Task 13), `validateAccount`, `validateTransfer`, `parseAmount`, `isValid` (Task 8), `createTransferLegs`, `accountInUse`, `newId` (Task 9), `ACCOUNT_COLORS`, `KIND_LABEL`

- [ ] **Step 1: Write `src/pages/AccountsPage.module.css`**

```css
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.card { display: flex; flex-direction: column; gap: 12px; overflow: hidden; border-top-width: 4px; }
.top { display: flex; align-items: center; justify-content: space-between; }
.name { font-size: 18px; }
.balance { font: 700 32px var(--font-display); letter-spacing: -0.02em; }
.negative { color: var(--pink); }
.swatches { display: flex; gap: 10px; }
.swatch { width: 32px; height: 32px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; }
.swatch[aria-pressed='true'] { border-color: var(--text); }
@media (hover: hover) { .card:hover { transform: translateY(-2px); box-shadow: var(--glow); } }
```

- [ ] **Step 2: Write `src/pages/AccountModal.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import type { Account, AccountKind } from '../types';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { ACCOUNT_COLORS, KIND_LABEL } from '../lib/categories';
import { isValid, parseAmount, validateAccount, type AccountForm, type Errors } from '../lib/validation';
import { accountInUse, newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import s from './AccountsPage.module.css';

export default function AccountModal({ account, onClose }: { account?: Account; onClose: () => void }) {
  const { data, dispatch } = useFinance();
  const [form, setForm] = useState<AccountForm>(() => account
    ? { name: account.name, kind: account.kind, openingBalance: String(account.openingBalance), color: account.color }
    : { name: '', kind: 'checking', openingBalance: '', color: ACCOUNT_COLORS[data.accounts.length % ACCOUNT_COLORS.length] });
  const [errors, setErrors] = useState<Errors<keyof AccountForm>>({});
  const inUse = account ? accountInUse(data, account.id) : false;

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateAccount(form);
    setErrors(errs);
    if (!isValid(errs)) return;
    const next: Account = {
      id: account?.id ?? newId(), name: form.name.trim(), kind: form.kind,
      openingBalance: parseAmount(form.openingBalance || '0', true)!, color: form.color,
    };
    dispatch(account ? { type: 'editAccount', account: next } : { type: 'addAccount', account: next });
    onClose();
  }

  function remove() {
    if (account && confirm(`Delete "${account.name}"?`)) {
      dispatch({ type: 'deleteAccount', id: account.id });
      onClose();
    }
  }

  return (
    <Modal title={account ? 'Edit account' : 'Add account'} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <Field label="Name" error={errors.name}>
          <input autoFocus maxLength={30} placeholder="e.g. Checking" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="form-grid">
          <Field label="Type">
            <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as AccountKind })}>
              {(Object.keys(KIND_LABEL) as AccountKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Opening balance" error={errors.openingBalance}>
            <input inputMode="decimal" placeholder="0.00" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: e.target.value })} />
          </Field>
        </div>
        <div className="field">
          <span className="field-label">Color</span>
          <div className={s.swatches} role="group" aria-label="Color">
            {ACCOUNT_COLORS.map(c => (
              <button key={c} type="button" className={s.swatch} style={{ background: c }} aria-pressed={form.color === c}
                aria-label={c.replace(/var\(--|\)/g, '')} onClick={() => setForm({ ...form, color: c })} />
            ))}
          </div>
        </div>
        {inUse && <p className="muted small">This account has transactions or bills, so it can't be deleted.</p>}
        <div className="modal-actions">
          {account && <button type="button" className="btn btn-danger" disabled={inUse} onClick={remove}>Delete</button>}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{account ? 'Save' : 'Add account'}</button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 3: Write `src/pages/TransferModal.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { isValid, parseAmount, validateTransfer, type Errors, type TransferForm } from '../lib/validation';
import { createTransferLegs, newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';

export default function TransferModal({ onClose }: { onClose: () => void }) {
  const { data, dispatch, today } = useFinance();
  const accounts = data.accounts;
  const [form, setForm] = useState<TransferForm>({
    fromId: accounts[0]?.id ?? '', toId: accounts[1]?.id ?? '', amount: '', date: today, description: 'Transfer',
  });
  const [errors, setErrors] = useState<Errors<keyof TransferForm>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateTransfer(form, accounts.map(a => a.id), today);
    setErrors(errs);
    if (!isValid(errs)) return;
    const legs = createTransferLegs(
      { fromId: form.fromId, toId: form.toId, amount: parseAmount(form.amount)!, date: form.date, description: form.description.trim() },
      { transferId: newId(), outId: newId(), inId: newId() },
    );
    dispatch({ type: 'transfer', legs });
    onClose();
  }

  const select = (key: 'fromId' | 'toId', label: string) => (
    <Field label={label} error={errors[key]}>
      <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </Field>
  );

  return (
    <Modal title="Move money 🔁" onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <div className="form-grid">{select('fromId', 'From')}{select('toId', 'To')}</div>
        <Field label="Amount" error={errors.amount}>
          <input autoFocus inputMode="decimal" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <div className="form-grid">
          <Field label="Date" error={errors.date}><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Note" error={errors.description}><input maxLength={60} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Transfer</button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 4: Write `src/pages/AccountsPage.tsx`**

```tsx
import { useMemo, useState } from 'react';
import type { Account } from '../types';
import Sparkline from '../charts/Sparkline';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { KIND_LABEL } from '../lib/categories';
import { accountBalance, balanceSeries, totalBalance } from '../lib/finance';
import { formatMoney } from '../lib/format';
import { useFinance } from '../state/FinanceContext';
import AccountModal from './AccountModal';
import TransferModal from './TransferModal';
import s from './AccountsPage.module.css';

function AccountCard({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const { data, today } = useFinance();
  const balance = accountBalance(data, account.id);
  const trend = useMemo(() => balanceSeries(data, today, 30, account.id).map(p => p.balance), [data, today, account.id]);
  const count = data.transactions.filter(t => t.accountId === account.id).length;
  return (
    <article className={`card ${s.card}`} style={{ borderTopColor: account.color }}>
      <div className={s.top}>
        <span className="badge">{KIND_LABEL[account.kind]}</span>
        <button className="icon-btn" onClick={onEdit} aria-label={`Edit ${account.name}`}><Icon name="edit" size={18} /></button>
      </div>
      <h2 className={s.name}>{account.name}</h2>
      <p className={`${s.balance} tabular ${balance < 0 ? s.negative : ''}`}>{formatMoney(balance, data.profile.currency)}</p>
      <Sparkline data={trend} color={account.color} />
      <p className="muted small">{count} transaction{count === 1 ? '' : 's'} · last 30 days trend</p>
    </article>
  );
}

export default function AccountsPage() {
  const { data } = useFinance();
  const [editing, setEditing] = useState<Account | 'new' | null>(null);
  const [transfer, setTransfer] = useState(false);
  const n = data.accounts.length;

  return (
    <div className="page">
      <PageHeader title="Accounts 💳" subtitle={`${formatMoney(totalBalance(data), data.profile.currency)} across ${n} account${n === 1 ? '' : 's'}`}>
        <button className="btn btn-secondary" disabled={n < 2} onClick={() => setTransfer(true)}><Icon name="swap" /> Transfer</button>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" /> Add account</button>
      </PageHeader>
      {n === 0
        ? <div className="card"><EmptyState emoji="💳" title="No accounts yet" text="Add your checking, savings or credit card to start tracking." /></div>
        : <div className={s.grid}>{data.accounts.map(a => <AccountCard key={a.id} account={a} onEdit={() => setEditing(a)} />)}</div>}
      {editing && <AccountModal account={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {transfer && <TransferModal onClose={() => setTransfer(false)} />}
    </div>
  );
}
```

- [ ] **Step 5: Route, verify, commit**

In `src/App.tsx`, replace the `accounts` stub with `<Route path="accounts" element={<AccountsPage />} />` and add the import.

Run: `npm run build`, then check in `npm run dev`:
1. Three demo cards appear, each with a colored top border, a balance and a drawn-in sparkline.
2. Transfer $100 from Checking to Savings: the balances move by ±100 and the total is unchanged. The transfer shows twice in Transactions (🔁).
3. Add a new account with opening balance `-120` (credit) and it shows in pink.
4. Editing a demo account shows the delete button disabled with the explanation. A new, empty account can be deleted.

```bash
git add src
git commit -m "feat: add accounts page with sparklines and transfers"
```

---

### Task 17: Payments page (bills)

**Files:**
- Create: `src/pages/PaymentsPage.tsx`, `src/pages/PaymentsPage.module.css`, `src/pages/PaymentModal.tsx`
- Modify: `src/App.tsx` (route `payments`)

**Interfaces:**
- Consumes: `paymentStatus`, `dueLabel` (Task 5), `validatePayment`, `parseAmount`, `isValid` (Task 8), `newId` (Task 9), `StatusBadge`, `CATEGORIES`, `CATEGORY_IDS`, `RECURRENCE_LABEL`, `monthKey`

- [ ] **Step 1: Write `src/pages/PaymentsPage.module.css`**

```css
.summary { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.big { font: 700 28px var(--font-display); margin-top: 8px; }
.good { color: var(--lime); }
.bad { color: var(--pink); }
.list { display: flex; flex-direction: column; gap: 12px; }
.item {
  display: grid; align-items: center; gap: 12px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'icon info amount' 'icon badge actions';
}
.item > :global(.emoji-circle) { grid-area: icon; }
.info { grid-area: info; min-width: 0; }
.name { font-weight: 600; }
.amount { grid-area: amount; text-align: right; font: 600 16px var(--font-display); }
.badgeCell { grid-area: badge; }
.actions { grid-area: actions; display: flex; justify-content: flex-end; gap: 6px; }
@media (min-width: 768px) {
  .item { grid-template-columns: auto minmax(0, 1fr) auto auto auto; grid-template-areas: 'icon info badge amount actions'; }
}
```

- [ ] **Step 2: Write `src/pages/PaymentModal.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import type { CategoryId, Payment, Recurrence } from '../types';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { CATEGORIES, CATEGORY_IDS, RECURRENCE_LABEL } from '../lib/categories';
import { isValid, parseAmount, validatePayment, type Errors, type PaymentForm } from '../lib/validation';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';

export default function PaymentModal({ payment, onClose }: { payment?: Payment; onClose: () => void }) {
  const { data, dispatch, today } = useFinance();
  const [form, setForm] = useState<PaymentForm>(() => payment
    ? { name: payment.name, amount: String(payment.amount), category: payment.category, accountId: payment.accountId, dueDate: payment.dueDate, recurrence: payment.recurrence }
    : { name: '', amount: '', category: 'bills', accountId: data.accounts[0]?.id ?? '', dueDate: today, recurrence: 'monthly' });
  const [errors, setErrors] = useState<Errors<keyof PaymentForm>>({});
  const set = <K extends keyof PaymentForm>(k: K, v: PaymentForm[K]) => setForm(f => ({ ...f, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validatePayment(form, data.accounts.map(a => a.id), today);
    setErrors(errs);
    if (!isValid(errs)) return;
    const next: Payment = {
      ...payment,
      id: payment?.id ?? newId(), name: form.name.trim(), amount: parseAmount(form.amount)!,
      category: form.category, accountId: form.accountId, dueDate: form.dueDate, recurrence: form.recurrence,
    };
    dispatch(payment ? { type: 'editPayment', payment: next } : { type: 'addPayment', payment: next });
    onClose();
  }

  function remove() {
    if (payment && confirm(`Delete "${payment.name}"? Past transactions stay.`)) {
      dispatch({ type: 'deletePayment', id: payment.id });
      onClose();
    }
  }

  return (
    <Modal title={payment ? 'Edit bill' : 'Add bill'} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <Field label="Name" error={errors.name}><input autoFocus maxLength={40} placeholder="e.g. Spotify" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        <div className="form-grid">
          <Field label="Amount" error={errors.amount}><input inputMode="decimal" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} /></Field>
          <Field label="Next due" error={errors.dueDate}><input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></Field>
        </div>
        <div className="form-grid">
          <Field label="Repeats">
            <select value={form.recurrence} onChange={e => set('recurrence', e.target.value as Recurrence)}>
              {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map(r => <option key={r} value={r}>{RECURRENCE_LABEL[r]}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value as CategoryId)}>
              {CATEGORY_IDS.map(c => <option key={c} value={c}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</option>)}
            </select>
          </Field>
          <Field label="Pay from" error={errors.accountId}>
            <select value={form.accountId} onChange={e => set('accountId', e.target.value)}>
              {data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="modal-actions">
          {payment && <button type="button" className="btn btn-danger" onClick={remove}>Delete</button>}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{payment ? 'Save' : 'Add bill'}</button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 3: Write `src/pages/PaymentsPage.tsx`**

```tsx
import { useMemo, useState } from 'react';
import type { Payment, PaymentStatus } from '../types';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { CATEGORIES, RECURRENCE_LABEL } from '../lib/categories';
import { monthKey } from '../lib/dates';
import { dueLabel, paymentStatus } from '../lib/finance';
import { formatMoney } from '../lib/format';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import PaymentModal from './PaymentModal';
import s from './PaymentsPage.module.css';

const ORDER: Record<PaymentStatus, number> = { overdue: 0, upcoming: 1, paid: 2 };

export default function PaymentsPage() {
  const { data, dispatch, today } = useFinance();
  const [editing, setEditing] = useState<Payment | 'new' | null>(null);
  const cur = data.profile.currency;
  const accountNames = useMemo(() => Object.fromEntries(data.accounts.map(a => [a.id, a.name])), [data.accounts]);
  const rows = useMemo(
    () => data.payments
      .map(p => ({ p, status: paymentStatus(p, today) }))
      .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.p.dueDate.localeCompare(b.p.dueDate)),
    [data.payments, today],
  );
  const overdue = rows.filter(r => r.status === 'overdue').length;
  const paid = rows.filter(r => r.status === 'paid').length;
  const stillToPay = rows
    .filter(r => r.status === 'overdue' || (r.status === 'upcoming' && monthKey(r.p.dueDate) === monthKey(today)))
    .reduce((sum, r) => sum + r.p.amount, 0);

  return (
    <div className="page">
      <PageHeader title="Payments ⏰" subtitle="Bills and subscriptions, sorted by what needs you first">
        <button className="btn btn-primary" disabled={!data.accounts.length} onClick={() => setEditing('new')}><Icon name="plus" /> Add bill</button>
      </PageHeader>

      <div className={s.summary}>
        <div className="card"><p className="label">Still to pay this month</p><p className={`${s.big} tabular`}>{formatMoney(stillToPay, cur)}</p></div>
        <div className="card"><p className="label">Overdue</p><p className={`${s.big} ${overdue ? s.bad : ''}`}>{overdue}</p></div>
        <div className="card"><p className="label">Paid this month</p><p className={`${s.big} ${s.good}`}>{paid}</p></div>
      </div>

      {rows.length === 0 ? (
        <div className="card"><EmptyState emoji="🧘" title="No bills yet" text="Add rent, subscriptions and anything that repeats." /></div>
      ) : (
        <ul className={s.list}>
          {rows.map(({ p, status }) => (
            <li key={p.id} className={`card ${s.item}`}>
              <span className="emoji-circle">{CATEGORIES[p.category].emoji}</span>
              <div className={s.info}>
                <p className={s.name}>{p.name}</p>
                <p className="muted small">{dueLabel(p, today)} · {RECURRENCE_LABEL[p.recurrence]} · {accountNames[p.accountId] ?? '—'}</p>
              </div>
              <span className={s.badgeCell}><StatusBadge status={status} /></span>
              <p className={`${s.amount} tabular`}>{formatMoney(p.amount, cur)}</p>
              <div className={s.actions}>
                {status !== 'paid' && (
                  <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'payBill', paymentId: p.id, txId: newId(), today })}>Mark as paid</button>
                )}
                <button className="icon-btn" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Icon name="edit" size={18} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <PaymentModal payment={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
```

- [ ] **Step 4: Route, verify, commit**

In `src/App.tsx`, replace the `payments` stub with `<Route path="payments" element={<PaymentsPage />} />` and add the import.

Run: `npm run build`, then check in `npm run dev` with the demo account:
1. Phone bill is listed first as "! Overdue", then Rent as "● Upcoming", then the paid ones.
2. "Mark as paid" on Phone bill: it becomes ✓ Paid, its due date moves a month ahead, and a "Phone bill" expense appears in Transactions. The Dashboard's "bills due this week" chip count drops.
3. Add a one-time bill and pay it: it stays paid.
4. On mobile the rows wrap into two lines without overflow.

```bash
git add src
git commit -m "feat: add payments page with bill status and mark-as-paid"
```

---

### Task 18: Goals page (progress rings)

**Files:**
- Create: `src/pages/GoalsPage.tsx`, `src/pages/GoalsPage.module.css`, `src/pages/GoalModal.tsx`, `src/pages/FundModal.tsx`
- Modify: `src/App.tsx` (route `goals`)

**Interfaces:**
- Consumes: `ProgressRing` (Task 13), `validateGoal`, `amountError`, `parseAmount`, `isValid` (Task 8), `newId` (Task 9), `GOAL_EMOJIS`, `formatDateLong`

- [ ] **Step 1: Write `src/pages/GoalsPage.module.css`**

```css
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.goal { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; overflow: hidden; }
.top { display: flex; align-self: stretch; justify-content: space-between; align-items: center; }
.emoji { font-size: 32px; }
.done { color: var(--lime); font-weight: 600; }
.newCard {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 280px;
  border: 2px dashed var(--border); border-radius: var(--radius-card); background: transparent;
  color: var(--text-muted); font: 600 16px var(--font-body); cursor: pointer; transition: border-color 200ms, color 200ms;
}
.newCard:hover { border-color: var(--violet); color: var(--text); }
.newCard span { font-size: 32px; }
.emojiPicker { display: flex; flex-wrap: wrap; gap: 8px; }
.emojiPicker button { width: 44px; height: 44px; border: 2px solid transparent; border-radius: 12px; background: var(--surface-2); font-size: 22px; cursor: pointer; }
.emojiPicker button[aria-pressed='true'] { border-color: var(--violet); }

/* 🎉 burst when a goal hits 100% */
.burst { position: absolute; inset: 0; pointer-events: none; }
.burst span {
  position: absolute; left: 50%; top: 45%; font-size: 24px;
  animation: burst 1.4s var(--ease) forwards;
  --angle: calc(var(--i) * 60deg);
}
@keyframes burst {
  from { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) rotate(calc(-1 * var(--angle))); opacity: 1; }
  to { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-110px) rotate(calc(-1 * var(--angle))); opacity: 0; }
}
```

- [ ] **Step 2: Write `src/pages/GoalModal.tsx` and `src/pages/FundModal.tsx`**

`src/pages/GoalModal.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { GOAL_EMOJIS } from '../lib/categories';
import { isValid, parseAmount, validateGoal, type Errors, type GoalForm } from '../lib/validation';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import s from './GoalsPage.module.css';

export default function GoalModal({ onClose }: { onClose: () => void }) {
  const { dispatch, today } = useFinance();
  const [form, setForm] = useState<GoalForm>({ name: '', emoji: GOAL_EMOJIS[0], target: '', deadline: '' });
  const [errors, setErrors] = useState<Errors<keyof GoalForm>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateGoal(form, today);
    setErrors(errs);
    if (!isValid(errs)) return;
    dispatch({
      type: 'addGoal',
      goal: { id: newId(), name: form.name.trim(), emoji: form.emoji, target: parseAmount(form.target)!, saved: 0, ...(form.deadline ? { deadline: form.deadline } : {}) },
    });
    onClose();
  }

  return (
    <Modal title="New goal 🎯" onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <div className="field">
          <span className="field-label">Pick an icon</span>
          <div className={s.emojiPicker} role="group" aria-label="Icon">
            {GOAL_EMOJIS.map(e => <button key={e} type="button" aria-pressed={form.emoji === e} onClick={() => setForm({ ...form, emoji: e })}>{e}</button>)}
          </div>
        </div>
        <Field label="What are you saving for?" error={errors.name}>
          <input autoFocus maxLength={40} placeholder="e.g. New headphones" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="form-grid">
          <Field label="Target" error={errors.target}><input inputMode="decimal" placeholder="0.00" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} /></Field>
          <Field label="By (optional)" error={errors.deadline}><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></Field>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Create goal</button>
        </div>
      </form>
    </Modal>
  );
}
```

`src/pages/FundModal.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import type { Goal } from '../types';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { formatMoney } from '../lib/format';
import { amountError, parseAmount } from '../lib/validation';
import { useFinance } from '../state/FinanceContext';

export default function FundModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { data, dispatch } = useFinance();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();
  const left = goal.target - goal.saved;

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = amountError(amount);
    setError(err);
    if (err) return;
    dispatch({ type: 'fundGoal', id: goal.id, amount: parseAmount(amount)! });
    onClose();
  }

  return (
    <Modal title={`Add to ${goal.emoji} ${goal.name}`} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <p className="muted">{formatMoney(left, data.profile.currency)} to go. You've got this.</p>
        <Field label="Amount" error={error}>
          <input autoFocus inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setAmount(String(left))}>Fill it up</button>
          <button className="btn btn-primary">Add money</button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 3: Write `src/pages/GoalsPage.tsx`**

```tsx
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Goal } from '../types';
import ProgressRing from '../charts/ProgressRing';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { formatDateLong, formatMoney } from '../lib/format';
import { useFinance } from '../state/FinanceContext';
import FundModal from './FundModal';
import GoalModal from './GoalModal';
import s from './GoalsPage.module.css';

const BURST = ['🎉', '✨', '💜', '🎊', '⭐', '💚'];

function GoalCard({ goal, onFund }: { goal: Goal; onFund: () => void }) {
  const { data, dispatch, today } = useFinance();
  const cur = data.profile.currency;
  const done = goal.saved >= goal.target;
  const wasDone = useRef(done);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const justFinished = done && !wasDone.current;
    wasDone.current = done;
    if (!justFinished) return;
    setCelebrate(true);
    const t = setTimeout(() => setCelebrate(false), 1600);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <article className={`card ${s.goal}`}>
      {celebrate && (
        <div className={s.burst} aria-hidden="true">
          {BURST.map((e, i) => <span key={i} style={{ '--i': i } as CSSProperties}>{e}</span>)}
        </div>
      )}
      <div className={s.top}>
        <span className={s.emoji} aria-hidden="true">{goal.emoji}</span>
        <button className="icon-btn" aria-label={`Delete ${goal.name}`}
          onClick={() => { if (confirm(`Delete "${goal.name}"?`)) dispatch({ type: 'deleteGoal', id: goal.id }); }}>
          <Icon name="trash" size={18} />
        </button>
      </div>
      <h2 className="card-title">{goal.name}</h2>
      <ProgressRing value={goal.target ? goal.saved / goal.target : 0} />
      <p className="tabular"><strong>{formatMoney(goal.saved, cur)}</strong> <span className="muted">of {formatMoney(goal.target, cur)}</span></p>
      {goal.deadline && (
        <p className="muted small">By {formatDateLong(goal.deadline)}{goal.deadline < today && !done ? ' · past the date' : ''}</p>
      )}
      {done
        ? <p className={s.done} role="status">🎉 Goal crushed!</p>
        : <button className="btn btn-secondary" onClick={onFund}>Add money</button>}
    </article>
  );
}

export default function GoalsPage() {
  const { data } = useFinance();
  const [creating, setCreating] = useState(false);
  const [funding, setFunding] = useState<Goal | null>(null);
  const cur = data.profile.currency;
  const saved = data.goals.reduce((sum, g) => sum + g.saved, 0);
  const target = data.goals.reduce((sum, g) => sum + g.target, 0);

  return (
    <div className="page">
      <PageHeader title="Goals 🎯" subtitle={data.goals.length ? `${formatMoney(saved, cur)} saved of ${formatMoney(target, cur)}` : 'Save up for the things you want'}>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" /> New goal</button>
      </PageHeader>
      <div className={s.grid}>
        {data.goals.map(g => <GoalCard key={g.id} goal={g} onFund={() => setFunding(g)} />)}
        <button className={s.newCard} onClick={() => setCreating(true)}><span aria-hidden="true">➕</span>New goal</button>
      </div>
      {creating && <GoalModal onClose={() => setCreating(false)} />}
      {funding && <FundModal goal={funding} onClose={() => setFunding(null)} />}
    </div>
  );
}
```

- [ ] **Step 4: Route, verify, commit**

In `src/App.tsx`, replace the `goals` stub with `<Route path="goals" element={<GoalsPage />} />` and add the import.

Run: `npm run build`, then check in `npm run dev`:
1. Two demo goals appear with rings animating to 40% and 15%.
2. Add $300 to the laptop goal and its ring animates from 40% to 60%.
3. "Fill it up", then Add money: the ring hits 100%, the emoji burst plays and the card shows "🎉 Goal crushed!".
4. Create a goal with a past deadline and it shows "Pick a future date".
5. Delete asks for confirmation.

```bash
git add src
git commit -m "feat: add goals page with progress rings"
```

---

### Task 19: Settings page

**Files:**
- Create: `src/pages/SettingsPage.tsx`, `src/pages/SettingsPage.module.css`
- Modify: `src/App.tsx` (route `settings`)

**Interfaces:**
- Consumes: `useAuth`, `useFinance`, `createSeedData` (Task 6), `emptyData` (Task 4), `AVATARS`, `CURRENCIES`
- Produces: "Replay intro" sets `tourDone: false` and navigates to `/welcome`, which Task 20 makes work for logged-in users.

- [ ] **Step 1: Write `src/pages/SettingsPage.module.css`**

```css
.sections { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); align-items: start; }
.section { display: flex; flex-direction: column; gap: 16px; }
.avatars { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.avatars button {
  aspect-ratio: 1; border: 2px solid transparent; border-radius: 14px;
  background: var(--surface-2); font-size: 24px; cursor: pointer;
}
.avatars button[aria-pressed='true'] { border-color: var(--violet); }
.danger { border-color: color-mix(in srgb, var(--pink) 40%, var(--border)); }
```

- [ ] **Step 2: Write `src/pages/SettingsPage.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import type { Currency, Profile } from '../types';
import Field from '../components/Field';
import PageHeader from '../components/PageHeader';
import { emptyData } from '../data/defaults';
import { createSeedData } from '../data/seed';
import { AVATARS, CURRENCIES } from '../lib/categories';
import { useAuth } from '../state/AuthContext';
import { useFinance } from '../state/FinanceContext';
import s from './SettingsPage.module.css';

export default function SettingsPage() {
  const { data, dispatch } = useFinance();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const p = data.profile;
  const setProfile = (profile: Partial<Profile>) => dispatch({ type: 'setProfile', profile });

  function replayIntro() {
    dispatch({ type: 'setOnboarding', onboarding: { tourDone: false } });
    navigate('/welcome');
  }

  function resetToSample() {
    if (!confirm('Replace all your data with the sample data?')) return;
    dispatch({ type: 'replaceAll', data: { ...createSeedData(new Date(), p), onboarding: data.onboarding } });
  }

  function clearAll() {
    if (!confirm("Delete all accounts, transactions, bills and goals? This can't be undone.")) return;
    dispatch({ type: 'replaceAll', data: emptyData(p) });
  }

  return (
    <div className="page">
      <PageHeader title="Settings ⚙️" subtitle={user?.email} />
      <div className={s.sections}>
        <section className={`card ${s.section}`}>
          <h2 className="card-title">Profile</h2>
          <Field label="Nickname">
            <input maxLength={20} value={p.nickname} onChange={e => setProfile({ nickname: e.target.value })} />
          </Field>
          <div className="field">
            <span className="field-label">Avatar</span>
            <div className={s.avatars} role="group" aria-label="Avatar">
              {AVATARS.map(a => <button key={a} type="button" aria-pressed={p.avatar === a} onClick={() => setProfile({ avatar: a })}>{a}</button>)}
            </div>
          </div>
        </section>

        <section className={`card ${s.section}`}>
          <h2 className="card-title">Preferences</h2>
          <Field label="Currency">
            <select value={p.currency} onChange={e => setProfile({ currency: e.target.value as Currency })}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="field">
            <span className="field-label">Theme</span>
            <div className="segmented" role="group" aria-label="Theme">
              <button type="button" aria-pressed={p.theme === 'dark'} onClick={() => setProfile({ theme: 'dark' })}>🌙 Dark</button>
              <button type="button" aria-pressed={p.theme === 'light'} onClick={() => setProfile({ theme: 'light' })}>☀️ Light</button>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={replayIntro}>▶️ Replay intro</button>
        </section>

        <section className={`card ${s.section} ${s.danger}`}>
          <h2 className="card-title">Your data</h2>
          <p className="muted small">Everything lives in this browser only. Pulse is a simulation, and nothing is sent anywhere.</p>
          <button className="btn btn-secondary" onClick={resetToSample}>🎲 Reset to sample data</button>
          <button className="btn btn-danger" onClick={clearAll}>🗑️ Clear my data</button>
          <button className="btn btn-ghost" onClick={logout}>👋 Log out</button>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Route it**

In `src/App.tsx`, replace the `settings` stub with `<Route path="settings" element={<SettingsPage />} />` and add the import. If no stubs remain in use other than `/welcome` and `/setup`, keep `Stub` until Task 20 removes it.

- [ ] **Step 4: Verify and commit**

Run: `npm run build`, then check in `npm run dev`:
1. Changing the nickname or avatar updates the sidebar immediately.
2. Currency EUR shows amounts as €.
3. The Light theme recolors the whole app, including the charts, and persists after reload.
4. "Reset to sample data" restores the demo.
5. "Clear my data" sends you to `/setup` (the stub for now).

```bash
git add src
git commit -m "feat: add settings page"
```

---

### Task 20: Welcome carousel and setup wizard

**Files:**
- Create: `src/onboarding/WelcomeCarousel.tsx`, `src/onboarding/Welcome.module.css`, `src/onboarding/SetupWizard.tsx`, `src/onboarding/Setup.module.css`
- Modify: `src/App.tsx` (routes `/welcome` and `/setup`; delete `Stub`)

**Interfaces:**
- Consumes: `useAuth` (`user`, `demoLogin`), `storage.setWelcomeSeen`, `DonutChart`, `CategoryTotal`, `createSeedData`, `validateAccount`, `parseAmount`, `isValid`, `newId`, `AVATARS`, `CURRENCIES`, `ACCOUNT_COLORS`, `KIND_LABEL`
- Produces: `/welcome` works logged in or out. `/setup` finishes with `setupDone: true` and goes to `/`, where the tour (Task 21) starts.

- [ ] **Step 1: Write `src/onboarding/Welcome.module.css`**

```css
.page {
  position: relative; overflow: hidden; min-height: 100dvh;
  display: flex; flex-direction: column; background: var(--grad-hero); color: #fff;
}
.page::before, .page::after {
  content: ''; position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.4; pointer-events: none;
}
.page::before { width: 320px; height: 320px; left: -100px; top: 20%; background: var(--lime); }
.page::after { width: 280px; height: 280px; right: -80px; bottom: 10%; background: var(--cyan); }
.top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; }
.logo { display: flex; align-items: center; gap: 8px; font: 700 22px var(--font-display); }
.top :global(.btn-ghost) { color: rgba(255, 255, 255, 0.85); }
.viewport { position: relative; z-index: 1; flex: 1; overflow: hidden; touch-action: pan-y; }
.track { display: flex; height: 100%; transition: transform 300ms var(--ease); }
.slide {
  flex: 0 0 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
  padding: 24px; text-align: center;
}
.art {
  display: grid; place-items: center; width: 240px; height: 240px; border-radius: 40px;
  background: rgba(14, 14, 26, 0.35); backdrop-filter: blur(8px); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}
.art :global(.donut-center) { color: #fff; }
.bigEmoji { font-size: 110px; animation: float 3s ease-in-out infinite; }
.title { font-size: clamp(32px, 7vw, 56px); max-width: 14ch; }
.text { max-width: 36ch; font-size: 17px; opacity: 0.9; }
.dots { position: relative; z-index: 1; display: flex; justify-content: center; gap: 8px; padding: 8px; }
.dot { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 999px; background: rgba(255, 255, 255, 0.4); cursor: pointer; transition: width 200ms; }
.dot[aria-selected='true'] { width: 28px; background: #fff; }
.actions {
  position: relative; z-index: 1; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;
  padding: 16px 24px calc(32px + env(safe-area-inset-bottom));
}
.actions :global(.btn) { min-width: 160px; }
.actions :global(.btn-primary) { background: #fff; color: #0e0e1a; }
.actions :global(.btn-secondary) { background: rgba(255, 255, 255, 0.2); color: #fff; }
@keyframes float { 50% { transform: translateY(-10px); } }
```

- [ ] **Step 2: Write `src/onboarding/WelcomeCarousel.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DonutChart from '../charts/DonutChart';
import Icon from '../components/Icon';
import { storage } from '../data/storage';
import type { CategoryTotal } from '../lib/finance';
import { useAuth } from '../state/AuthContext';
import s from './Welcome.module.css';

const SLIDES = [
  { emoji: '💸', title: 'Track every coin', text: 'Log payments, expenses and income in seconds. All your money in one place.' },
  { emoji: '📊', title: 'See where it goes', text: 'Live charts show exactly where your money flows, every month.', chart: true },
  { emoji: '⏰', title: 'Never miss a bill', text: 'Upcoming, paid and overdue bills, sorted and color-coded.' },
  { emoji: '🎯', title: 'Crush your goals', text: 'Saving for a laptop, a trip or a dream? Watch the ring fill up.' },
];

const SAMPLE: CategoryTotal[] = [
  { category: 'food', total: 420 },
  { category: 'shopping', total: 240 },
  { category: 'transport', total: 180 },
  { category: 'entertainment', total: 130 },
];

export default function WelcomeCarousel() {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);
  const last = i === SLIDES.length - 1;
  const go = (n: number) => setI(Math.max(0, Math.min(SLIDES.length - 1, n)));

  useEffect(() => { storage.setWelcomeSeen(true); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI(v => Math.min(SLIDES.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function tryDemo() {
    await demoLogin();
    navigate('/');
  }

  return (
    <div className={s.page}>
      <header className={s.top}>
        <div className={s.logo}><Icon name="pulse" size={24} /> Pulse</div>
        <button className="btn btn-ghost" onClick={() => navigate(user ? '/' : '/login')}>Skip</button>
      </header>

      <div
        className={s.viewport}
        onPointerDown={e => { startX.current = e.clientX; }}
        onPointerUp={e => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (dx < -50) go(i + 1);
          if (dx > 50) go(i - 1);
        }}
      >
        <div className={s.track} style={{ transform: `translateX(-${i * 100}%)` }}>
          {SLIDES.map((slide, idx) => (
            <section key={slide.title} className={s.slide} aria-hidden={idx !== i} aria-roledescription="slide" aria-label={`${idx + 1} of ${SLIDES.length}`}>
              <div className={s.art}>
                {slide.chart && idx === i
                  ? <DonutChart data={SAMPLE} currency="USD" size={200} legend={false} />
                  : <span className={s.bigEmoji} aria-hidden="true">{slide.emoji}</span>}
              </div>
              <h1 className={s.title}>{slide.title} {slide.emoji}</h1>
              <p className={s.text}>{slide.text}</p>
            </section>
          ))}
        </div>
      </div>

      <div className={s.dots} role="tablist" aria-label="Slides">
        {SLIDES.map((sl, idx) => (
          <button key={sl.title} role="tab" aria-selected={idx === i} aria-label={`Slide ${idx + 1}`} className={s.dot} onClick={() => go(idx)} />
        ))}
      </div>

      <footer className={s.actions}>
        {!user && <button className="btn btn-secondary" onClick={tryDemo}>✨ Try demo</button>}
        {last
          ? <button className="btn btn-primary" onClick={() => navigate(user ? '/' : '/register')}>{user ? "Let's go 🚀" : 'Create account'}</button>
          : <button className="btn btn-primary" onClick={() => go(i + 1)}>Next</button>}
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/onboarding/Setup.module.css`**

```css
.page { min-height: 100dvh; display: grid; place-items: center; padding: 24px 16px; }
.box { width: 100%; max-width: 520px; display: flex; flex-direction: column; gap: 24px; }
.progress { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.progress span { height: 6px; border-radius: 999px; background: var(--surface-2); transition: background 300ms; }
.progress .on { background: var(--grad-hero); }
.stepLabel { font-size: 13px; color: var(--text-muted); }
.title { font-size: clamp(26px, 5vw, 36px); }
.avatars { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.avatars button { aspect-ratio: 1; border: 2px solid transparent; border-radius: 14px; background: var(--surface-2); font-size: 26px; cursor: pointer; }
.avatars button[aria-pressed='true'] { border-color: var(--violet); }
.currencies { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; }
.choice {
  padding: 16px; border: 2px solid var(--border); border-radius: var(--radius-btn);
  background: var(--surface); color: var(--text); font: 600 16px var(--font-body); text-align: left; cursor: pointer;
}
.choice[aria-pressed='true'] { border-color: var(--violet); background: color-mix(in srgb, var(--violet) 12%, var(--surface)); }
.choice small { display: block; margin-top: 4px; color: var(--text-muted); font-weight: 400; }
.modes { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; }
.accountRow { display: grid; gap: 8px; grid-template-columns: 1.4fr 1fr 1fr auto; align-items: end; }
.actions { display: flex; justify-content: space-between; gap: 12px; }
@media (max-width: 520px) {
  .accountRow { grid-template-columns: 1fr 1fr; }
  .modes { grid-template-columns: 1fr; }
}
```

- [ ] **Step 4: Write `src/onboarding/SetupWizard.tsx`**

```tsx
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { AccountKind, Currency } from '../types';
import Field from '../components/Field';
import Icon from '../components/Icon';
import { createSeedData } from '../data/seed';
import { ACCOUNT_COLORS, AVATARS, CURRENCIES, KIND_LABEL } from '../lib/categories';
import { isValid, parseAmount, validateAccount } from '../lib/validation';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import s from './Setup.module.css';

interface Draft { name: string; kind: AccountKind; opening: string }

const STEPS = ['About you', 'Currency', 'Accounts'];

export default function SetupWizard() {
  const { data, dispatch } = useFinance();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(data.profile.nickname);
  const [avatar, setAvatar] = useState(data.profile.avatar);
  const [currency, setCurrency] = useState<Currency>(data.profile.currency);
  const [mode, setMode] = useState<'fresh' | 'sample'>('fresh');
  const [drafts, setDrafts] = useState<Draft[]>([{ name: 'Checking', kind: 'checking', opening: '' }]);
  const [error, setError] = useState('');

  if (data.onboarding.setupDone) return <Navigate to="/" replace />;

  const updateDraft = (idx: number, patch: Partial<Draft>) => setDrafts(ds => ds.map((d, j) => (j === idx ? { ...d, ...patch } : d)));

  function finish() {
    const profile = { ...data.profile, nickname: nickname.trim(), avatar, currency };
    if (mode === 'sample') {
      dispatch({ type: 'replaceAll', data: createSeedData(new Date(), profile) });
      navigate('/');
      return;
    }
    for (const [idx, d] of drafts.entries()) {
      const errs = validateAccount({ name: d.name, kind: d.kind, openingBalance: d.opening, color: '' });
      if (!isValid(errs)) {
        setError(`Account ${idx + 1}: ${Object.values(errs)[0]}`);
        return;
      }
    }
    dispatch({ type: 'setProfile', profile });
    drafts.forEach((d, idx) => dispatch({
      type: 'addAccount',
      account: { id: newId(), name: d.name.trim(), kind: d.kind, openingBalance: parseAmount(d.opening || '0', true)!, color: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] },
    }));
    dispatch({ type: 'setOnboarding', onboarding: { setupDone: true } });
    navigate('/');
  }

  function next() {
    setError('');
    if (step === 0 && !nickname.trim()) {
      setError('Pick a nickname so we know what to call you');
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  }

  return (
    <div className={s.page}>
      <div className={`card ${s.box}`}>
        <div>
          <div className={s.progress} aria-hidden="true">{STEPS.map((_, i) => <span key={i} className={i <= step ? s.on : ''} />)}</div>
          <p className={s.stepLabel}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>

        {step === 0 && (
          <>
            <h1 className={s.title}>First, what should we call you? 😎</h1>
            <Field label="Nickname"><input autoFocus maxLength={20} value={nickname} onChange={e => setNickname(e.target.value)} /></Field>
            <div className="field">
              <span className="field-label">Pick an avatar</span>
              <div className={s.avatars} role="group" aria-label="Avatar">
                {AVATARS.map(a => <button key={a} type="button" aria-pressed={avatar === a} onClick={() => setAvatar(a)}>{a}</button>)}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className={s.title}>Which currency do you use? 💱</h1>
            <div className={s.currencies} role="group" aria-label="Currency">
              {CURRENCIES.map(c => <button key={c} type="button" className={s.choice} aria-pressed={currency === c} onClick={() => setCurrency(c)}>{c}</button>)}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className={s.title}>Where does your money live? 🏦</h1>
            <div className={s.modes} role="group" aria-label="Start with">
              <button type="button" className={s.choice} aria-pressed={mode === 'fresh'} onClick={() => setMode('fresh')}>
                ✨ Start fresh<small>Add your own accounts</small>
              </button>
              <button type="button" className={s.choice} aria-pressed={mode === 'sample'} onClick={() => setMode('sample')}>
                🎲 Load sample data<small>6 months of demo activity</small>
              </button>
            </div>
            {mode === 'fresh' && (
              <div className="stack">
                {drafts.map((d, idx) => (
                  <div key={idx} className={s.accountRow}>
                    <Field label="Name"><input maxLength={30} value={d.name} onChange={e => updateDraft(idx, { name: e.target.value })} /></Field>
                    <Field label="Type">
                      <select value={d.kind} onChange={e => updateDraft(idx, { kind: e.target.value as AccountKind })}>
                        {(Object.keys(KIND_LABEL) as AccountKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                      </select>
                    </Field>
                    <Field label="Balance"><input inputMode="decimal" placeholder="0.00" value={d.opening} onChange={e => updateDraft(idx, { opening: e.target.value })} /></Field>
                    <button type="button" className="icon-btn" aria-label={`Remove account ${idx + 1}`} disabled={drafts.length === 1}
                      onClick={() => setDrafts(ds => ds.filter((_, j) => j !== idx))}><Icon name="trash" size={18} /></button>
                  </div>
                ))}
                {drafts.length < 3 && (
                  <button type="button" className="btn btn-secondary" onClick={() => setDrafts(ds => [...ds, { name: '', kind: 'savings', opening: '' }])}>
                    <Icon name="plus" /> Add another account
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className={s.actions}>
          <button type="button" className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
          <button type="button" className="btn btn-primary btn-glow" onClick={next}>{step === STEPS.length - 1 ? "Let's go 🚀" : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Route both screens and remove the stub**

In `src/App.tsx`:
- Replace `<Route path="/welcome" element={<Stub name="Welcome" />} />` with `<Route path="/welcome" element={<WelcomeCarousel />} />`. It stays **outside** `PublicOnly` so logged-in users can replay it.
- Replace the `/setup` stub with `<Route path="/setup" element={<SetupWizard />} />`.
- Delete the `Stub` component and the now-unused `useAuth` import. Add imports for `WelcomeCarousel` and `SetupWizard`.

- [ ] **Step 6: Verify the first-run flow**

Run: `npm run build`, then `npm run dev`. In DevTools, clear the site's localStorage and reload `/`.

Check by hand:
1. It redirects to `/welcome`. Swipe (touch emulation), arrow keys and dots all change slides. Slide 2's donut sweeps in.
2. "Create account" leads to Register, which leads to the Setup wizard. An empty nickname is blocked.
3. Choose EUR, keep one account "Checking" with balance `500`, and finish. The dashboard shows €500.00.
4. Log out and visit `/`: you land on `/login` now, because the welcome was already seen.
5. Settings → "Replay intro" opens the carousel with "Let's go 🚀" and no "Try demo".
6. On a fresh profile, "Try demo" on slide 1 goes straight to the populated dashboard.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: add welcome carousel and setup wizard"
```

---

### Task 21: Guided tour

**Files:**
- Create: `src/onboarding/placement.ts`, `src/onboarding/tourSteps.ts`, `src/onboarding/GuidedTour.tsx`, `src/onboarding/Tour.module.css`
- Test: `src/onboarding/placement.test.ts`
- Modify: `src/components/layout/AppLayout.tsx` (render `<GuidedTour />`)

**Interfaces:**
- Consumes: `useFinance` (`data.onboarding.tourDone`, `dispatch`), `data-tour` targets from Tasks 12 and 14, `motionMs`
- Produces:
  - `interface Rect { top: number; left: number; width: number; height: number }`
  - `placeBubble(target: Rect, bubble: { width: number; height: number }, viewport: { width: number; height: number }): { top: number; left: number; side: 'below' | 'above' }`
  - `TOUR_STEPS: { target: string; title: string; text: string }[]`

- [ ] **Step 1: Write the failing placement tests**

`src/onboarding/placement.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { placeBubble } from './placement';

const viewport = { width: 1000, height: 800 };
const bubble = { width: 300, height: 150 };

describe('placeBubble', () => {
  it('goes below and centered when there is room', () => {
    expect(placeBubble({ top: 100, left: 400, width: 200, height: 50 }, bubble, viewport)).toEqual({ top: 166, left: 350, side: 'below' });
  });

  it('flips above a target near the bottom of the screen', () => {
    const p = placeBubble({ top: 700, left: 400, width: 200, height: 60 }, bubble, viewport);
    expect(p.side).toBe('above');
    expect(p.top).toBe(700 - 16 - 150);
  });

  it('clamps horizontally inside the viewport', () => {
    expect(placeBubble({ top: 100, left: 950, width: 40, height: 40 }, bubble, viewport).left).toBe(1000 - 300 - 12);
    expect(placeBubble({ top: 100, left: 0, width: 40, height: 40 }, bubble, viewport).left).toBe(12);
  });

  it('stays on screen for a target taller than the viewport', () => {
    const p = placeBubble({ top: 0, left: 0, width: 1000, height: 900 }, bubble, viewport);
    expect(p.top).toBe(800 - 150 - 12);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/onboarding/placement.test.ts`
Expected: FAIL, because it cannot resolve `./placement`.

- [ ] **Step 3: Implement `src/onboarding/placement.ts` and `tourSteps.ts`**

`src/onboarding/placement.ts`:
```ts
export interface Rect { top: number; left: number; width: number; height: number }

const GAP = 16;
const MARGIN = 12;

/** Positions the tour bubble below the target (or above if it won't fit), clamped inside the viewport. */
export function placeBubble(
  target: Rect,
  bubble: { width: number; height: number },
  viewport: { width: number; height: number },
): { top: number; left: number; side: 'below' | 'above' } {
  const below = target.top + target.height + GAP;
  const above = target.top - GAP - bubble.height;
  const fitsBelow = below + bubble.height <= viewport.height - MARGIN;
  const side = fitsBelow || above < MARGIN ? 'below' : 'above';
  const rawTop = side === 'below' ? below : above;
  const top = Math.min(Math.max(rawTop, MARGIN), Math.max(MARGIN, viewport.height - bubble.height - MARGIN));
  const centered = target.left + target.width / 2 - bubble.width / 2;
  const left = Math.min(Math.max(centered, MARGIN), Math.max(MARGIN, viewport.width - bubble.width - MARGIN));
  return { top, left, side };
}
```

`src/onboarding/tourSteps.ts`:
```ts
export const TOUR_STEPS = [
  { target: 'balance', title: 'Your total balance 💸', text: 'Everything across your accounts, updated the second you add something.' },
  { target: 'charts', title: 'See where it goes 📊', text: 'Hover or tap the chart for daily balances. Switch between 7, 30 and 90 days.' },
  { target: 'quick-add', title: 'Add in two taps ➕', text: 'Log an expense or income from anywhere in the app.' },
  { target: 'nav', title: 'Jump around 🧭', text: 'Transactions, accounts, bills and goals are all one tap away.' },
  { target: 'profile', title: 'Make it yours 😎', text: 'Change your avatar, currency or theme, or replay this intro anytime.' },
];
```

- [ ] **Step 4: Run the placement tests to verify they pass**

Run: `npm test -- src/onboarding/placement.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write `src/onboarding/Tour.module.css`**

```css
.overlay { position: fixed; inset: 0; z-index: 200; }
.spotlight {
  position: fixed; border-radius: 20px; pointer-events: none;
  box-shadow: 0 0 0 9999px var(--overlay), 0 0 0 3px var(--violet);
  transition: top 300ms var(--ease), left 300ms var(--ease), width 300ms var(--ease), height 300ms var(--ease);
}
.bubble {
  position: fixed; width: min(320px, calc(100vw - 24px));
  display: flex; flex-direction: column; gap: 10px;
  padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-card);
  background: var(--surface); box-shadow: var(--glow); animation: pop 220ms var(--ease);
}
.count { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: var(--violet); }
.title { font-size: 20px; }
.actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; }
```

- [ ] **Step 6: Write `src/onboarding/GuidedTour.tsx`**

```tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motionMs } from '../lib/motion';
import { useFinance } from '../state/FinanceContext';
import { placeBubble, type Rect } from './placement';
import { TOUR_STEPS } from './tourSteps';
import s from './Tour.module.css';

type Step = (typeof TOUR_STEPS)[number];

/** First visible element with the given data-tour name (sidebar vs bottom nav depends on viewport). */
function findTarget(name: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

export default function GuidedTour() {
  const { data, dispatch } = useFinance();
  const { pathname } = useLocation();
  const active = !data.onboarding.tourDone && pathname === '/';
  const [steps, setSteps] = useState<Step[]>([]);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleSize, setBubbleSize] = useState({ width: 320, height: 180 });
  const step = active ? steps[i] : undefined;

  // Wait for the dashboard (and its charts) to paint, then keep only steps whose target is visible.
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      setSteps(TOUR_STEPS.filter(st => findTarget(st.target)));
      setI(0);
    }, 400);
    return () => window.clearTimeout(t);
  }, [active]);

  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: motionMs() ? 'smooth' : 'auto' });
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    const settle = window.setTimeout(update, 350);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step]);

  useLayoutEffect(() => {
    const b = bubbleRef.current?.getBoundingClientRect();
    if (b) setBubbleSize({ width: b.width, height: b.height });
  }, [i, rect]);

  const finish = useCallback(() => {
    dispatch({ type: 'setOnboarding', onboarding: { tourDone: true } });
    setSteps([]);
  }, [dispatch]);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, finish]);

  if (!step || !rect) return null;

  const pos = placeBubble(rect, bubbleSize, { width: window.innerWidth, height: window.innerHeight });
  const last = i === steps.length - 1;

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className={s.spotlight} style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }} />
      <div ref={bubbleRef} className={s.bubble} style={{ top: pos.top, left: pos.left }}>
        <p className={s.count}>{i + 1} / {steps.length}</p>
        <h2 id="tour-title" className={s.title}>{step.title}</h2>
        <p className="muted">{step.text}</p>
        <div className={s.actions}>
          <button className="btn btn-ghost btn-sm" onClick={finish}>Skip</button>
          <div className="row">
            {i > 0 && <button className="btn btn-secondary btn-sm" onClick={() => setI(i - 1)}>Back</button>}
            <button className="btn btn-primary btn-sm" autoFocus onClick={() => (last ? finish() : setI(i + 1))}>{last ? "Let's go 🚀" : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Mount it in the layout**

In `src/components/layout/AppLayout.tsx`, add `import GuidedTour from '../../onboarding/GuidedTour';` and render `<GuidedTour />` as the last child of the `.shell` div.

- [ ] **Step 8: Verify and commit**

Run: `npm test && npm run build`, then check in `npm run dev`:
1. Clear localStorage, then Try demo. The tour starts on the dashboard: balance, then chart, then "+ Add transaction", then sidebar nav, then profile. The spotlight moves smoothly and the bubble never leaves the screen.
2. At 375px, the steps target the FAB, bottom nav and top-bar avatar instead.
3. Esc or Skip ends it. Reloading doesn't show it again.
4. Settings → Replay intro → "Let's go 🚀" shows the tour again.

```bash
git add src
git commit -m "feat: add guided dashboard tour"
```

---

### Task 22: Deploy config, README, final verification

**Files:**
- Create: `vercel.json`, `README.md`, `docs/screenshots/` (PNG screenshots)

**Interfaces:**
- Consumes: the whole app
- Produces: a production build that deploys as a static SPA, and a portfolio README.

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Vercel serves real files (`/assets/*`) before rewrites, so only client routes such as `/transactions?range=7d` fall through to `index.html`.

- [ ] **Step 2: Capture screenshots**

With `npm run dev` and the demo account, capture these into `docs/screenshots/`:
- `dashboard-desktop.png` (1440×900)
- `dashboard-mobile.png` (390×844)
- `transactions-desktop.png` (with a filter applied)
- `welcome-mobile.png` (slide 2 with the donut)

Use the browser's device toolbar and "Capture screenshot", or the `claude-in-chrome` skill if available.

- [ ] **Step 3: Write `README.md`**

```markdown
# Pulse 💸 money, finally readable

A playful personal-finance simulator for Gen Z. Track payments, expenses and account balances, then see where your money goes with interactive D3 charts.

**Live demo:** <VERCEL_URL> → click **✨ Try demo** for six months of sample data.

![Dashboard](docs/screenshots/dashboard-desktop.png)

<p align="center"><img src="docs/screenshots/dashboard-mobile.png" width="260" alt="Mobile dashboard"> <img src="docs/screenshots/welcome-mobile.png" width="260" alt="Welcome carousel"></p>

## Features
- **Onboarding:** a swipeable welcome carousel, a 3-step setup wizard and a spotlight guided tour.
- **Auth (simulated):** register and log in with salted SHA-256 hashes in localStorage, plus a one-click demo.
- **Dashboard:** KPI tiles, "you spent 12% less on food 🔥" insights, and a balance line chart, income vs expenses bars and a category donut, all built with D3.
- **Transactions:** a sortable, paginated table with search, date presets, type, category, account and amount filters. Filters live in the URL, so views are shareable, and the filtered rows export to CSV.
- **Accounts:** per-account balances with sparklines, plus transfers between accounts.
- **Payments:** recurring bills with paid, upcoming and overdue status and one-tap "mark as paid".
- **Goals:** savings goals with animated progress rings.
- **Settings:** avatar, currency, dark and light themes, replay intro, reset or clear data.
- Responsive from 360px to widescreen, with reduced-motion support and keyboard-friendly dialogs.

## Stack & why
| | |
|---|---|
| React 19 + TypeScript + Vite | fast dev loop, typed domain model |
| D3 v7 | every chart is hand-built: React owns the `<svg>`, D3 draws scales, shapes and transitions in `useEffect` |
| Plain CSS (tokens + CSS Modules) | no CSS framework, so the design system is fully custom |
| react-router | routes, guards and URL-synced filters |
| Vitest | unit tests for all business logic |

Only four runtime dependencies: `react`, `react-dom`, `react-router-dom`, `d3`.

## Architecture
- `src/lib`, `src/data` and `src/state/financeReducer.ts` hold **pure, unit-tested logic**: balances, series, insights, filters, CSV, validation, seed data and the reducer.
- `src/state` holds React contexts: auth, and a per-user `useReducer` store saved to localStorage.
- `src/charts` holds D3 components. Each redraws on data or size change via a `ResizeObserver` hook.

## Run it
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests
npm run build    # type-check + production build
```

## Heads-up
Pulse is a **simulation**. There is no backend and data never leaves your browser. Password hashing is for realism, not security, so don't reuse a real password.
```

- [ ] **Step 4: Full verification**

Run: `npm test && npm run build`
Expected: all tests pass. The build finishes with no type errors, and the output lists `dist/index.html` and assets.

Run `npm run preview` and walk the complete story at 375px, 768px and 1280px:
1. Fresh visit → welcome → register → setup (start fresh) → tour → add income and expenses → the charts and KPIs update.
2. Log out → demo → filter transactions, reload, and the filters are kept → export CSV.
3. Pay an overdue bill → fund a goal to 100% → switch to light theme → replay intro.
4. There is no horizontal scroll at any width and no console errors.

Record any failure and fix it with superpowers:systematic-debugging before continuing.

- [ ] **Step 5: Commit**

```bash
git add vercel.json README.md docs/screenshots
git commit -m "docs: add README, screenshots and Vercel SPA config"
```

- [ ] **Step 6: Deploy (with the user)**

Deploying publishes the app publicly, so **ask the user first**. Once they approve, either:
- Install the CLI (`npm i -g vercel`), then run `vercel` for a preview and `vercel --prod` for production.
- Or push to GitHub and import the repo in the Vercel dashboard. The framework preset is Vite, the build command is `npm run build` and the output directory is `dist`.

Then replace `<VERCEL_URL>` in `README.md` with the production URL and commit `docs: add live demo link`.

