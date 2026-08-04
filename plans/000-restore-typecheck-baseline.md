# Plan 000: Restore a clean `tsc --noEmit` baseline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/features/alerts/lib/alert-generation.test.ts src/features/budgets/lib/budget-alerts.test.ts src/features/investments/lib/investments.utils.test.ts src/features/transactions/lib/installment.utils.test.ts src/shared/lib/action-utils.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

`pnpm exec tsc --noEmit` currently exits 2 with ~30 pre-existing errors, all confined to five `*.test.ts` files whose fixtures drifted from the source types. Every other plan in this directory uses `tsc --noEmit → exit 0` as a verification gate, so this must land first — otherwise no plan can prove it introduced zero type errors. The tests themselves pass at runtime (Vitest doesn't typecheck); this is purely about restoring the gate.

## Current state

Exact errors as of commit `a28a365` (full list obtainable by running the command):

1. **`src/features/alerts/lib/alert-generation.test.ts`** (lines 47, 66, 85, 116, 143, 493) and **`src/features/budgets/lib/budget-alerts.test.ts`** (lines 45, 58, 71, 88, 104, 109, 136, 169): test fixtures pass `{ userId, categoryId, impactDate }` where the parameter type `TransactionAlertContext` now also requires `transactionId`, `amount`, `type`, `paymentMethod`, `creditCardId`. Find the type definition with `rg -n "TransactionAlertContext" src/features/alerts` and extend the fixtures with realistic values (e.g. `transactionId: "tx_test"`, `amount: -5000`, `type: TransactionType.EXPENSE`, `paymentMethod: PaymentMethod.DEBIT`, `creditCardId: null` — match the actual field types you find).
2. **`src/features/investments/lib/investments.utils.test.ts`** (lines 76, 79): object literals specify `type` and `currentValue` more than once (TS2783). Remove the duplicated earlier keys, keeping the value the test actually asserts on.
3. **`src/features/transactions/lib/installment.utils.test.ts`** (lines 15, 29, 41, 55, 71, 94): fixtures use the string `"CREDIT_CARD"` but the `PaymentMethod` enum value is `CREDIT`. Replace with the enum import (`PaymentMethod.CREDIT` from `@/generated/prisma/enums`) or the literal `"CREDIT"` — match how the source file under test imports it.
4. **`src/shared/lib/action-utils.test.ts`** (lines 11-62): accesses `.error` / `.fieldErrors` on `ActionResult<never>` without narrowing the discriminated union (`success: true` branch has neither field). Narrow first, e.g.:

```ts
const result = formatZodErrors(error)
if (result.success) throw new Error("expected failure result")
expect(result.fieldErrors?.name).toBeDefined()
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no output   |
| Targeted tests | `pnpm test -- src/features/investments/lib/investments.utils.test.ts src/features/transactions/lib/installment.utils.test.ts src/shared/lib/action-utils.test.ts` | all pass |
| Lint      | `pnpm lint`              | exit 0              |

Note: `src/features/alerts/lib/alert-generation.test.ts` and `src/features/budgets/lib/budget-alerts.test.ts` hit a live Neon database (slow). Run them only if your change altered fixture VALUES in a way that could change behavior, not just added missing fields: `pnpm test -- src/features/alerts/lib/alert-generation.test.ts src/features/budgets/lib/budget-alerts.test.ts`.

## Scope

**In scope** (the only files you should modify):
- `src/features/alerts/lib/alert-generation.test.ts`
- `src/features/budgets/lib/budget-alerts.test.ts`
- `src/features/investments/lib/investments.utils.test.ts`
- `src/features/transactions/lib/installment.utils.test.ts`
- `src/shared/lib/action-utils.test.ts`

**Out of scope** (do NOT touch):
- Any non-test source file. If a test can only be fixed by changing source types, that is a STOP condition — the drift may indicate a real bug.
- `tsconfig.json` — do not exclude test files from typechecking to "fix" this; that destroys the gate this plan exists to restore.

## Git workflow

- Branch: `advisor/000-restore-typecheck-baseline`
- Conventional commits, no attribution footer. Example style from log: `chore: bump next to 16.2.6 for security fixes` → use `test: restore clean tsc baseline in stale test fixtures`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the enum and duplicate-key errors (items 2 and 3)

Mechanical fixes in `investments.utils.test.ts` and `installment.utils.test.ts` as described above.

**Verify**: `pnpm exec tsc --noEmit 2>&1 | rg "investments.utils.test|installment.utils.test"` → no output.

### Step 2: Narrow the union in `action-utils.test.ts` (item 4)

**Verify**: `pnpm exec tsc --noEmit 2>&1 | rg "action-utils.test"` → no output. `pnpm test -- src/shared/lib/action-utils.test.ts` → all pass.

### Step 3: Complete the `TransactionAlertContext` fixtures (item 1)

Read the current type definition first; add ONLY missing required fields with values consistent with each test's scenario (an expense in a category). Do not change existing field values.

**Verify**: `pnpm exec tsc --noEmit` → exit 0, no output at all.

### Step 4: Run the fast test files

**Verify**: `pnpm test -- src/features/investments/lib/investments.utils.test.ts src/features/transactions/lib/installment.utils.test.ts src/shared/lib/action-utils.test.ts` → all pass, same test counts as before the change.

## Test plan

No new tests — this plan repairs existing ones. The verification is the typecheck gate itself plus the targeted runs above.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0 with no output
- [ ] `pnpm test -- src/features/investments/lib/investments.utils.test.ts src/features/transactions/lib/installment.utils.test.ts src/shared/lib/action-utils.test.ts` exits 0
- [ ] `pnpm lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Fixing a test would require changing a source (non-test) file or `tsconfig.json`.
- After adding required fixture fields, a previously passing test FAILS at runtime — the missing fields may be load-bearing in the implementation, which means the tests were silently not covering what they claim; report what you found.
- `tsc` reports errors in files not listed in this plan.

## Maintenance notes

- Once green, consider adding a `"typecheck": "tsc --noEmit"` script to `package.json` and wiring it into CI so the baseline can't rot again (deferred — not in scope here).
- Reviewer should scrutinize the alert-context fixture values: they must represent the same scenario the test asserted before (same category, same user), or assertions become tautological.
