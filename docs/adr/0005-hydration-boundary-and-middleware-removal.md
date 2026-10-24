# HydrationBoundary component + remove dead middleware

Two independent architecture cleanups, recorded in one ADR.

## HydrationBoundary component

Three components (`AccountSwitcher`, `AccountManager`, `EmailDashboard`) each duplicated the same hydration-gating pattern: `useHydrated()` → `if (!hydrated) return <Skeleton />`. Each skeleton differs in structure, but the gating logic is identical.

We decided: **create a shared `HydrationBoundary` component that encapsulates the hydration-gating logic.**

### Interface

```tsx
<HydrationBoundary fallback={<Skeleton />}>
  <RealContent />
</HydrationBoundary>
```

### Consequences

- `useHydrated` call sites reduced from 3 to 1 (inside `HydrationBoundary`)
- Each component keeps its own skeleton JSX (the structures differ too much for a shared Skeleton component)
- `EmailDashboard` extracted a `DashboardContent` sub-component to avoid variable-declaration-timing issues
- Hydration tests needed no changes — `HydrationBoundary` uses `useHydrated` internally, so the existing mocks still work

## Remove the dead middleware module

`src/middleware.ts` only called `NextResponse.next()` — a pure no-op. Its `config.matcher` matched all non-API routes, which is misleading to anyone reading the file.

We decided: **delete `src/middleware.ts` outright.**

### Alternatives considered

- **Keep the file as a commented skeleton**: a placeholder for future use. Rejected — when middleware is genuinely needed, writing from scratch is safer than modifying a no-op, and the `matcher` config won't be silently carried over.

### Consequences

- The build output no longer contains `ƒ Middleware  34.2 kB`
- No other references in the codebase need cleaning up
- When an auth guard or redirect is needed in the future, create a new `middleware.ts` from scratch
