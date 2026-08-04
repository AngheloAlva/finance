# Plan 002: Fix every server→client function-prop 500 (budgets, alerts, group transactions)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. Do NOT update `plans/README.md`; your reviewer
> maintains the index.
>
> **Drift check**: already run by the reviewer at commit `0e87419` — NO drift.
> The "Current state" excerpts below match the live code verbatim.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 000 (the `tsc --noEmit` gate) — DONE and merged into `main`
- **Category**: bug
- **Planned at**: commit `a28a365`, 2026-08-03
- **Revised at**: commit `0e87419`, 2026-08-04 — scope widened from 1 page to 3 after an
  `rg -n "buildHref"` sweep found two more server pages with the identical bug. The
  original plan's maintenance note claiming `pagination-controls.tsx` "is only consumed
  from client components today" was WRONG: `alerts/page.tsx` imports it directly.

## Why this matters

`GET /en/budgets` returns **HTTP 500** — the page is unusable. Server log at commit `a28a365`:

```
⨯ Error: Functions cannot be passed directly to Client Components unless you
explicitly expose it by marking it with "use server".
  <... month={8} year={2026} buildHref={function buildHref}>
```

A server component cannot pass a function prop to a `"use client"` component — React Server
Components cannot serialize functions across that boundary. **Three server pages do exactly
this**, all via the `buildHref` prop:

| Server page | Line | Client component receiving a function |
|---|---|---|
| `src/app/[locale]/(dashboard)/budgets/page.tsx` | 51 | `MonthSelector` (`src/shared/components/month-selector.tsx`) |
| `src/app/[locale]/(dashboard)/alerts/page.tsx` | 53 | `PaginationControls` (`src/shared/components/pagination-controls.tsx`) |
| `src/app/[locale]/(dashboard)/groups/[id]/transactions/page.tsx` | 111 | `PaginationControls` |

Both shared components carry `"use client"` on line 1 (verified). None of the three pages
carries `"use client"` (verified — all are async server components using `requireSession`).

The repo already solved this twice. The fix is always the same shape: **a thin per-feature
client wrapper that receives only serializable props and builds the `buildHref` closure
inside itself.**

## Current state

### The two shared client components (DO NOT MODIFY)

- `src/shared/components/month-selector.tsx:1` — `"use client";`, prop `buildHref: (month: number, year: number) => string` (line 17).
- `src/shared/components/pagination-controls.tsx:1` — `"use client";`, prop `buildHref: (page: number) => string` (line 12).

### Exemplar A — the month-selector wrapper that already works

`src/features/dashboard/components/month-selector.tsx` (all 18 lines, spaces + semicolons):

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

A second one exists at `src/features/group-finances/components/group-month-selector.tsx:20`.

### Exemplar B — the pagination wrapper that already works (THE pattern for cases 2 and 3)

`src/features/transactions/components/transaction-pagination.tsx` (verbatim, spaces + semicolons):

```tsx
"use client";

import { PaginationControls } from "@/shared/components/pagination-controls";

interface TransactionPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  searchParams: Record<string, string | string[] | undefined>;
}

export function TransactionPagination({
  total,
  page,
  pageSize,
  searchParams,
}: TransactionPaginationProps) {
  function buildHref(targetPage: number): string {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (typeof value === "string" && value.length > 0) {
        params.set(key, value);
      }
    }

    params.set("page", String(targetPage));

    return `/transactions?${params.toString()}`;
  }

  return (
    <PaginationControls
      total={total}
      page={page}
      pageSize={pageSize}
      buildHref={buildHref}
    />
  );
}
```

Note the shape: **plain data in, closure built inside**. Reproduce this, do not invent
another approach.

### Case 1 — `budgets/page.tsx:44-53` (tabs, no semicolons)

```tsx
	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">{t("title")}</h1>
				<MonthSelector
					month={month}
					year={year}
					buildHref={(m, y) => `/budgets?month=${m}&year=${y}`}
				/>
			</div>
```

Imported at line 13 as `import { MonthSelector } from "@/shared/components/month-selector"`.

### Case 2 — `alerts/page.tsx:30-56` (tabs, no semicolons)

```tsx
	function buildHref(targetPage: number): string {
		const p = new URLSearchParams()
		if (status) p.set("status", status)
		p.set("page", String(targetPage))
		return `/alerts?${p.toString()}`
	}

	return (
		...
			{alertsResult.totalPages > 1 && (
				<PaginationControls
					total={alertsResult.total}
					page={alertsResult.page}
					pageSize={alertsResult.pageSize}
					buildHref={buildHref}
				/>
			)}
```

`PaginationControls` is imported at line 8. `status` comes from the page's parsed
`searchParams` and is a `string | undefined` (an `AlertStatus` value or absent).

### Case 3 — `groups/[id]/transactions/page.tsx:106-121` (spaces, semicolons)

```tsx
      {result.total > 0 && (
        <PaginationControls
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          buildHref={(page) => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
            if (filters.dateTo) params.set("dateTo", filters.dateTo);
            if (filters.categoryId)
              params.set("categoryId", filters.categoryId);
            return `/groups/${id}/transactions?${params.toString()}`;
          }}
        />
```

`PaginationControls` imported at line 14. `filters` is a `GroupTransactionFilters`
(`src/features/group-finances/types/group-finances.types`) — plain serializable data.
`id` is the group id string from `params`.

### Conventions

- **Indentation and semicolons vary per file.** `budgets/page.tsx` and `alerts/page.tsx`
  use TABS and NO semicolons. `groups/[id]/transactions/page.tsx` and both exemplar
  wrappers use SPACES and semicolons. **Match the file you are editing**; for new files,
  match the sibling files in that feature directory.
