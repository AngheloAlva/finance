# Plan 001: Eliminate every NaN path in money/percentage rendering

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/features/analytics src/features/goals/lib src/features/investments/lib src/features/alerts/lib/alert-generation.ts src/features/transactions/components/quick-add-form.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/000-restore-typecheck-baseline.md (the `tsc --noEmit` gate is broken until 000 lands)
- **Category**: bug
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

The app owner has seen literal "NaN" rendered in the UI. The root cause is confirmed: when a user's expenses exceed income over the last 3 months (savings rate < 0), the Financial Health score interpolates against a `-Infinity` threshold, producing `Infinity / Infinity = NaN`, which renders as "NaN" in the dashboard's headline gauge — exactly for the users who most need the number. Four sibling unguarded computations can produce the same class of bug ("$NaN", "NaN%") in chart tooltips, goal progress, investment returns, and the receipt-scan amount. This plan closes all of them with small guards plus regression tests.

## Current state

All amounts in this codebase are integer **cents**. Formatting goes through `src/shared/lib/formatters.ts` (`formatCurrency(cents, currency, locale)` divides by 100 and runs `Intl.NumberFormat`; `Intl` renders `NaN` as the string `"$NaN"`).

### Bug A — Financial Health score becomes NaN (the confirmed, user-visible one)

- `src/features/analytics/lib/analytics.utils.ts:8-29` — the interpolation helper:

```ts
export function computeHealthSubScore(
  value: number,
  thresholds: ScoreThreshold[],
): number {
  // Thresholds must be sorted descending by threshold
  const sorted = [...thresholds].sort((a, b) => b.threshold - a.threshold);

  for (let i = 0; i < sorted.length; i++) {
    if (value >= sorted[i].threshold) {
      // If first threshold, return its score
      if (i === 0) return sorted[i].score;

      // Linear interpolation between this and the previous threshold
      const upper = sorted[i - 1];
      const lower = sorted[i];
      const ratio = (value - lower.threshold) / (upper.threshold - lower.threshold);
      return lower.score + ratio * (upper.score - lower.score);
    }
  }

  return sorted[sorted.length - 1].score;
}
```

- `src/features/analytics/lib/analytics.queries.ts:583-590` — the only threshold table containing `-Infinity`:

```ts
const savingsScore = computeHealthSubScore(savingsRate, [
  { threshold: 0.20, score: 100 },
  { threshold: 0.15, score: 80 },
  { threshold: 0.10, score: 60 },
  { threshold: 0.05, score: 40 },
  { threshold: 0, score: 20 },
  { threshold: -Infinity, score: 0 },
]);
```

With `savingsRate = -0.5`: the loop matches at `lower.threshold = -Infinity`, so `ratio = (-0.5 - (-Infinity)) / (0 - (-Infinity)) = Infinity / Infinity = NaN`. The NaN propagates through `Math.round` (`analytics.queries.ts:685`), the weighted `overall` (`:692-694`), falls through every `>=` label comparison to `"Critical"`, and renders as literal "NaN" in `src/features/analytics/components/financial-health-gauge.tsx` (`{score.overall}`, `{factor.score}/100`, and `style={{ width: `${factor.score}%` }}`).

### Bug B — Cash Flow Forecast tooltip renders "$NaN"

- `src/features/analytics/components/cash-flow-forecast-chart.tsx:87-94` — the chart deliberately sets 2 of 4 series to `undefined` per point:

```ts
const chartData = data.map((point) => ({
  ...point,
  actualIncome: point.isProjected ? undefined : point.income,
  actualExpenses: point.isProjected ? undefined : point.expenses,
  projectedIncome: point.isProjected ? point.income : undefined,
  projectedExpenses: point.isProjected ? point.expenses : undefined,
}))
```

- Same file, `:42-46` declares `interface TooltipPayloadItem { name: string; value: number; color: string }` (a lie — `value` can be `undefined` at runtime), and `:74-78` maps **every** payload entry through `formatCurrency(entry.value, ...)` → `undefined / 100 = NaN` → "$NaN" rows on hover.

### Bug C — Goal progress divides by targetAmount with no zero guard

- `src/features/goals/lib/goals.queries.ts:6-14`:

```ts
function computeProgress(
  goal: { targetAmount: number },
  sum: number,
  count: number
): { currentAmount: number; percentage: number; contributionCount: number } {
  const currentAmount = sum
  const percentage = Math.min(Math.round((currentAmount / goal.targetAmount) * 100), 100)
  return { currentAmount, percentage, contributionCount: count }
}
```

