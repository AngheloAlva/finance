# Plan 007: Surface the accumulated (all-time) balance on the dashboard

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/features/analytics/lib/projection.queries.ts src/features/dashboard "src/app/[locale]/(dashboard)/page.tsx" src/i18n/messages`
> On mismatch with the excerpts below, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/000-restore-typecheck-baseline.md
- **Category**: direction
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

The owner's complaint: "the monetary summary is monthly-only; I can never see my accumulated value." The number already exists — the cashflow projection computes an all-time balance (all INCOME minus EXPENSE with `impactDate <= today`) — but it's buried on `/analytics` labeled "Starting Balance", and computing it today requires running the entire 90-day projection. Meanwhile the dashboard card labeled "Balance" is actually the selected month's net, a naming collision that actively misleads. This plan extracts the aggregate into its own query, ships it as a first-class dashboard widget, and renames the monthly figure.

## Current state

- The aggregate to extract — `src/features/analytics/lib/projection.queries.ts:57-83` (inside `getDailyProjection`):

```ts
const today = startOfDay(new Date());
// ...
const [incomeAgg, expenseAgg] = await Promise.all([
  prisma.transaction.aggregate({
    where: { userId, isTemplate: false, type: TransactionType.INCOME, impactDate: { lte: today } },
    _sum: { amount: true },
  }),
  prisma.transaction.aggregate({
    where: { userId, isTemplate: false, type: TransactionType.EXPENSE, impactDate: { lte: today } },
    _sum: { amount: true },
  }),
]);

const startingBalance =
  (incomeAgg._sum.amount ?? 0) - Math.abs(expenseAgg._sum.amount ?? 0);
```

`startOfDay` is defined near the top of the same file. Tests pinning these semantics: `src/features/analytics/lib/projection.queries.test.ts` (search `startingBalance`).

- Monthly overview (what the misnamed card shows) — `src/features/dashboard/lib/dashboard.queries.ts:21-51` (`getMonthlyOverview`, returns `{ totalIncome, totalExpenses, balance, transactionCount }` for one month by `impactDate` range).
- The card — `src/features/dashboard/components/overview-cards.tsx:47-56`: `<StatCard title={t("balance")} value={formatCurrency(overview.balance, …)} icon={Wallet} …/>`. `StatCard` is `src/features/dashboard/components/stat-card.tsx` (title + preformatted string + icon).
- Widget plumbing (all three must be updated together):
  - `src/features/dashboard/lib/dashboard.schema.ts:15-26` — `WIDGET_KEYS` const array; `:47-60` — `DEFAULT_DASHBOARD_CONFIG`; `mergeDashboardConfig` (`:70-94`) auto-appends new default widgets to existing users' stored configs, so adding a key is backwards-compatible.
  - `src/features/dashboard/components/widget-registry.ts:26-77` — `WIDGET_REGISTRY` metadata (`supportsHalf`, `defaultSize`).
  - `src/app/[locale]/(dashboard)/page.tsx` — `needs(key)` gating (`:104-115`, the conditional `Promise.all`) and the `renderWidget` switch (`:139-176`).
- i18n: `dashboard.balance` is `"Balance"` in `en.json`; widget names live under `dashboard.widgets.<key>.name/.description` (both `en.json` and `es.json`).
- The analytics consumer that must keep working: `src/app/[locale]/(dashboard)/analytics/page.tsx:70` calls `getDailyProjection(userId, 90)`; `startingBalance` is part of `ProjectionResult` (`src/features/analytics/types/analytics.types.ts`, search `startingBalance`) and rendered by `src/features/analytics/components/projection-summary-cards.tsx`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Projection tests | `pnpm test -- src/features/analytics/lib/projection.queries.test.ts` | all pass (DB-backed; needs `.env`) |
| Dashboard tests | `pnpm test -- src/features/dashboard` | all pass |
| Lint      | `pnpm lint`              | exit 0              |

## Scope

**In scope**:
- `src/features/analytics/lib/projection.queries.ts` (extract + export)
- `src/features/analytics/lib/projection.queries.test.ts` (new tests for the extracted function)
- `src/features/dashboard/lib/dashboard.schema.ts`, `src/features/dashboard/components/widget-registry.ts`
- `src/features/dashboard/components/accumulated-balance-card.tsx` (create)
- `src/features/dashboard/components/overview-cards.tsx` (rename label usage only if you change the key)
- `src/app/[locale]/(dashboard)/page.tsx`
- `src/i18n/messages/en.json`, `src/i18n/messages/es.json`
- `src/features/dashboard/types/dashboard.types.ts` (if a type is needed)

**Out of scope**:
- `getDailyProjection`'s public result shape — `startingBalance` stays in `ProjectionResult`; analytics keeps working unchanged.
- The net-worth timeline and its liability bug (separate finding, see README).
- Widget customizer UI — `mergeDashboardConfig` handles the new key automatically.

## Git workflow

- Branch: `advisor/007-accumulated-balance-widget`
- Conventional commits, e.g. `feat(dashboard): accumulated balance widget backed by extracted query`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extract `getAccumulatedBalance`

In `projection.queries.ts`, extract the two aggregates + subtraction into an exported function, and call it from `getDailyProjection`:

```ts
/**
 * All-time cash balance: sum of INCOME minus abs(EXPENSE) across every
 * non-template transaction with impactDate <= asOf. This is the same number
 * the cashflow projection uses as its starting balance.
 */
