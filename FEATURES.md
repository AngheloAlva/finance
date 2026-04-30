# Finance — Mapa de Features

App de finanzas personales y grupales construida con Next.js 16 (App Router), Prisma 7 + Postgres, Better Auth, next-intl y shadcn/ui. Soporta multi-moneda, multi-zona horaria y multi-locale.

El objetivo del proyecto: **dejar de adivinar a fin de mes**. Que el usuario sepa cuánto entra, cuánto sale, cuánto va a salir, y cuánto le queda — solo o compartido con otros — sin tener que armar planillas a mano.

---

## 1. Autenticación y cuenta

**Qué hace:** registro/login con Better Auth, sesiones persistentes, perfil con moneda, zona horaria e imagen.

**Casos de uso:**
- Crear una cuenta y empezar a registrar movimientos en tu moneda local (USD por default, configurable).
- Mantener sesión entre dispositivos.
- Cambiar moneda/timezone desde Settings cuando viajás o te mudás.

**Estado:** ✅ usable end-to-end.

---

## 2. Transacciones

**Qué hace:** registro de ingresos, egresos y transferencias. Cada transacción tiene `date` (cuándo ocurrió) e `impactDate` (cuándo impacta tu plata — clave para tarjeta de crédito y cuotas). Soporta método de pago (CASH, DEBIT, CREDIT, TRANSFER, OTHER), categoría obligatoria, notas, tags y splits para compartir gastos.

**Casos de uso:**
- Registrar el café de hoy en efectivo.
- Cargar la compra del super pagada con tarjeta de crédito en 6 cuotas → el sistema arma las 6 transacciones futuras con su `impactDate` correcto.
- Marcar la transferencia que le hiciste a un amigo y dividirla.

**Estado:** ✅ núcleo del proyecto, totalmente funcional.

---

## 3. Categorías (jerárquicas)

**Qué hace:** árbol de categorías con scope SYSTEM / GROUP / USER, ícono, color, threshold de alerta, flags `isRecurring` e `isAvoidable`. Categorías padre/hijo.

**Casos de uso:**
- "Comida" como padre, "Delivery" e "Super" como hijos → mirás el total agregado o el desglose.
- Marcar "Delivery" como `isAvoidable` para después medir cuánto gastás en cosas evitables.
- Threshold por categoría: que te avise cuando te pasaste del límite mensual de "Salidas".

**Estado:** ✅ funcional, con seed de categorías base.

---

## 4. Tarjetas de crédito

**Qué hace:** modelado de tarjetas con día de cierre, día de vencimiento, límite. Cada gasto con `paymentMethod = CREDIT` se asocia a una tarjeta y se calcula en qué resumen cae.

**Casos de uso:**
- "Si compro hoy 25 de abril, ¿cae en el resumen de mayo o de junio?" — el sistema te lo dice por la `impactDate`.
- Ver cuánto te falta para llegar al límite.
- Cuotas: una compra en 12 cuotas se ve como 12 movimientos futuros con su `installmentNumber`.

**Estado:** ✅ funcional, integrado con transacciones, recurring y alertas.

---

## 5. Gastos recurrentes

**Qué hace:** plantillas que generan transacciones automáticamente (AUTO) o que te las sugieren (SUGGEST). Frecuencias DAILY → ANNUAL, con BIWEEKLY, BIMONTHLY, QUARTERLY, SEMIANNUAL incluidas.

**Casos de uso:**
- Sueldo mensual → AUTO, aparece sin que toques nada.
- Netflix, alquiler, expensas, cuota del gimnasio.
- Algo dudoso (ej. "el plomero dijo que viene cada 3 meses") → SUGGEST, te aparece para confirmar.

**Estado:** ✅ funcional con dos modos de generación.

---

## 6. Presupuestos (Budgets)

**Qué hace:** límite de gasto por categoría y período (mensual típicamente). Compara contra los gastos reales.

**Casos de uso:**
- "Quiero gastar máximo USD 200 en delivery este mes" — el budget te muestra el progreso y dispara alertas (BUDGET_WARNING / BUDGET_EXCEEDED).
- Planificar mes próximo basándote en lo que gastaste el mes pasado.

**Estado:** ✅ funcional con alertas integradas.

---

## 7. Alertas

**Qué hace:** sistema de notificaciones internas con severidad (INFO/WARNING/CRITICAL) y status (PENDING/READ/DISMISSED). Tipos disponibles:

- Categoría: threshold excedido, gasto inusual.
- Tarjeta: uso alto, vencimiento próximo.
- Goals: milestone, deadline, completada.
- Riesgo financiero: balance negativo, sobrecarga futura, exceso de cuotas, falta de ingresos.
- Inversiones: cambio significativo.
- Budgets: warning y exceeded.

**Casos de uso:**
- "Te quedan 5 días para vencimiento de Visa y todavía no la pagaste."
- "Tus cuotas futuras superan el 70% de tu ingreso mensual proyectado."
- "Gastaste 3x más en restaurantes que el promedio histórico."

**Estado:** ✅ los tipos están modelados y dispuestos a engancharse a flujos.

---

## 8. Goals (objetivos de ahorro)

**Qué hace:** objetivos con monto target, deadline opcional, contribuciones puntuales. Status ACTIVE / COMPLETED / CANCELLED.

**Casos de uso:**
- "Juntar USD 3000 para vacaciones a fin de año" → cargás contribuciones, ves progreso, te avisa al 50/75/100%.
- Goal compartido con un grupo (ej. fondo común con tu pareja).

**Estado:** ✅ funcional con alertas de milestone/deadline.

---

## 9. Inversiones

