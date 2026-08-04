# Plan 002: Fix the /budgets page 500 (function passed to client component)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/app/[locale]/(dashboard)/budgets/page.tsx src/shared/components/month-selector.tsx src/features/dashboard/components/month-selector.tsx`
> On mismatch with the excerpts below, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/000-restore-typecheck-baseline.md (for the tsc gate)
- **Category**: bug
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

`GET /en/budgets` returns **HTTP 500** — the entire Budgets page is unusable. Reproduced on dev at commit `a28a365`; server log shows:

```
⨯ Error: Functions cannot be passed directly to Client Components unless you
explicitly expose it by marking it with "use server".
  <... month={8} year={2026} buildHref={function buildHref}>
```

The server page passes a plain function prop to a `"use client"` component, which React Server Components cannot serialize. The dashboard already solved this exact problem with a thin client wrapper — Budgets just never got one.

## Current state

- `src/shared/components/month-selector.tsx` — `"use client"` component; its props include `buildHref: (month: number, year: number) => string` (line 17).
- `src/app/[locale]/(dashboard)/budgets/page.tsx` — **server** component (async, uses `requireSession`); lines 13 and 48-52:

```tsx
import { MonthSelector } from "@/shared/components/month-selector"
// ...
<MonthSelector
  month={month}
  year={year}
  buildHref={(m, y) => `/budgets?month=${m}&year=${y}`}
/>
```

- The exemplar fix, already in the repo — `src/features/dashboard/components/month-selector.tsx` (all 18 lines):

```tsx
"use client";

import { MonthSelector as SharedMonthSelector } from "@/shared/components/month-selector";

interface MonthSelectorProps {
  month: number;
  year: number;
}

export function MonthSelector({ month, year }: MonthSelectorProps) {
  return (
    <SharedMonthSelector
      month={month}
      year={year}
      buildHref={(m, y) => `/?month=${m}&year=${y}`}
    />
  );
}
```

The dashboard server page (`src/app/[locale]/(dashboard)/page.tsx:35`) imports this wrapper, not the shared component — that's why the dashboard works and Budgets crashes.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Dev server | `pnpm dev`              | Ready on :3000      |
| Lint      | `pnpm lint`              | exit 0              |

## Scope

**In scope**:
- `src/features/budgets/components/budget-month-selector.tsx` (create)
- `src/app/[locale]/(dashboard)/budgets/page.tsx` (swap the import and usage)

**Out of scope**:
- `src/shared/components/month-selector.tsx` — do not change its API; other consumers rely on it.
- `src/features/dashboard/components/month-selector.tsx` — works as-is.
- Any other page. If `rg -n "buildHref" src/app` shows another server page passing a function, report it — don't fix it here.

## Git workflow

- Branch: `advisor/002-fix-budgets-page-500`
- Conventional commit, e.g. `fix(budgets): wrap month selector in client component to stop RSC serialization crash`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the client wrapper

Create `src/features/budgets/components/budget-month-selector.tsx`, copying the dashboard wrapper above verbatim but exporting `BudgetMonthSelector` with `buildHref={(m, y) => \`/budgets?month=${m}&year=${y}\`}`. Match the budgets feature's file style (tabs, no semicolons — see `src/features/budgets/components/budget-card.tsx`).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Use it from the page

In `src/app/[locale]/(dashboard)/budgets/page.tsx`: remove the `MonthSelector` import from `@/shared/components/month-selector`; import `BudgetMonthSelector` from `@/features/budgets/components/budget-month-selector`; replace the JSX usage (drop the `buildHref` prop entirely).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Prove the page loads

With `pnpm dev` running and a logged-in session (seed user `test@test.com` / `test1234` via `npx tsx prisma/seed-user.ts` if needed):

**Verify**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/budgets -H "Cookie: <copy a logged-in session cookie from the browser>"` → `200`. Alternatively open `http://localhost:3000/en/budgets` in a browser → the page renders with the month arrows, and clicking an arrow navigates to `/budgets?month=…&year=…`.

## Test plan

No new automated tests — this is a wiring fix in a server/client boundary that the existing test setup (Vitest, no page rendering) cannot cover. The manual verification in Step 3 is the gate.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `/en/budgets` returns 200 for an authenticated session and the month arrows navigate
- [ ] `rg -n "shared/components/month-selector" "src/app/[locale]/(dashboard)/budgets/page.tsx"` returns no match
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The budgets page at the cited lines doesn't match the excerpt (drift).
- After the fix, `/en/budgets` still 500s — the page has a second serialization error; report the new server-log error verbatim.

## Maintenance notes

- Rule of thumb this codifies: server pages must never import `src/shared/components/month-selector.tsx` directly — always a per-feature client wrapper. A grep-able convention worth documenting if a third consumer appears.
- `src/shared/components/pagination-controls.tsx` has the same `buildHref` API but is only consumed from client components today (`transaction-pagination.tsx`); nothing to do, but reviewers should keep it in mind.
