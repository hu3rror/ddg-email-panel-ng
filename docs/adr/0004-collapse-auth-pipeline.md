# Collapse auth pipeline into a single module

`src/core/hooks/use-auth.ts` used to hold the full auth logic: schema validation, duplicate checks, API calls, and store persistence. But this logic was scattered across 3 modules (`schemas/auth.ts`, `store/account.ts`, `hooks/use-auth.ts`), so understanding the whole flow required jumping across 3 files.

We decided: **extract a pure logic layer into `src/core/auth/index.ts`, making `useAuth` a thin React adapter.**

## Concrete design

- **New module** `src/core/auth/index.ts`: 3 pure async functions `sendOtp`, `verifyOtp`, `loginWithToken`, returning `AuthResult` or `AuthWithAccountResult` types
- **Each function takes explicit dependencies**: `existingAccounts: Account[]` as a parameter, with no Jotai/React dependencies
- **`useAuth` hook**: shrank from ~140 lines to ~30, responsible only for React state management (a status/error state machine + store persistence)
- **Return shape**: `{ success: true } | { success: false; error: string }`, consistent with the `DdgResult` style

## Alternatives considered

- **Merge files only**: inline the schema imports and store calls into `use-auth.ts`, reducing file jumping without changing the architecture. Rejected, because the core logic still could not be tested independently of React.
- **Core module takes store-setter callbacks**: lets the core module write to the Jotai store directly. Rejected — the core module should stay pure and not depend on the React ecosystem.

## Consequences

- Core logic can be tested directly without React/JSDOM, so tests are faster (14 direct function-call tests)
- `useAuth` tests shrank from 9 to 7, verifying only state-machine transitions and store persistence
- Added `src/core/auth/index.test.ts` (14 tests), mocking `fetch`
- The three schema definitions stay in `schemas/auth.ts`, shared by the route layer and the core module
- `LoginForm` unchanged — `useAuth`'s public interface is unchanged