`targetAmount === 0` → `NaN` (`Math.min(NaN, 100)` stays `NaN`) → "NaN%" in the goals list and dashboard widget. The create schema forbids 0, so this is legacy/imported-data exposure — still worth the one-line guard.

### Bug D — Annualized investment return returns NaN for negative net value

- `src/features/investments/lib/investments.utils.ts:65-73`:

```ts
const annualizedReturn =
  daysSinceStart > 0 && initialAmount > 0
    ? (Math.pow(netValue / initialAmount, 365 / daysSinceStart) - 1) * 100
    : null

return {
  absoluteReturn,
  percentageReturn: Math.round(percentageReturn * 100) / 100,
  annualizedReturn: annualizedReturn !== null ? Math.round(annualizedReturn * 100) / 100 : null,
}
```

`netValue` (`currentValue - fees`, line 59) can be negative; `Math.pow(negative, fractional)` is `NaN` in JS, and `NaN !== null` is `true`, so the intended `null` fallback never fires.

### Bug E — Credit-card usage alert divides by totalLimit with no guard

- `src/features/alerts/lib/alert-generation.ts` (around line 186; search for `usageRatio`) — `const usageRatio = usedLimit / card.totalLimit` then `Math.round(usageRatio * 100)` interpolated into a persisted alert message. `totalLimit === 0` (legacy/imported rows) → "Infinity% usage", and `0/0` → NaN. Other call sites guard (`credit-card-visual.tsx`, `affordability.compute.ts`); this one doesn't.

### Bug F — Receipt-scan amount is used unguarded

- `src/features/transactions/components/quick-add-form.tsx:97`:

```ts
if (data.amount != null) setDefaultAmount(Math.round(data.amount * 100))
```

