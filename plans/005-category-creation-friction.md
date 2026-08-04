# Plan 005: Make category creation one-field fast (defaults, TRANSFER, empty state, date default)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/features/categories src/features/transactions/components/transaction-form.tsx src/features/transactions/components/quick-add-form.tsx src/i18n/messages`
> On mismatch with the excerpts below, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/000-restore-typecheck-baseline.md; plans/004-fix-nested-button-triggers.md (touches `form-dialog.tsx`, which the category dialog sits on — land 004 first to avoid conflicts)
- **Category**: dx / bug
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

The owner's words: "adding categories feels heavy." Measured friction at this commit: the New Category form has 8 fields; the icon picker (~47 tiles) and color picker (16 swatches) start **empty**, so typing a name and pressing "Create Category" always fails — with a full server round-trip — showing "This field is required" and "Must be a valid hex color" (reproduced live). Two adjacent paper cuts: the category form cannot create TRANSFER categories even though transactions support TRANSFER, and the transaction form's Date field starts empty when ~95% of entries are "today". This plan makes name-only creation succeed and kills the paper cuts.

## Current state

- `src/features/categories/components/category-icon-picker.tsx:19` — `const [selected, setSelected] = useState(value ?? "");` → hidden input posts `""`.
- `src/features/categories/components/category-color-picker.tsx:37` — same: `useState(value ?? "")`. Its palette is `COLOR_PRESETS` (16 hex strings, lines 7-24).
- `src/features/categories/lib/categories.schema.ts` — `icon: z.string().min(1, { error: "required" })`, `color: z.string().regex(/^#[0-9a-f]{6}$/i, …)` → empty strings fail server-side.
- `src/features/categories/components/category-form.tsx:135-155` — the type Select offers only INCOME/EXPENSE:

```tsx
items={[
  { value: "INCOME", label: t("form.income") },
  { value: "EXPENSE", label: t("form.expense") },
]}
```

  while `src/features/transactions/components/transaction-form.tsx:189-193` offers INCOME/EXPENSE/TRANSFER, and the schema already accepts any `TransactionType` (`z.nativeEnum(TransactionType)`). Note `category-form.tsx:177` gates the alert-threshold field on `transactionType === "EXPENSE"` — TRANSFER must behave like INCOME there (no threshold).
- `src/features/categories/components/category-select.tsx:35-76` — used by the transaction, quick-add, budget, recurring, and rule forms; when `categories` is empty it renders a dropdown with zero items and no guidance.
- `src/features/transactions/components/transaction-form.tsx:160-168` — the Date picker has `defaultValue` only in edit mode:

```tsx
<DatePicker
  name="date"
  defaultValue={defaultValues ? formatDateForInput(defaultValues.date) : undefined}
  required
  placeholder={t("form.selectDate")}
/>
```

  `formatDateForInput` is already imported in that file — check its import line and reuse it.
- i18n: chrome strings live in `src/i18n/messages/en.json` and `es.json` under `categories.*`. Both files must receive any new key (the app is bilingual).
- Conventions: feature components are `"use client"` where interactive; tabs indentation; `FieldError` for field errors; toasts via `sonner`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Targeted tests | `pnpm test -- src/features/categories` | all pass (DB-backed — needs `.env` with Neon access; skip if unavailable and say so) |
| Lint      | `pnpm lint`              | exit 0              |
| Dev       | `pnpm dev`               | Ready on :3000      |

## Scope

**In scope**:
- `src/features/categories/components/category-icon-picker.tsx`
- `src/features/categories/components/category-color-picker.tsx`
- `src/features/categories/components/category-form.tsx`
- `src/features/categories/components/category-select.tsx`
- `src/features/transactions/components/transaction-form.tsx` (date default only)
- `src/features/transactions/components/quick-add-form.tsx` (date default only, if its date also starts empty — check first)
- `src/i18n/messages/en.json`, `src/i18n/messages/es.json` (new keys only)

