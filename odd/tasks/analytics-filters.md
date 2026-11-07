Objective: make the Analytics filters actually drive the historical charts, with one range picker and extra filters.
Branch: feat/analytics-filters. Delivery strategy: ask-on-risk. Test runner: vitest (DB tests need the Neon test database).

## Specs

- S1: Range picker: "el selector no entiendo porque son 2 date pickers en vez de un solo date picker con rango". One trigger opens a two-month range calendar with the presets inside; add "Este mes" and "Mes pasado" presets; the end day is inclusive.
- S2: The range drives the historical charts: "intente filtrar por el ultimo mes pero solo vi que cambiaba un grafico asi que no sirve mucho ese filtro". Page split into "Período seleccionado" (income vs expenses with day/week/month buckets by range length, spending by category vs the previous period of equal length merging both category comparisons, heatmap, net worth clipped to the range) and "Situación actual" (budget of the month, projection, forecast, health score), which ignores the filter.
- S3: Extra filters: "faltan filtros de otro tipo ... podriamos evaluar cuales aporten algo al analisis". Agreed set: category (several at once, a parent includes its children), payment method or credit card, tag. All filters live in the URL next to the range.

## Tasks

- T1 | S1 | inline | done (unit + typecheck; browser pending)
- T2 | S3 | inline | done (unit + typecheck; browser pending)
- T3 | S2 | inline | done (unit + typecheck; browser pending)

## Log

- L1 (2026-11-07): "Hola me ayudarias con una mejora en el modulo de Analisis, pasa que ingrese e intente filtrar por el ultimo mes pero solo vi que cambiaba un grafico asi que no sirve mucho ese filtro, igualmente el selector no entiendo porque son 2 date pickers en vez de un solo date picker con rango. Fuera de eso faltan filtros de otro tipo, no se me ocurre cuales ahora pero podriamos evaluar cuales aporten algo al analisis"
- L2 (2026-11-07): Proposal (two sections, range picker, category + method/card + tag filters) answered: "Si me parece todo bien".
- L3: Route inline for all tasks: one page and its queries, no Writer trigger. Dates are stored as UTC midnight, so range bounds are UTC days.
- L4: One commit for the three tasks: queries, page and filters change together and each slice alone would not compile. Pure range/filter logic covered by 20 unit tests (GREEN after RED on missing module); DB query tests updated for the new signatures but not run, the Neon test database is unreachable. Browser check blocked: the dev database has no seeded test user.
