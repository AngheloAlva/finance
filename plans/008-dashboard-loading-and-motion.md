# Plan 008: Dashboard loading states and a motion foundation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/app/globals.css "src/app/[locale]/(dashboard)" src/features/dashboard/components src/features/goals/components/goal-progress.tsx src/features/budgets/components/budget-progress-bar.tsx src/features/credit-cards/components/credit-card-visual.tsx src/features/transactions/components/quick-add-drawer.tsx`
> On mismatch with the excerpts below, STOP.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/000-restore-typecheck-baseline.md; plays well after plans/007 (its new card gets the count-up for free)
- **Category**: dx / direction
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

The app has zero authored motion, and — worse — the dashboard route has **no `loading.tsx` and no `Suspense`**: every click on the month arrows freezes the visible page until 11 queries plus recurring generation resolve, then the content swaps in one hard cut. That "slow and dead" feel is the biggest perceived-quality problem. This plan ships the highest-leverage tier with **no new dependencies**: a dashboard skeleton, motion design tokens with a `prefers-reduced-motion` escape hatch (an accessibility requirement BEFORE adding motion), animated number count-ups on the stat cards, progress bars that fill on mount, and a FAB with real press feedback.

## Current state

- Only route with a skeleton: `src/app/[locale]/(dashboard)/analytics/loading.tsx` (61 lines — `Skeleton` + `Card` grid; use it as the structural exemplar). The dashboard route `src/app/[locale]/(dashboard)/page.tsx` has none; it awaits `generatePendingRecurring` plus a conditional 11-query `Promise.all` (lines 87-115) before any byte renders.
- `src/app/globals.css` — Tailwind 4; `@theme inline` block at lines 7-48 holds only colors/radii; **zero** `--duration-*`/`--ease-*` tokens; zero `@keyframes`; zero `prefers-reduced-motion` handling anywhere in `src/` (verify: `rg -rn "prefers-reduced-motion" src/` → empty). `tw-animate-css` is already imported (line 2) and provides `animate-in/fade-in/slide-in-*` utilities.
- Stat cards — `src/features/dashboard/components/stat-card.tsx` (28 lines): `value: string` rendered as `<p className="text-lg font-semibold tracking-tight">{value}</p>`. Its consumer `overview-cards.tsx` passes preformatted `formatCurrency(...)` strings (lines 29-61).
- Progress bars render server-side at final width, so their `transition-all` never animates:
  - `src/features/goals/components/goal-progress.tsx:24-37` — `<div className={cn("h-full rounded-none transition-all", …)} style={{ width: `${Math.min(percentage, 100)}%` }} />` (no `"use client"` — currently a server component).
  - `src/features/budgets/components/budget-progress-bar.tsx:21-22` — same shape.
  - `src/features/credit-cards/components/credit-card-visual.tsx:78-85` — same shape.
- FAB — `src/features/transactions/components/quick-add-drawer.tsx:32-39`: fixed `<button>` with only `transition-opacity hover:opacity-80`; no entrance, no press feedback. (Its `DrawerTrigger asChild` + native button is correct — do not restructure.)
- The month selector is a plain link-navigation client component (`src/shared/components/month-selector.tsx`) — once `loading.tsx` exists, Next shows it automatically during the navigation; no changes needed there.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Lint      | `pnpm lint`              | exit 0              |
| Dev       | `pnpm dev`               | Ready on :3000      |

## Suggested executor toolkit

- If the `vercel-react-best-practices` or `emil-design-eng` skills are available in your environment, load them before steps 3-5 for animation-quality guidance. Not required.

## Scope

**In scope**:
- `src/app/[locale]/(dashboard)/loading.tsx` (create)
- `src/app/globals.css` (tokens + reduced-motion guard only)
- `src/shared/components/animated-number.tsx` (create)
- `src/features/dashboard/components/stat-card.tsx` (widen `value` prop type)
- `src/features/dashboard/components/overview-cards.tsx`
- `src/features/goals/components/goal-progress.tsx`
- `src/features/budgets/components/budget-progress-bar.tsx`
- `src/features/credit-cards/components/credit-card-visual.tsx`
- `src/features/transactions/components/quick-add-drawer.tsx`

**Out of scope**:
- `next.config.ts` — do NOT enable `experimental.viewTransition`; route transitions via the View Transitions API are deferred (recorded in README) because the flag is experimental on Next 16.2.x.
- Adding any motion library (framer-motion etc.) — explicitly rejected for this tier.
- List add/remove exit animations (`delete-entity-button.tsx` optimistic UI) — deferred, needs `useOptimistic` reconciliation design.
- `src/components/ui/*` (shadcn primitives already animate).

## Git workflow

- Branch: `advisor/008-dashboard-loading-and-motion`
- One conventional commit per step, e.g. `feat(dashboard): loading skeleton for month navigation`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Dashboard `loading.tsx`

