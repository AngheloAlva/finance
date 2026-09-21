# Finance

A personal and shared finance tracker — **stop guessing at the end of the month.**

Finance answers four questions without a spreadsheet: how much comes in, how much goes out, how much is *going* to go out, and how much is left — for you alone or shared with other people.

---

## Why this exists

Most budget apps record what already happened. That tells you where your money went, not where it is heading.

The real problem is at month end: the credit card statement arrives, three installments you forgot about land at once, and the salary is already spent. The recurring expenses are the ones you never see coming, because they were never in today's balance.

Finance models the future as first-class data. Every expense carries both *when it happened* and *when it hits your money*, installments are real future transactions, and recurring expenses are projected forward. The result is a cashflow view that includes commitments you have not paid yet.

## What makes it different

1. **`impactDate` is separate from `date`.** A purchase today paid with a credit card whose cycle closes on the 25th impacts your cash in the *next* statement. Finance knows the difference between the accounting date and the cash date — which is what actually determines whether you can pay for something.
2. **Installments are modeled as N future transactions**, not one inflated expense. A 12-installment purchase appears as 12 dated movements with their own `installmentNumber` and `impactDate`. No phantom balances, no manual mental math.
3. **A 30/60/90-day cashflow projection** that combines recurring expenses, pending installments, and budgets into a single forward balance.
4. **Shared finances with three split rules** — `EQUAL`, `PROPORTIONAL`, and `CUSTOM` — so a household or a group trip settles without a side spreadsheet.
5. **Automatic categorization by rules** (exact, contains, starts-with), plus inline suggestions while you type a transaction.

## What it does

Detailed per-feature status and use cases live in **[FEATURES.md](./FEATURES.md)**. Summary:

### Foundations
- **Accounts and authentication** — session-based email/password auth with a per-user currency, timezone, and profile. ([details](./FEATURES.md#1-autenticación-y-cuenta))
- **Multi-currency, multi-timezone, multi-locale** — English and Spanish, with locale-prefixed routes. ([details](./FEATURES.md#18-i18n-internacionalización))

### Money in and out
- **Transactions** — income, expense, and transfer, with payment method, mandatory category, notes, and tags. ([details](./FEATURES.md#2-transacciones))
- **Hierarchical categories** — `SYSTEM` / `GROUP` / `USER` scopes, parent-child trees, per-category alert thresholds, and `isRecurring` / `isAvoidable` flags. ([details](./FEATURES.md#3-categorías-jerárquicas))
- **Credit cards** — closing day, due day, and limit, with automatic statement-cycle assignment. ([details](./FEATURES.md#4-tarjetas-de-crédito))
- **Recurring expenses** — templates that either generate transactions automatically (`AUTO`) or suggest them for confirmation (`SUGGEST`), from daily to annual. ([details](./FEATURES.md#5-gastos-recurrentes))
- **Tags** — free-form labels that cut across categories, for things like a specific trip or reimbursable work expenses. ([details](./FEATURES.md#11-tags))

### Planning
- **Budgets** — spending limits per category and period, compared against real spending, with warning and exceeded alerts. ([details](./FEATURES.md#6-presupuestos-budgets))
- **Goals** — savings targets with optional deadlines and contributions, personal or shared with a group. ([details](./FEATURES.md#8-goals-objetivos-de-ahorro))
- **Investments** — portfolio tracking by asset type with value snapshots. ([details](./FEATURES.md#9-inversiones))
- **Simulations (what-if)** — model a new installment plan, a cancelled subscription, or a raise before committing to it. ([details](./FEATURES.md#14-simulaciones-what-if))

### Insight
- **Analytics** — charts, period comparisons, and the 30/60/90-day cashflow projection. ([details](./FEATURES.md#13-analytics))
- **Alerts** — severity- and status-tracked notifications across categories, cards, budgets, goals, investments, and financial risk. ([details](./FEATURES.md#7-alertas))
- **Configurable dashboard** — drag-and-drop widgets persisted per user. ([details](./FEATURES.md#16-dashboard-configurable))
- **CSV export** — export transactions honoring the filters currently applied. ([details](./FEATURES.md#15-export))

### Smart input
- **Receipt and payment-screenshot scanning** — upload an image, and a vision model extracts amount, description, date, and payment method, including Latin American and European number formats (`$30.000` vs `$1.250,50`).
- **Rule-based categorization** — description-matching rules assign categories automatically, and the transaction form suggests one from your history. ([details](./FEATURES.md#12-categorización-automática-rules))

### Shared
- **Groups and shared finances** — `OWNER` / `ADMIN` / `MEMBER` roles, email invitations, shared categories, group transactions with splits, and group goals. ([details](./FEATURES.md#10-grupos-y-finanzas-compartidas))

## How it is built

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) · React 19 |
| Language | TypeScript 5, strict mode |
| Database | PostgreSQL via Prisma 7 with the `@prisma/adapter-pg` driver adapter — 22 models |
| Auth | Better Auth 1.5, email/password with server-side sessions |
| UI | shadcn/ui on Base UI primitives · Tailwind CSS 4 · Lucide · Recharts · `@dnd-kit` |
| Internationalization | next-intl 4 — `en` (default) and `es` |
| Validation | Zod 4, shared between server actions and forms |
| AI | Vercel AI SDK 6 with Moonshot vision, for receipt extraction |
| Notifications | Web Push (`web-push`) behind a PWA service worker and manifest |
| Tests | Vitest 4 — 51 test files against a real Postgres instance |

The codebase is organized **feature-first**: `src/features/<feature>/{actions,components,lib,types}` holds each domain's server actions, UI, and queries together, while `src/shared/` holds cross-cutting concerns (Prisma client, formatters, auth helpers, shared components) and `src/components/ui/` holds the shadcn/ui primitives.

## Status

**Working today:** transactions, credit cards with installments, recurring expenses, budgets, goals, alerts, the configurable dashboard, analytics with cashflow projection, simulations, CSV export, groups with splits, and receipt scanning.

**Not there yet:** live investment pricing (values are entered manually), bank connections or statement imports (all data entry is manual), and a native mobile app.

`FEATURES.md` is the authoritative per-feature catalog, including a candid assessment of what is production-ready and what is scaffolded.

## Documentation

| Document | Contents |
|---|---|
| [FEATURES.md](./FEATURES.md) | The full feature map: what each feature does, use cases, and its current status. |
| [plans/](./plans/README.md) | Implementation plans from the last code audit and browser walkthrough, with per-plan status. |