**Out of scope**:
- `src/features/categories/lib/categories.schema.ts` and all server actions — server-side strictness stays; the fix is client defaults.
- Inline category creation from the transaction form — that is plan 006.
- `prisma/seed.ts` (adding more default categories is part of plan 006's scope decision).
- The group category variants beyond what `category-form.tsx` itself covers.

## Git workflow

- Branch: `advisor/005-category-creation-friction`
- Conventional commits per step, e.g. `feat(categories): default icon and color so name-only creation succeeds`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Default the color picker

In `category-color-picker.tsx`, when no `value` is provided, fall back to a deterministic default instead of `""`. Use the first preset:

```ts
const [selected, setSelected] = useState(value ?? COLOR_PRESETS[0]);
```

Better UX (do this if quick): rotate by a stable hash of nothing available — not worth complexity; first preset is fine.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Default the icon picker

In `category-icon-picker.tsx`, default to a generic icon key that exists in `ICON_MAP` (`src/shared/lib/icons.ts:52` — inspect the map and pick its most generic key, e.g. a tag/circle/wallet icon; use the FIRST key if unsure: `Object.keys(ICON_MAP)[0]`, computed outside the component). Also delete the dead re-export at the bottom of the file (`export { ICON_MAP as ICONS };` — reported unused by the audit; confirm with `rg -n "\bICONS\b" src/ --glob '!**/category-icon-picker.tsx'` before deleting; if any hit appears, leave it and note it).

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Manual: open New Category on `/en/categories`, type only a name, submit → category is created (toast), no server error.

### Step 3: Add TRANSFER to the category form's type select

In `category-form.tsx`, add `{ value: "TRANSFER", label: t("form.transfer") }` to both the `items` array and the `<SelectContent>` children (this Select duplicates its list — keep both in sync). Add the `categories.form.transfer` key to `en.json` ("Transfer") and `es.json` ("Transferencia"). The threshold field's `transactionType === "EXPENSE"` gate already excludes TRANSFER — no change there.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Manual: create a TRANSFER category → appears in the tree with badge TRANSFER.

### Step 4: Empty state in `CategorySelect`

In `category-select.tsx`, when `categories.length === 0`, render instead of the Select a bordered hint box: text `t("select.empty")` plus a link to `/categories` (use `Link` from `@/i18n/navigation` — same import style as `src/app/[locale]/(dashboard)/budgets/page.tsx:12`). Keep the hidden field absent — the form's required validation still fires, but the user now knows why. Add `categories.select.empty` to both message files (en: "No categories yet — create one first", es: "Todavía no hay categorías — creá una primero" — NOTE: neutral Spanish "crea una primero" is fine too; match the tone of existing es.json strings, check how es.json phrases imperatives).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 5: Default the transaction date to today

In `transaction-form.tsx`, make create-mode default to today:

```tsx
defaultValue={defaultValues ? formatDateForInput(defaultValues.date) : formatDateForInput(new Date())}
```

Check `quick-add-form.tsx` for its date field: if it also renders a `DatePicker`/date state starting empty in create mode, apply the same default; if it already defaults (it manages `date` state for the scan flow — read it), leave it.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Manual: open New Transaction → Date shows today; submitting with amount+description+category succeeds without touching Date.

## Test plan

- If the categories test file(s) under `src/features/categories` cover the create action, run them (DB-backed): `pnpm test -- src/features/categories` → pass. No new automated tests: the changed behavior is client-side defaults, and the repo has no component-render test setup. The manual gates in steps 2, 3, 5 are the acceptance checks — report each.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0; `pnpm lint` exits 0
- [ ] Manual: name-only category creation succeeds end-to-end
- [ ] Manual: TRANSFER category can be created from the UI
- [ ] Manual: New Transaction date defaults to today
- [ ] `rg -n "useState\(value \?\? \"\"\)" src/features/categories` returns no matches
- [ ] Both `en.json` and `es.json` contain every new key (`categories.form.transfer`, `categories.select.empty`)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Excerpts don't match (drift).
- The icon/color default breaks the EDIT flow (existing categories opening with wrong values) — the pickers receive `value` in edit mode; if that stops working, stop.
- `es.json`/`en.json` have diverged structurally and the `categories` namespace isn't where this plan says — report the actual structure.

## Maintenance notes

- Plan 006 (combobox picker + inline creation) builds directly on this; land 005 first.
- Reviewer: check the icon default renders sensibly in the tree/badges (it's user-visible), and that server-side validation is untouched (the schema files must show no diff).
- Deferred deliberately: duplicate-name checks and parent-ownership validation in the create action (see `plans/README.md` rejected/deferred notes).