- New client wrappers live in `src/features/<feature>/components/`, named after what they
  wrap, one named export, `"use client"` on line 1.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no output   |
| Lint (scoped) | `pnpm exec eslint <your changed files>` | exit 0 |

`tsc` will NOT catch this bug — it is a runtime RSC serialization error. The typecheck only
proves you did not break types. The real proof is the grep-based criteria below plus the
reviewer's manual page load.

## Scope

**In scope** (create):
- `src/features/budgets/components/budget-month-selector.tsx`
- `src/features/alerts/components/alert-pagination.tsx`
- `src/features/group-finances/components/group-transaction-pagination.tsx`

**In scope** (edit — swap import + usage only):
- `src/app/[locale]/(dashboard)/budgets/page.tsx`
- `src/app/[locale]/(dashboard)/alerts/page.tsx`
- `src/app/[locale]/(dashboard)/groups/[id]/transactions/page.tsx`

**Out of scope** (do NOT touch):
- `src/shared/components/month-selector.tsx` and `src/shared/components/pagination-controls.tsx`
  — their `buildHref` API stays exactly as is; client-side consumers depend on it.
- `src/features/dashboard/components/month-selector.tsx`,
  `src/features/group-finances/components/group-month-selector.tsx`,
  `src/features/transactions/components/transaction-pagination.tsx` — already correct.
- Any other page or component. If you find a FOURTH server page passing a function prop,
  report it — do not fix it here.

## Git workflow

- Branch: `advisor/002-fix-rsc-function-props` (branch from `main`)
- One conventional commit, no attribution footer:
  `fix(rsc): wrap month selector and pagination in client components to stop serialization crash`
- Do NOT push or open a PR.

## Steps

### Step 1: Budgets month selector

Create `src/features/budgets/components/budget-month-selector.tsx` modeled on Exemplar A,
exporting `BudgetMonthSelector` with props `{ month: number; year: number }` and
`buildHref={(m, y) => \`/budgets?month=${m}&year=${y}\`}`.

Then in `src/app/[locale]/(dashboard)/budgets/page.tsx`: drop the
`@/shared/components/month-selector` import, import `BudgetMonthSelector`, and replace the
JSX — passing only `month` and `year`, no `buildHref`.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Alerts pagination

Create `src/features/alerts/components/alert-pagination.tsx` modeled on **Exemplar B**.
Props: `{ total: number; page: number; pageSize: number; status?: string }` — all
serializable. Move the `buildHref` body from `alerts/page.tsx:30-35` into the wrapper
verbatim (it already reads only `status` and `targetPage`).

Then in `alerts/page.tsx`: delete the local `buildHref` function declaration, drop the
`PaginationControls` import, import `AlertPagination`, and pass `status` as a prop instead
of the function.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. `rg -n "function buildHref" "src/app/[locale]/(dashboard)/alerts/page.tsx"` → no match.

### Step 3: Group transactions pagination

Create `src/features/group-finances/components/group-transaction-pagination.tsx` modeled on
Exemplar B. Props: `{ total: number; page: number; pageSize: number; groupId: string; filters: GroupTransactionFilters }`
(import the type from `@/features/group-finances/types/group-finances.types`). Move the
inline arrow body from `groups/[id]/transactions/page.tsx:111-119` into the wrapper,
replacing `id` with `groupId` and reading `dateFrom`/`dateTo`/`categoryId` off `filters`.

Then in the page: drop the `PaginationControls` import, import
`GroupTransactionPagination`, pass `groupId={id}` and `filters={filters}`.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Prove no server page passes a function prop anymore

**Verify**: `rg -n "buildHref" src/app` → **no output at all**. Every remaining `buildHref`
must live under `src/features/` or `src/shared/`.

### Step 5: Scoped lint

**Verify**: `pnpm exec eslint` on your six changed/created files → exit 0.

> NOTE: do NOT run repo-wide `pnpm lint` and do NOT try to make it exit 0. This repo has a
> pre-existing baseline of 8 errors / 26 warnings in unrelated files. Fixing those is a
> scope violation.

## Test plan

No new automated tests. The RSC server/client boundary is not covered by the Vitest setup
(no page rendering, no Next runtime). The gates are the greps in Steps 2 and 4 plus the
reviewer's manual page loads of `/en/budgets`, `/en/alerts`, and a group's transactions page.

State plainly in your report that runtime verification was NOT performed by you.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `rg -n "buildHref" src/app` returns NO matches
- [ ] `rg -n "shared/components/month-selector|shared/components/pagination-controls" src/app` returns NO matches
- [ ] The three new wrapper files exist, each with `"use client"` on line 1
- [ ] eslint on the six changed files exits 0
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- Any "Current state" excerpt does not match the live code (drift).
- A page needs a prop that is NOT serializable (a Date instance is fine; a function,
  class instance, or Prisma model with methods is not) to build its href — report what and why.
- `rg -n "buildHref" src/app` still shows matches after Step 3 that you cannot resolve
  within the in-scope files.
- You find a fourth server page passing any function prop to a `"use client"` component.

## Maintenance notes

- **The rule this codifies**: a server page must never import `src/shared/components/month-selector.tsx`
  or `src/shared/components/pagination-controls.tsx` directly. Always a per-feature client
  wrapper that takes serializable props and builds the closure internally.
- `rg -n "buildHref" src/app` returning empty is the grep-able invariant. Worth a lint rule
  or a CI grep if a fourth consumer ever appears — deferred, not in scope here.
- Reviewer should confirm the alerts wrapper preserves the `status` query param across page
  navigation (the original `buildHref` only set `status` when truthy — keep that behavior,
  otherwise paginating a filtered alert list silently drops the filter).
