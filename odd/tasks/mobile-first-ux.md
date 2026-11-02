Objective: polish the app UI/UX phone-first, keeping desktop for analysis.
Branch: feat/mobile-first-ux. Delivery strategy: ask-on-risk. Test runner: vitest (DB tests need the Neon test database).

## Specs

- S1: "priorizar el telefono porque es donde se usara mas, desktop es para analisis mas que nada".
- S2: Fast capture: Quick Add category and payment pickers work on the phone, one add entry point, install prompt shown once and translated.
- S3: Navigation: grouped into Día a día, Planificar, Patrimonio, with settings apart; bottom bar on mobile with four destinations.
- S4: Dashboard: leads with how much is left this month and progress against budget, then recent transactions, the rest compact.
- S5: Transactions and categories: search and filters in one bar applied immediately, fewer columns, categories separated by type.
- S6: Visual base: one radius, type and spacing scale, color only for meaning, remaining translations finished.

## Tasks

- T1 | S2 | inline | done | c1a19c5
- T2 | S3 | inline | done | c1a19c5
- T3 | S4 | inline | done | 68e5a24
- T4 | S5 | inline | done | 68e5a24
- T5 | S6 | inline | done | 68e5a24

## Log

- L1 (2026-11-02): "No tengo nada mas especifico realmente, le daria una pulida a la UI/UX principalmente porque puede que haya mucha cosa y podria ser mas eficiente a nivel de uso y mejor a nivel visual"
- L2 (2026-11-02): "Creo lo mismo, priorizar el telefono proque es donde se usara mas, desktop es para analisis mas que nada"
- L3: Route inline for all tasks: no Writer trigger, tasks share the layout and tokens. Category work committed first on this branch.
- L5: Native review on request: reliability lens found the stale desktop Type header, fixed in e9fcfa8 and approved.
- L4: Verified in browser at 390px: Quick Add saved with picked category and method, search, Limpiar, Más menu, categories by type; desktop dashboard at 1440px. Hero budget mode covered by unit tests only, demo data has no budgets. Full vitest suite blocked by unreachable Neon test database.