**Qué hace:** registro de inversiones por tipo (STOCKS, BONDS, CRYPTO, REAL_ESTATE, FUND, SAVINGS, OTHER) con tracking de valor.

**Casos de uso:**
- Llevar el control del portfolio sin entrar a 5 apps distintas.
- Alerta cuando algo se mueve un % significativo.
- Sumar al patrimonio total.

**Estado:** ✅ modelo y CRUD presentes; el pricing en vivo no está integrado (entrada manual).

---

## 10. Grupos y finanzas compartidas

**Qué hace:** grupos con roles (OWNER/ADMIN/MEMBER), invitaciones por email (PENDING/ACCEPTED/EXPIRED), categorías compartidas, transacciones grupales con splits (EQUAL, PROPORTIONAL, CUSTOM).

**Casos de uso:**
- Pareja que quiere ver gastos del hogar separados de los personales.
- Roommates que dividen alquiler y servicios — el sistema calcula quién le debe a quién.
- Viaje entre amigos: cargás los gastos en el grupo y al final ves saldos.

**Estado:** ✅ uno de los puntos diferenciales del proyecto, totalmente funcional.

---

## 11. Tags

**Qué hace:** etiquetas libres además de categoría. Una transacción puede tener varios tags.

**Casos de uso:**
- Tag "viaje-bariloche-2026" para después filtrar todo lo gastado en ese viaje, sin importar la categoría.
- Tag "reembolsable" para gastos del laburo que después te devuelven.

**Estado:** ✅ funcional.

---

## 12. Categorización automática (rules)

**Qué hace:** reglas que matchean por descripción (EXACT / CONTAINS / STARTS_WITH) y asignan categoría automáticamente. También sugerencias inline al cargar una transacción.

**Casos de uso:**
- Regla: "si la descripción contiene 'Mercadopago Spotify' → categoría Suscripciones."
- Cargar la próxima compra y que el form te sugiera la categoría basándose en el historial.

**Estado:** ✅ funcional, commit reciente (`eaa3d33`).

---

## 13. Analytics

**Qué hace:** métricas, gráficos (recharts), comparativas. Incluye **proyección de cashflow a 30/60/90 días** basada en recurrentes + cuotas + budgets.

**Casos de uso:**
- "¿Cuánta plata voy a tener el 1 de junio si todo sigue como va?"
- Comparar este mes vs. el anterior por categoría.
- Identificar la categoría que más creció.

**Estado:** ✅ proyección agregada en commit reciente (`1d2e391`).

---

## 14. Simulaciones (what-if)

**Qué hace:** escenarios hipotéticos para ver el impacto antes de comprometerte.

**Casos de uso:**
- "Si tomo este plan de auto en 36 cuotas de X, ¿cómo queda mi cashflow?"
- "Si cancelo Netflix y HBO, ¿cuánto ahorro al año?"
- "Si me aumentan el sueldo 15%, ¿qué pasa con mis goals?"

**Estado:** ✅ módulo presente, base de feature avanzada.

---

## 15. Export

**Qué hace:** export a CSV de transacciones con filtros aplicados, vía route handler `/api/export`.

**Casos de uso:**
- Bajar el detalle del año para hacer impuestos.
- Pasar datos a una planilla para análisis ad-hoc.
- Backup manual.

**Estado:** ✅ funcional (commit `1861f4a`).

---

## 16. Dashboard configurable

**Qué hace:** layout con widgets drag-and-drop (`@dnd-kit`), config persistida en `User.dashboardConfig` (JSON).

**Casos de uso:**
- Cada usuario arma su home con los widgets que más usa: balance, próximos vencimientos, top categorías, cashflow proyectado, etc.
- Reordenar y guardar sin tocar código.

**Estado:** ✅ commit reciente (`b4d33d9`).

---

## 17. Settings y preferencias

**Qué hace:** moneda, timezone, perfil, configuración de cuenta.

**Casos de uso:** ajustar el contexto del usuario (clave para fechas/tarjetas).

**Estado:** ✅ funcional.

---

## 18. i18n (internacionalización)

**Qué hace:** rutas con `[locale]`, `next-intl`, layouts separados para auth y dashboard.

**Casos de uso:** abrir en español o inglés según el navegador.

**Estado:** ✅ infraestructura lista; cobertura de mensajes depende de cuánto traduciste.

---

# Veredicto: ¿qué se puede usar HOY?

**Listo para uso real (single user):**
- Cargar y categorizar transacciones, manejar tarjetas con cuotas, recurrentes, budgets, goals, alertas, dashboard personalizado, export.

**Listo para uso compartido:**
- Grupos con splits, categorías de grupo, goals grupales.

**Diferenciales que no tiene la competencia básica:**
1. `impactDate` separado de `date` → cashflow real, no contable.
2. Cuotas modeladas como N transacciones futuras (no como un solo gasto inflado).
3. Proyección de cashflow 30/60/90 que mezcla recurrentes + cuotas + budgets.
4. Splits con tres reglas (EQUAL / PROPORTIONAL / CUSTOM).
5. Categorización automática por reglas.

**Pendiente / oportunidades:**
- Pricing automático de inversiones (hoy es entrada manual).
- Notificaciones push/email reales (las alertas viven en la DB, falta el canal de delivery).
- Conexión con bancos / scraping de movimientos (todo es entrada manual hoy).
- Mobile app o PWA polish.
- Tests (no se ven en `package.json`).

---

**Stack:** Next.js 16.1.6 · React 19.2 · Prisma 7.5 + Postgres · Better Auth 1.5 · next-intl 4 · shadcn/ui · Tailwind 4 · Zod 4 · Recharts · @dnd-kit.
