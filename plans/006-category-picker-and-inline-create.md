# Plan 006: Searchable category picker with icons, type filtering, inline creation, and a richer default set

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/features/categories prisma/seed.ts src/features/transactions/components src/i18n/messages`
> On mismatch with the excerpts below, STOP. (Note: plan 005 legitimately
> touches some of these files — diff against 005's merge commit instead if it
> already landed, and reconcile with its changes.)

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/005-category-creation-friction.md (defaults + empty state land first; this plan replaces the select those changes touch)
- **Category**: dx / direction
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

Every category in the DB has an icon and a color, but the picker where users actually choose one (`CategorySelect`, used by 6 forms) is a flat text-only dropdown: no search, no icons, no grouping, and it offers INCOME categories while recording an EXPENSE. As the default set grows this gets linearly worse. Separately, a missing category mid-transaction forces abandoning the form to visit `/categories`. This plan: (a) upgrades the picker to a searchable combobox with icon+color and type filtering, (b) adds "+ New category" inline creation that auto-selects the result, and (c) expands the system defaults with commonly missing categories (Pets, Travel, Taxes, Kids, Clothing — the owner asked for "more defaults").

## Current state

- `src/features/categories/components/category-select.tsx` — the whole component (80 lines) is a Base UI `Select` fed by `items` + duplicated `SelectItem` children; hierarchy is conveyed by `pl-4` indentation; no icon/color usage; props: `{ categories, name, defaultValue, value, onValueChange, error }`. All six consumers:
  - `src/features/transactions/components/transaction-form.tsx:278`
  - `src/features/transactions/components/quick-add-form.tsx` (search `CategorySelect`)
  - `src/features/budgets/components/budget-form.tsx`
  - `src/features/recurring/components/recurring-form.tsx`
  - `src/features/group-finances/components/group-transaction-form.tsx`
  - `src/features/categorization/components/rule-form.tsx`
- The transaction form tracks its type in state (`transaction-form.tsx:186-193`, a Select for INCOME/EXPENSE/TRANSFER) but never passes it to `CategorySelect`.
- A ready combobox primitive exists: `src/components/ui/combobox.tsx` exports `Combobox` (Root), `ComboboxTrigger`, `ComboboxInput`, `ComboboxContent`, `ComboboxList`, `ComboboxItem`, `ComboboxGroup`, `ComboboxLabel`, `ComboboxEmpty`, etc. Read the file before using — it is a Base UI wrapper, not shadcn/cmdk.
- Icon rendering exemplar: `src/features/categories/components/category-tree-item.tsx` imports `ICON_MAP` from `@/shared/lib/icons` and renders `ICON_MAP[category.icon]` with the category color — copy that approach.
- Inline creation building blocks: `src/features/categories/components/category-dialog.tsx` (self-contained create dialog, takes `categories` + `trigger`, uses `FormDialog` whose `onSuccess` closes it); `src/features/categories/actions/create-category.action.ts:74` currently returns `ActionResult<void>` (`{ success: true, data: undefined }`) — inline auto-select needs the created category's id, so the action must return it.
- `src/features/categories/components/category-form.tsx:81-90` — on success calls `onSuccess?.()` with no payload.
- Default categories: `prisma/seed.ts:21-166` — `SYSTEM_CATEGORIES` array; ids are `sys_cat_<slug>` via `slugToId`; parents carry color+type, children inherit both; everything is upserted idempotently (`prisma.category.upsert` on id) so re-running the seed is safe. Existing roots: food-dining, transport, housing, entertainment, health, education, shopping, subscriptions, insurance, personal-care, gifts-donations, salary, freelance, investment-returns, other-income, transfer.
- Icons must be keys of `ICON_MAP` (`src/shared/lib/icons.ts:52`) — verify each icon key you use exists in that map.
- Server actions consume the picker's value via `formData.get("categoryId")` — the current Select submits through a hidden input via the `name` prop. Whatever replaces it MUST still put the selected id in the form data under the same `name`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Categories tests | `pnpm test -- src/features/categories` | all pass (DB-backed; skip if no `.env`, and say so) |
| Seed (idempotent) | `npx tsx prisma/seed.ts` | "Seeding complete." |
| Lint      | `pnpm lint`              | exit 0              |

## Scope

**In scope**:
- `src/features/categories/components/category-select.tsx` (rewrite to combobox)
- `src/features/categories/components/category-form.tsx` (surface created id to onSuccess)
- `src/features/categories/actions/create-category.action.ts` (return created id)
- `src/features/categories/actions/create-category.action` **tests** under `src/features/categories` if they assert the return shape
- The six consumer forms — ONLY to pass the new optional props (`transactionType`, `allowInlineCreate`); no other changes
- `prisma/seed.ts` (new SYSTEM_CATEGORIES entries)
- `src/i18n/messages/en.json`, `src/i18n/messages/es.json` (new keys)

**Out of scope**:
- `src/components/ui/*` — use the combobox primitive as-is.
- Translating SYSTEM category names (they are English-only in the DB; separate follow-up recorded in README).
- The group-scoped category actions.
- `update-category.action.ts` return shape.

## Git workflow

- Branch: `advisor/006-category-picker-and-inline-create`
- One commit per step, conventional style, e.g. `feat(categories): searchable combobox picker with icons and type filter`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Return the created category id from the action

In `create-category.action.ts`, change the signature to `ActionResult<{ id: string }>` and return `{ success: true, data: { id: created.id } }` (capture `const created = await prisma.category.create(…)`). Update `INITIAL_VOID_STATE` usage in `category-form.tsx` if the initial-state type no longer fits — check `src/shared/types/common.types.ts` for an initial-state helper compatible with a data-carrying result; if only `INITIAL_VOID_STATE` exists, add a local initial constant in the form file rather than editing the shared type.

In `category-form.tsx`, change `onSuccess?: () => void` to `onSuccess?: (createdId?: string) => void` and call it with `state.data?.id` when present. `FormDialog`'s success callback ignores arguments, so existing dialog usage keeps working.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. If tests under `src/features/categories` assert the action's return shape, update them; `pnpm test -- src/features/categories` → pass.

### Step 2: Rebuild `CategorySelect` as a combobox

Rewrite `category-select.tsx` keeping the exact prop contract and adding two optional props:

```ts
interface CategorySelectProps {
  categories: CategoryWithChildren[];
  name: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  error?: string;
  transactionType?: string;        // NEW: filter roots by type when provided
  allowInlineCreate?: boolean;     // NEW: show "+ New category" (step 3)
}
```

Requirements:
- Filter: when `transactionType` is set, only roots with that `transactionType` (children inherit the parent's type — the DB guarantees it via the seed and the create action's UI).
- Render each option with `ICON_MAP[category.icon]` tinted `category.color` (pattern: `category-tree-item.tsx`), children grouped under a `ComboboxGroup` with the parent as `ComboboxLabel`.
- Search: `ComboboxInput` filtering by label (the Base UI combobox does its own filtering from item values/labels — read `src/components/ui/combobox.tsx` and follow its intended composition).
- Form submission: keep a hidden `<input type="hidden" name={name} value={selected ?? ""} />` controlled by the combobox selection, so all six server actions keep receiving `categoryId`.
- Keep `FieldError` at the bottom; keep the empty state from plan 005.

Then pass `transactionType` from the two forms that track it: `transaction-form.tsx` (its type state, line ~186) and `recurring-form.tsx` (check how it tracks type; wire the same way). Leave the other four consumers unfiltered.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Manual: in New Transaction with Type=Expense, the picker shows only expense categories, searching "cof" finds Coffee with its icon; switching Type to Income swaps the list; submitting still creates the transaction with the right category.

### Step 3: Inline creation from the picker

When `allowInlineCreate` is true, render a "+ {t('select.createNew')}" affordance pinned at the bottom of the combobox content (or beside the trigger — pick whichever composes cleanly with the Base UI combobox; do not fight the primitive). It opens `CategoryDialog` in create mode with the current `categories`, and on `onSuccess(createdId)` selects that id (call `onValueChange` and set the hidden input) and closes both popups. Focus management: after creation, focus returns to the picker trigger.

Enable `allowInlineCreate` on `transaction-form.tsx` and `quick-add-form.tsx` only. Note the quick-add form lives inside a vaul Drawer — a dialog over a drawer needs to actually be interactable; if focus trapping between vaul and Base UI Dialog proves broken after one honest attempt, ship the inline-create in `transaction-form` only and record the drawer limitation in your report (this is an authorized partial outcome, not a failure).

Add i18n keys: `categories.select.createNew` (en: "New category", es: "Nueva categoría").

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Manual: from New Transaction, create "Mascotas" inline → dialog closes, picker shows "Mascotas" selected, transaction submits with it.

### Step 4: Expand the default set

In `prisma/seed.ts`, append to `SYSTEM_CATEGORIES` (before the INCOME block), following the existing object shape exactly and reusing only icons present in `ICON_MAP` (verify each with `rg -n "\"<key>\"" src/shared/lib/icons.ts` or by reading the map):

- `pets` / "Pets" — suggested icon `paw-print` if present, else pick a sensible existing key
- `travel` / "Travel" — `plane` or similar
- `taxes-fees` / "Taxes & Fees" — `landmark`/`receipt`-like key
- `kids` / "Kids" — `baby`-like key
- `clothing` / "Clothing" — `shirt`-like key

Each with a distinct color from the palette already used in the file and `transactionType: TransactionType.EXPENSE`. If an icon family is missing from `ICON_MAP`, choose the closest existing key — do NOT edit `src/shared/lib/icons.ts`.

**Verify**: `npx tsx prisma/seed.ts` → "Seeding complete." with exit 0, run twice (idempotency). Then in the app, `/en/categories` lists the new roots and the picker groups them correctly.

## Test plan

- Update/extend action tests for the new return shape (step 1) — model after the existing test file under `src/features/categories` (find it with `fd -e test.ts . src/features/categories`); add one assertion: successful create returns the new id.
- Manual acceptance (report each): type filtering, search, icon rendering, inline create + auto-select, seed idempotency.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0; `pnpm lint` exits 0
- [ ] `pnpm test -- src/features/categories` passes (or explicitly reported as skipped for missing DB env)
- [ ] All six consumer forms compile with zero changes beyond the new optional props
- [ ] `npx tsx prisma/seed.ts` runs clean twice; 5 new SYSTEM roots exist
- [ ] Manual gates from steps 2-4 reported
- [ ] `en.json` and `es.json` both updated with the new keys
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The Base UI combobox in `src/components/ui/combobox.tsx` fundamentally can't do grouped items + hidden-input form submission (e.g. missing an API this plan assumed) — stop and report which primitive limitation you hit; do NOT hand-roll a popover+list replacement without sign-off.
- Changing the action's return type breaks a consumer outside the in-scope list.
- The vaul-drawer focus issue in step 3 — after one attempt, take the authorized partial path described there.

## Maintenance notes

- The combobox becomes the single category picker for the whole app; future consumers must pass `transactionType` when they know it.
- Deferred (recorded in README): translating SYSTEM category names via a slug-keyed i18n namespace (`categories.system.<slug>`) — the ids already encode slugs (`sys_cat_*`), so this plan's new entries stay compatible; duplicate-name checks; a first-run "starter pack" chooser.
- Reviewer: scrutinize form-data submission from the new picker on ALL six forms (the hidden input is the contract), and seed color/icon choices for visual coherence on `/en/categories`.