Create `src/app/[locale]/(dashboard)/loading.tsx` modeled on the analytics one: header row (title skeleton + three small button skeletons matching Customize/Suggestions/MonthSelector), then a `grid grid-cols-1 gap-6 lg:grid-cols-2` with: one full-width 4-card stat row (four `h-[72px]` skeletons in a `sm:grid-cols-2 lg:grid-cols-4` grid), one full-width `h-[220px]` card (health gauge), two half-width `h-[300px]` cards (charts), and two full-width `h-[160px]` cards. Wrap in the same `mx-auto flex max-w-5xl flex-col gap-6` container as the real page (`page.tsx:181`).

**Verify**: `pnpm dev`, click a month arrow on the dashboard → skeleton appears instantly during the fetch, then content replaces it (throttle with DevTools "Slow 4G" if the DB is too fast to see).

### Step 2: Motion tokens + reduced-motion guard

In `globals.css`:

1. Inside the existing `@theme inline` block add:

```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 600ms;
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
```

2. At the end of the file add the global escape hatch:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Verify**: `pnpm dev` still compiles CSS without warnings; in DevTools → Rendering → "Emulate CSS prefers-reduced-motion", existing dialog/drawer animations become instant.

### Step 3: `AnimatedNumber` count-up for stat cards

Create `src/shared/components/animated-number.tsx` — a `"use client"` component:

```tsx
interface AnimatedNumberProps {
  valueCents: number
  currency: CurrencyCode
  locale?: string
  durationMs?: number // default 600
}
```

Behavior: on mount (and when `valueCents` changes), animate from the previous rendered value (0 on first mount) to the target using `requestAnimationFrame` with an ease-out curve, formatting each frame via `formatCurrency(Math.round(current), currency, locale)` (`@/shared/lib/formatters`). Respect reduced motion: if `window.matchMedia("(prefers-reduced-motion: reduce)").matches`, render the final value with no animation. Render inside a plain `<span>`; no layout shift (the container's font is tabular enough — if digits visibly jitter, add `tabular-nums` className).

Then: change `StatCard`'s `value` prop from `string` to `ReactNode` (type-only change), and in `overview-cards.tsx` replace the three `formatCurrency(...)` strings with `<AnimatedNumber valueCents={overview.totalIncome} currency={currency} locale={locale} />` etc. Leave the transaction-count card as a plain string.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Manual: dashboard numbers count up smoothly on load; with reduced-motion emulated they appear instantly.

### Step 4: Progress bars fill on mount

Create one tiny shared client component `src/shared/components/animated-progress-bar.tsx` (props: `percentage: number; className?: string`) that renders the inner bar div starting at `width: 0%` and, in a `useEffect` on mount, sets the real width so the existing `transition-all` fires (use the tokens: `transition-[width] duration-[var(--duration-slow)]`). Then use it in the three sites, preserving each site's exact color-class logic by passing it through `className`:

- `goal-progress.tsx:24-37` (add `"use client"` if required — the file currently has no hooks; using the shared component keeps this file server-side, since the client boundary lives in the shared component)
- `budget-progress-bar.tsx:21-22`
- `credit-card-visual.tsx:78-85`

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Manual: goals/budgets/credit-card bars animate from 0 to their value on page load; reduced-motion renders instantly.

### Step 5: FAB entrance and press feedback

In `quick-add-drawer.tsx:35`, extend the button's className: add `animate-in fade-in-0 zoom-in-95` (tw-animate-css, fires on mount), replace `transition-opacity hover:opacity-80` with `transition-all duration-[var(--duration-fast)] hover:opacity-90 hover:scale-105 active:scale-95`.

**Verify**: manual — FAB pops in subtly on page load, scales on hover, presses down on click; drawer still opens.

## Test plan

No new automated tests — all changes are visual/client-side and the repo has no component-render test setup. The per-step manual gates are the acceptance checks; report each, including the reduced-motion emulation result (that one is the a11y gate and is non-optional).

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0; `pnpm lint` exits 0
- [ ] `src/app/[locale]/(dashboard)/loading.tsx` exists; month navigation shows the skeleton
- [ ] `rg -n "prefers-reduced-motion" src/app/globals.css` → 1 match
- [ ] Count-up, bar-fill, and FAB behaviors verified manually, including under reduced-motion emulation
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Excerpts don't match (drift) — especially if someone already added a dashboard `loading.tsx`.
- The `@theme inline` token syntax fails to compile under the installed Tailwind 4 version — report the compiler error; do not switch to arbitrary values silently.
- `AnimatedNumber` causes visible layout shift that `tabular-nums` doesn't fix.
- Step 4's shared component can't preserve a site's color logic without duplicating it — report rather than fork the logic.

## Maintenance notes

- All future motion must consume the `--duration-*`/`--ease-*` tokens and inherit the reduced-motion guard — never hardcode durations.
- Deferred follow-ups (README): `experimental.viewTransition` route transitions (spike when Next stabilizes it), list exit animations with `useOptimistic` on `delete-entity-button.tsx`, re-evaluating `isAnimationActive={false}` on `cashflow-projection-chart.tsx` (may be a deliberate flicker fix — ask the owner).
- Reviewer: check the count-up doesn't re-fire on every re-render (only on value change), and that `loading.tsx`'s skeleton roughly matches the real layout (mismatched skeletons feel worse than none).
