# Plan 004: Fix nested `<button>` hydration errors in dialog triggers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/shared/components/form-dialog.tsx src/features/export/components/export-dialog.tsx src/features/group-finances/components/group-transaction-dialog.tsx src/features/tags/components/tag-manager-dialog.tsx src/features/dashboard/components/dashboard-customizer.tsx src/components/ui/dialog.tsx`
> On mismatch with the excerpts below, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/000-restore-typecheck-baseline.md (for the tsc gate)
- **Category**: bug
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

Every page that renders a dialog trigger wrapping a `<Button>` throws in the browser console: `In HTML, <button> cannot be a descendant of <button>. This will cause a hydration error.` — followed by a full React hydration failure ("the tree will be regenerated on the client"). Confirmed live on the dashboard (Customize), `/en/transactions` (Export), and `/en/categories` (New Category). Hydration regeneration throws away server-rendered work on exactly the heaviest pages, and invalid button nesting breaks keyboard/assistive-tech semantics.

## Current state

Base UI's `DialogTrigger` renders its own native `<button>`; passing a `<Button>` as a child nests two buttons. The repo already contains the correct pattern — Base UI's `render` prop — in `src/components/ui/dialog.tsx:112`:

```tsx
<DialogPrimitive.Close render={<Button variant="outline" />}>
```

The five broken sites (all pass a `<Button>`-bearing child instead of `render`):

1. `src/shared/components/form-dialog.tsx:31` — `<DialogTrigger>{trigger}</DialogTrigger>` — the shared dialog used by categories, budgets, goals, etc. `trigger` arrives as a prop typed `ReactNode`; every caller passes a `<Button>`.
2. `src/features/export/components/export-dialog.tsx:86` — `<DialogTrigger>{trigger}</DialogTrigger>`
3. `src/features/group-finances/components/group-transaction-dialog.tsx:43` — `<DialogTrigger>{trigger}</DialogTrigger>`
4. `src/features/tags/components/tag-manager-dialog.tsx:77` — `<DialogTrigger>{trigger}</DialogTrigger>`
5. `src/features/dashboard/components/dashboard-customizer.tsx:65-69`:

```tsx
<DialogTrigger>
  <Button variant="outline" size="sm">
    <LayoutGrid className="h-4 w-4" />
    <span className="ml-2 hidden sm:inline">{t("trigger")}</span>
  </Button>
</DialogTrigger>
```

`DialogTrigger` in `src/components/ui/dialog.tsx:14-16` is a thin passthrough of `DialogPrimitive.Trigger.Props`, so it already accepts `render`.

The Base UI `render` prop expects a **ReactElement**, not arbitrary ReactNode. The dialogs' `trigger` props are declared `ReactNode` (e.g. `src/features/categories/components/category-dialog.tsx:16` and the `FormDialog` props) — every real caller passes a single element, but the type must be tightened to `ReactElement` to satisfy `render`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Dev server | `pnpm dev`              | Ready on :3000      |
| Lint      | `pnpm lint`              | exit 0              |

## Scope

**In scope**:
- `src/shared/components/form-dialog.tsx`
- `src/features/export/components/export-dialog.tsx`
- `src/features/group-finances/components/group-transaction-dialog.tsx`
- `src/features/tags/components/tag-manager-dialog.tsx`
- `src/features/dashboard/components/dashboard-customizer.tsx`
- ONLY IF tsc requires it after tightening `trigger` types: the prop **type annotations** (`ReactNode` → `ReactElement`) in direct callers such as `src/features/categories/components/category-dialog.tsx`, `src/features/budgets/components/budget-dialog.tsx` — type-only edits, no JSX changes.

**Out of scope**:
- `src/components/ui/dialog.tsx` and every other file under `src/components/ui/` — generated shadcn primitives; the passthrough already supports `render`.
- Restructuring any trigger's visual content.

## Git workflow

- Branch: `advisor/004-fix-nested-button-triggers`
- Conventional commit, e.g. `fix(ui): use Base UI render prop for dialog triggers to stop button nesting`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the shared `FormDialog`

In `src/shared/components/form-dialog.tsx`: change the `trigger` prop type from `ReactNode` to `ReactElement` (import from `react`), and replace `<DialogTrigger>{trigger}</DialogTrigger>` with `<DialogTrigger render={trigger} />`.

**Verify**: `pnpm exec tsc --noEmit` → if it now errors on FormDialog callers passing non-element nodes, inspect each: real callers pass `<Button>` elements, so only annotations need tightening (see Scope). Re-run until exit 0.

### Step 2: Fix the three `{trigger}` dialogs

Apply the same two-line change (prop type + `render={trigger}`) in `export-dialog.tsx`, `group-transaction-dialog.tsx`, `tag-manager-dialog.tsx`.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Fix the dashboard customizer (inline JSX)

In `dashboard-customizer.tsx`, move the `<Button>…</Button>` element into the render prop:

```tsx
<DialogTrigger
  render={
    <Button variant="outline" size="sm">
      <LayoutGrid className="h-4 w-4" />
      <span className="ml-2 hidden sm:inline">{t("trigger")}</span>
    </Button>
  }
/>
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Prove hydration is clean

`pnpm dev`, log in, open DevTools console, visit: dashboard `/en`, `/en/transactions`, `/en/categories`, `/en/groups` (open the group transaction dialog if a group exists), and click each fixed trigger — the dialog must still open.

**Verify**: zero `cannot be a descendant of` and zero `Hydration failed` console errors on those pages; each dialog opens and closes normally.

## Test plan

No new automated tests — component render tests don't exist in this repo's Vitest setup (no jsdom/RTL configured). The console-error sweep in Step 4 is the gate. State in your report which pages you checked.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `rg -n "<DialogTrigger>\{trigger\}</DialogTrigger>" src/` returns no matches
- [ ] All five triggers open their dialog in the browser; no nested-button console errors
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Any of the five sites doesn't match its excerpt (drift).
- A `trigger` caller passes something that is genuinely not a single element (e.g. a fragment or string) — report it instead of wrapping it ad hoc.
- After the change a dialog no longer opens (Base UI version quirk with `render`) — revert that site and report the Base UI version from `package.json` (`@base-ui/react`).

## Maintenance notes

- Convention going forward: **never** put a `<Button>` inside `<DialogTrigger>`/`<DrawerTrigger>` children; always `render={<Button …/>}`. `src/components/ui/dialog.tsx:112` is the canonical example.
- The same audit found no `DrawerTrigger`/`AlertDialogTrigger`/`PopoverTrigger` child-button instances at this commit, but new ones can regress — the `rg` in Done criteria is worth keeping in CI or a lint rule later.
