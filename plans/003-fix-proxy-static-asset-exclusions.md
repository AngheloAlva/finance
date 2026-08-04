# Plan 003: Stop the proxy from redirecting PWA/static assets to the login page

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a28a365..HEAD -- src/proxy.ts`
> On mismatch with the excerpt below, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/000-restore-typecheck-baseline.md (for the tsc gate)
- **Category**: bug
- **Planned at**: commit `a28a365`, 2026-08-03

## Why this matters

Every page load logs `Manifest: Line: 1, column: 1, Syntax error.` — the browser requests `/manifest.webmanifest`, the auth proxy redirects it to `/en/login?callbackUrl=%2Fmanifest.webmanifest` (confirmed in dev server logs), and the browser tries to parse the login page's HTML as JSON. The PWA manifest never loads, and the same fate hits the service worker (`/sw.js`) and the SVGs in `public/`. Install-to-home-screen and offline behavior are silently broken.

## Current state

`src/proxy.ts` (Next middleware; full file is 65 lines):

```ts
const IGNORED_PATHS = [
  "/api",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
];

function isIgnoredPath(pathname: string) {
  return IGNORED_PATHS.some((path) => pathname.startsWith(path));
}
// ...
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

Neither the runtime list (lines 10-15) nor the matcher (line 64) excludes `manifest.webmanifest`, `sw.js`, or other `public/` files. Files that exist in `public/` at this commit: `file.svg`, `globe.svg`, `next.svg`, `sw.js`, `vercel.svg`, `window.svg` — plus Next serves `/manifest.webmanifest` from the app router (check `rg -n "manifest" src/app --files-with-matches` — a `manifest.ts`/`manifest.webmanifest` route exists under `src/app`).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Dev server | `pnpm dev`              | Ready on :3000      |
| Manifest check | `curl -s -o /dev/null -w "%{http_code} %{content_type}" http://localhost:3000/manifest.webmanifest` | `200 application/manifest+json` (or `application/json`) |
| SW check  | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sw.js` | `200` |

## Scope

**In scope**:
- `src/proxy.ts`

**Out of scope**:
- `public/*` contents, the manifest route itself, auth logic, locale handling. This plan only widens the exclusion list.

## Git workflow

- Branch: `advisor/003-fix-proxy-static-asset-exclusions`
- Conventional commit, e.g. `fix(proxy): exclude manifest, sw and public assets from i18n/auth middleware` (mirrors existing commit `7fee1f1 fix(proxy): exclude all api routes from i18n middleware`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Widen both exclusion points

In `src/proxy.ts`, keep the runtime list and the matcher in sync:

1. Add to `IGNORED_PATHS`: `"/manifest.webmanifest"`, `"/sw.js"`.
2. Replace the matcher with a pattern that also skips any path containing a file extension (covers current and future `public/` assets), the standard Next-intl-compatible shape:

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\..*).*)",
  ],
};
```

Note the `.*\\..*` tail — it excludes every dotted filename (e.g. `/globe.svg`). App routes in this repo never contain dots (verify: `eza src/app --tree | rg "\."` shows only file names, not route segments), so this is safe.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Prove assets bypass auth

Restart `pnpm dev` (middleware config changes need a restart), then in a logged-OUT context (no cookies — plain curl):

**Verify**:
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/manifest.webmanifest` → `200` (was a 307/302→login before)
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sw.js` → `200`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/globe.svg` → `200`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/transactions` → still a redirect (`3xx`) to login — auth must keep protecting real pages.

### Step 3: Prove the console error is gone

Open the app in a browser, log in, open DevTools console on the dashboard.

**Verify**: no `Manifest: … Syntax error` entry.

## Test plan

No unit tests — middleware matchers aren't covered by the current Vitest setup. The curl matrix in Step 2 is the regression gate; record the four status codes in your report.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] All four curl checks in Step 2 return the expected codes
- [ ] No files outside `src/proxy.ts` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `src/proxy.ts` doesn't match the excerpt (drift).
- Excluding dotted paths breaks any existing route (a page stops rendering after the change) — report which route contains a dot.
- `/en/transactions` stops redirecting for anonymous users (auth hole) — revert and report.

## Maintenance notes

- The runtime `IGNORED_PATHS` and the `config.matcher` are two copies of the same policy; they MUST stay in sync. A future refactor could derive one from the other.
- If a locale-prefixed manifest is ever added (`/en/manifest.webmanifest`), revisit — the current exclusion is root-only.