export async function getAccumulatedBalance(
  userId: string,
  asOf: Date = startOfDay(new Date()),
): Promise<number> { /* the two aggregates verbatim */ }
```

Inside `getDailyProjection`, replace the inline block with `const startingBalance = await getAccumulatedBalance(userId, today);` — semantics identical (`today` is already `startOfDay`).

**Verify**: `pnpm test -- src/features/analytics/lib/projection.queries.test.ts` → all existing tests pass unchanged (they pin `startingBalance` values; if any fails, you changed semantics — STOP).

### Step 2: Tests for the extracted function

In `projection.queries.test.ts`, add a small describe for `getAccumulatedBalance`, modeled on the file's existing setup (it seeds transactions against the test DB): income minus expense up to `asOf`; a transaction with `impactDate` AFTER `asOf` is excluded; empty user → 0.

**Verify**: `pnpm test -- src/features/analytics/lib/projection.queries.test.ts` → all pass including new ones.

### Step 3: Register the widget

1. `dashboard.schema.ts`: add `"accumulatedBalance"` to `WIDGET_KEYS`; add `{ key: "accumulatedBalance", visible: true, position: 1, size: "full" }` to `DEFAULT_DASHBOARD_CONFIG` — insert right after `overview` and renumber the subsequent default positions to stay contiguous.
2. `widget-registry.ts`: add metadata `{ key: "accumulatedBalance", supportsHalf: true, defaultSize: "full" }`.
3. i18n both files: `dashboard.widgets.accumulatedBalance.name` (en "Total Balance" / es "Balance Total") and `.description` (en "Your all-time accumulated balance up to today" / es "Tu balance acumulado histórico hasta hoy").

**Verify**: `pnpm test -- src/features/dashboard` → the schema/merge tests pass (they cover key-append behavior).

### Step 4: The card + page wiring

Create `src/features/dashboard/components/accumulated-balance-card.tsx` — a small server-compatible presentational component (no `"use client"` needed if it only renders; follow `overview-cards.tsx` which IS client for `useTranslations` — match that pattern: client component taking `{ balanceCents, currency }`, using `StatCard` with a `Landmark`/`PiggyBank`-style lucide icon and green/red tint by sign, exactly like the balance card in `overview-cards.tsx:47-56`).

In `page.tsx`: add to the conditional `Promise.all` — `needs("accumulatedBalance") ? getAccumulatedBalance(session.user.id) : null` (import from `@/features/analytics/lib/projection.queries`); add the `case "accumulatedBalance":` branch in `renderWidget` rendering the new card. Note the value is **independent of the selected month** — that's the point; the card description/i18n says "up to today".

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Manual: dashboard shows the new "Total Balance" card; navigating months changes the monthly cards but NOT this one; toggling it off in Customize hides it.

### Step 5: Rename the monthly "Balance" label

In both message files change `dashboard.balance` from "Balance"/"Balance" to en `"Monthly Net"` / es `"Neto del mes"`. No code change — `overview-cards.tsx` reads `t("balance")`.

**Verify**: dashboard's monthly card now reads "Monthly Net" (en) / "Neto del mes" (es); `rg -n '"balance": "Balance"' src/i18n/messages` → no match.

## Test plan

- New DB-backed tests (step 2) for `getAccumulatedBalance`: 3 cases listed there, modeled on the existing tests in the same file.
- Existing projection tests double as the no-semantic-change regression net for the extraction.
- Manual: month-navigation invariance of the new card; customizer toggle; existing-user config auto-migration (log in with the seeded user whose `dashboardConfig` predates the key — the widget appears appended).

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0; `pnpm lint` exits 0
- [ ] `pnpm test -- src/features/analytics/lib/projection.queries.test.ts src/features/dashboard` exits 0, including the new tests
- [ ] `rg -n "getAccumulatedBalance" src/` shows the export, the projection call site, and the page call site
- [ ] Manual gates from steps 4-5 reported
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Existing projection tests fail after step 1 — the extraction changed semantics.
- `mergeDashboardConfig` does NOT append the new key for stored configs (widget missing for the seeded user) — schema assumptions broke; report.
- The i18n files lack the `dashboard.widgets` structure described (drift).

## Maintenance notes

- "Balance" now means exactly one thing per surface: Monthly Net (dashboard month card), Total Balance (this widget), Starting Balance (projection input on analytics — same number as Total Balance, computed by the same function). A future cleanup could relabel analytics' card to match "Total Balance".
- If transfers ever affect cash balance (TRANSFER type is currently excluded from both aggregates), `getAccumulatedBalance` is the single place to amend.
- Perf: the widget adds two indexed aggregates (`@@index([userId, impactDate])` exists) — cheap; do NOT be tempted to reuse `getDailyProjection` for this card.
