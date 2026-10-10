# Phase 3 — Acceptance Criteria

## Overview
Phase 3 completes the Next.js 14 → 16 upgrade (React 18 initially held per instruction), ESLint 9 migration, and per-phase re-verification.

## Acceptance Criteria (all verified green)
1. `npm install --no-audit --no-fund` resolves to Next **16.4.0** / React **19.3.0** held.
2. ESLint 9 flat config (`eslint.config.mjs`) runs clean via the `eslint` script (no `next lint`).
3. All 9 page files use Next 16 async `searchParams`/`params`.
4. `proxy.ts` exports a function; `middleware.ts` deleted; matcher identical.
5. `tsconfig.json` has no stale dev-types path; `jsx` = react-jsx.
6. React 19 migration: `useFormState` → `useActionState` (removed from react-dom in React 19).
7. `npx prisma generate`, `npm run lint`, `npx tsc --noEmit`, `npm test` (9/9), `npm run build` (21/21 pages + Proxy) all pass.
8. Commit message: `feat(phase-3): upgrade Next 14→16 (React 18 held), async params/searchParams, proxy.ts, ESLint 9` + audit summary.
