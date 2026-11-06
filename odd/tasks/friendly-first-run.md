Objective: make the app friendly for first-time, non-technical users (family) without a redesign.
Branch: feat/friendly-first-run. Delivery strategy: ask-on-risk (forecast ~750 authored lines; ask before push/PR). Test runner: vitest against the local Docker DB (`DATABASE_URL=postgresql://finance:finance@localhost:5433/finance`).

## Specs

- S1: Rounded corners: "ponerle bordes redondeados". Replace base `rounded-none` with radius token classes so `--radius` controls the whole app; keep variant-scoped `rounded-none` (grouped first/last items, sheet sides). Do not regenerate shadcn components (would drop local fixes c94a54b, c1a19c5).
- S2: Accent color: "poner un color de acento claro" / "Me parece bien el verde suave". Soft green for `--primary`, `--ring`, `--sidebar-primary` and the chart palette, light and dark, with readable text contrast on primary buttons.
- S3: First-run setup: new accounts get currency and time zone from the device instead of "USD" / "UTC"; an empty dashboard shows a welcome card that invites logging the first expense with the + button and shows the chosen currency with a link to change it.
- S4: Simple mode on by default: only Panel, Transacciones, Presupuestos and Metas in navigation; advanced modules can be turned on in Configuración. Assumption: existing accounts keep the full navigation (simple mode off) so the owner's current setup does not change.
- S5: First-impression fixes: no "No se pudo generar el resumen. Intenta de nuevo." on an account without transactions; Notifications settings translated; remove the "URL del avatar" field from the profile form; install banner only on the dashboard; no delete icon on every transaction row on the phone (delete stays available inside the transaction); consistent thousands separators ("3800,00" vs "39.794,79"); "Gastos por Categoría" renders on the phone.

## Tasks

- T1 | S1 | inline | done | 2da1500
- T2 | S2 | inline | done | 739f184
- T3 | S3 | inline | done | 2278fb1 | Risk item 2 (sign-up flow: autoSignIn false)
- T4 | S4 | inline | done | 2af99c8 | Risk item 1 (additive migration), own commit; verifier PASS; native review unavailable (budget), delivered on verifier result (L21)
- T6 | S3, S5 | inline | done | b80a4c6 | review follow-ups (digest empty check outside cache)
- T5 | S5 | inline | done | 560877f

## Log

- L1 (2026-11-06): "Hola me ayudas a evaluar un cambio de UI en la app, realmente no es que no me guste lo que hay pero si me parece que es poco amistosa para un usuario que no sea yo, porque queria comenzar a compartir la app a mi familia para que lo pruebe pero no creo que guste de primeras"
- L2 (2026-11-06): "Perdon, no hay bd de pruebas en esta app si quieres la creas con docker y agrego la url al .env.local porque ahora esta la bd de produccion directamente"
- L3: Local DB: Docker container `finance-ux-db` (port 5433). URL passed inline, not in .env.local: Prisma config and seeds use `dotenv/config` (reads only .env, which points to production) and .env.local is not gitignored.
- L4: Evaluation at 390px as a new account and as the seeded user produced the S3–S5 findings. Quick Add drawer already works well and stays unchanged.
- L5 (2026-11-06): "Si me parece bien, igual no modificarias la UI minimamente, tipo detalle de ponerle bordes redondeados y poner un color de acento claro? Igual es un cambio rapido usando shadcn porque se usa su herramienta de creacion y se actualizan todos los compoenntes automaticamente"
- L6: Verified: style `base-lyra` hardcodes `rounded-none` (43/57 ui files, 73 feature files) and `--radius` is already 0.625rem, so the shadcn tool alone would not round anything without overwriting customized components. Chose a class replacement.
- L7 (2026-11-06): "Me parece bien el verde suave"
- L8: Routes: all inline (no Writer trigger: tasks share tokens, layout and i18n files). T4 adds a column, so it gets its own commit and an independent verifier.
- L9: Tests run with a scratch vitest config against `finance_test` in the Docker container (repo guard only accepts the Neon test host; left untouched). Known baseline failure: `categorization.actions.test.ts > suggestCategoryAction > returns the matching rule's category for a description` (getLocale outside request), fails on main too.
- L10: T1/T2: contextual mapping of 101 ui and 121 feature `rounded-none`; soft green hue 158, contrast 5.11 (light button), 8.17 (dark button). Turbopack dev cache served stale CSS after a git stash; cleared `.next/dev`.
- L11: T3: the 5-minute session cookie cache kept "USD" after updating the user, which would misparse CLP amounts (zero-decimal). Fixed with `autoSignIn: false` + preferences saved before `signInEmail`; better-auth stores emails lowercase. Settings currency change keeps the same pre-existing 5-minute staleness (not changed).
- L12: T5: "Gastos por Categoría" renders on the phone (verified 1 sector at 390px); the empty look was a full-page screenshot taken before the animation, no code change. CSV export uses centsToDisplay, unaffected by `useGrouping: "always"`.
- L13: Checks after T5: vitest 501 passed, 1 known baseline failure; tsc clean; eslint errors only in pre-existing code. Review assess main..HEAD: high (hot_path register.action.ts), review START returned consent; T1–T5 reviewed as one slice before T4.
- L14: Independent verifier on S3 + S5 shared code: PASS, no blockers; advisory: empty digest cached 12 h (fixed in b80a4c6).
- L15: Review main..HEAD stopped with lens_context_budget_exceeded (T1 class sweep too large); user approved reviewing 739f184..560877f (T3+T5): risk/readability/reliability, 0 blockers, approved and acknowledged (burned). T1/T2 (2da1500, 739f184) not natively reviewed: class/token-only changes, checked by screenshots.
- L16: b80a4c6 reviewed alone (readability, reliability): approved and acknowledged. Reviewed boundary now b80a4c6.
- L17: T4: users.simpleMode BOOLEAN NOT NULL DEFAULT true, existing rows set false; layout hides alert badge in simple mode; Configuración > Secciones switch. Browser: new account sees 5 sections, switch shows all 13. Suite 507 passed + 1 baseline failure; tsc clean.
- L18: The committed Prisma client lacked PushSubscription.updatedAt (declared in schema since 6fe02d6) and no migration creates push_subscriptions; regenerating picked it up. Production table shape unknown: check it before deploying.
- L19: Independent verifier on S4: PASS, no blockers. Migration applied by `prisma migrate deploy` on a populated copy; users/categories hashes unchanged; existing rows false, new rows true; regenerated client byte-identical to a scratch regeneration. Advisories: apply the migration to production before or with the deploy (`next build` does not migrate); check `push_subscriptions.updatedAt` in production; some in-page links still reach hidden sections (/analytics, /categories, /investments, alert pushes to /alerts), outside S4's navigation scope.
- L20: Native review of 2af99c8 (user approved) stopped with lens_context_budget_exceeded, caused by the regenerated Prisma client; no authority created. Pending: user decision on splitting the commit for review or delivering on the verifier's result.
- L21 (2026-11-06): "Opcion 2 bien" — deliver 2af99c8 on the independent verifier result without splitting it for native review. Next: user decision on push/PR; before deploy apply the migration to production and check `push_subscriptions.updatedAt` there.