`data` is raw JSON from `/api/scan-receipt` (an AI vision model's output). A non-numeric value (e.g. a string that survives `!= null`) produces `NaN` cents, which `AmountInput` (`src/features/transactions/components/amount-input.tsx:26-28`) renders as the literal string "NaN" via `centsToDisplay`.

### Conventions

- Tests: Vitest, colocated `*.test.ts` next to source. Pure-function tests exist at `src/features/analytics/lib/analytics.utils.test.ts` and `src/features/investments/lib/investments.utils.test.ts` — match their structure (plain `describe`/`it`/`expect`, no DB).
- Indentation is tabs in most feature files; match whatever the file you touch uses.
- The full `pnpm test` suite hits a live Neon database and takes minutes — run only the targeted test files listed below.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no output   |
| Targeted tests | `pnpm test -- src/features/analytics/lib/analytics.utils.test.ts src/features/investments/lib/investments.utils.test.ts` | all pass |
| Lint      | `pnpm lint`              | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/features/analytics/lib/analytics.utils.ts`
- `src/features/analytics/lib/analytics.utils.test.ts`
- `src/features/analytics/components/cash-flow-forecast-chart.tsx`
- `src/features/goals/lib/goals.queries.ts`
- `src/features/investments/lib/investments.utils.ts`
- `src/features/investments/lib/investments.utils.test.ts`
- `src/features/alerts/lib/alert-generation.ts`
- `src/features/transactions/components/quick-add-form.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `src/shared/lib/formatters.ts` — making `formatCurrency` globally defensive changes behavior for every caller; deliberately deferred (see Maintenance notes).
- `src/features/analytics/lib/analytics.queries.ts` — the `-Infinity` threshold table itself stays; the fix belongs in the interpolation helper so every table is safe.
- The other chart tooltip components (`net-worth-chart.tsx`, `income-vs-expenses-chart.tsx`, etc.) — their data sources don't currently produce `undefined`; consolidating all tooltips is a separate refactor.
- `src/app/api/scan-receipt/route.ts` — the guard belongs client-side where the value is consumed.

## Git workflow

- Branch: `advisor/001-fix-nan-money-rendering`
- Conventional commits, no attribution footer (repo rule). Example from log: `fix(transactions): move scan input outside form to avoid 1MB server action limit`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make `computeHealthSubScore` safe for non-finite spans

In `src/features/analytics/lib/analytics.utils.ts`, inside the loop branch that interpolates, guard the span before dividing:

```ts
const span = upper.threshold - lower.threshold;
if (!Number.isFinite(span) || span === 0) return lower.score;
const ratio = (value - lower.threshold) / span;
```

Also clamp the final return defensively at the function's exit points so a future bad table can never leak a non-finite score: wrap returned interpolation as `Math.max(0, Math.min(100, ...))` only if you can do it without changing existing passing-test expectations — if any existing test fails because of the clamp, drop the clamp and keep only the span guard.

**Verify**: `pnpm test -- src/features/analytics/lib/analytics.utils.test.ts` → all existing tests pass.

### Step 2: Regression tests for the -Infinity table

In `src/features/analytics/lib/analytics.utils.test.ts`, add a `describe("negative savings rate")` block using the exact production table from `analytics.queries.ts:583-590`:

- `computeHealthSubScore(-0.5, table)` → returns a finite number (`Number.isFinite` true) and equals `0` (the `-Infinity` row's score).
- `computeHealthSubScore(-10, table)` → `0`, finite.
- `computeHealthSubScore(0.02, table)` → still interpolates normally between 0 and 0.05 (value strictly between 20 and 40) — protects against over-guarding.

**Verify**: `pnpm test -- src/features/analytics/lib/analytics.utils.test.ts` → all pass, including 3 new tests.

### Step 3: Filter non-finite values out of the forecast tooltip

In `src/features/analytics/components/cash-flow-forecast-chart.tsx`:
1. Change `TooltipPayloadItem.value` to `value: number | undefined`.
2. In `CustomTooltip`, before mapping, filter: `payload.filter((entry) => typeof entry.value === "number" && Number.isFinite(entry.value))`.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Then manually: `pnpm dev`, log in (test@test.com / test1234 if seeded), open `/en/analytics`, hover the Cash Flow Forecast chart on an actual (non-projected) month → tooltip shows only rows with real amounts, no "$NaN".

### Step 4: Guard goal progress division

In `src/features/goals/lib/goals.queries.ts`, `computeProgress`: if `goal.targetAmount <= 0`, set `percentage = 0` (keep `currentAmount` and `contributionCount` as-is).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 5: Return null for non-positive net value in annualized return

In `src/features/investments/lib/investments.utils.ts`, extend the ternary condition: compute annualized return only when `daysSinceStart > 0 && initialAmount > 0 && netValue > 0`; otherwise `null`. Add two tests in `src/features/investments/lib/investments.utils.test.ts` (model after existing tests in that file):

- Fees exceed current value (`netValue < 0`) → `annualizedReturn` is `null`.
- `netValue === 0` → `null`.

**Verify**: `pnpm test -- src/features/investments/lib/investments.utils.test.ts` → all pass, including 2 new tests.

### Step 6: Guard credit-card usage ratio in alert generation

In `src/features/alerts/lib/alert-generation.ts`, locate `usageRatio` (~line 186). Early-return / skip the high-usage alert when `card.totalLimit <= 0`.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 7: Validate the scanned amount before converting to cents

In `src/features/transactions/components/quick-add-form.tsx:97`, replace with a finite-number guard:

```ts
if (typeof data.amount === "number" && Number.isFinite(data.amount) && data.amount > 0) {
  setDefaultAmount(Math.round(data.amount * 100))
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

## Test plan

- New unit tests (steps 2 and 5): 3 for `computeHealthSubScore` with the `-Infinity` table, 2 for `calculateReturn` with non-positive net value.
- Pattern: existing colocated Vitest files `analytics.utils.test.ts` / `investments.utils.test.ts`.
- Verification: `pnpm test -- src/features/analytics/lib/analytics.utils.test.ts src/features/investments/lib/investments.utils.test.ts` → all pass, 5 new tests included.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test -- src/features/analytics/lib/analytics.utils.test.ts src/features/investments/lib/investments.utils.test.ts` exits 0 with 5 new tests
- [ ] `pnpm lint` exits 0
- [ ] `rg -n "Math.round\(data.amount \* 100\)" src/features/transactions/components/quick-add-form.tsx` returns no match
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (drift).
- An existing test in either touched test file fails for a reason unrelated to your change.
- Step 1's clamp breaks existing expectations AND removing the clamp still leaves a failing test.
- You find additional `-Infinity` thresholds elsewhere via `rg -n "\-Infinity" src/` — fix nothing extra; report them.

## Maintenance notes

- Deferred follow-up: make `formatCurrency` in `src/shared/lib/formatters.ts` render a placeholder (e.g. "—") for non-finite input, and consolidate the ~7 hand-rolled chart tooltip components onto `src/shared/components/chart-tooltip.tsx` with `value?: number`. That is a wider refactor; this plan only closes the live NaN paths.
- Reviewer should scrutinize: that step 1 still interpolates correctly for finite tables (the 0.02 test), and that step 6 skips only the alert, not the rest of the card loop.
- If a new health factor is added with a `-Infinity` floor, the helper is now safe — but keep floors finite where possible.
