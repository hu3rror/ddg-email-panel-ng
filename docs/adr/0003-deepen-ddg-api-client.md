# Deepen the DDG API client module: typed result discriminated union

`src/core/ddg/client.ts` used to be 4 thin `fetch` wrappers returning `Promise<Response>` — interface width ≈ implementation, i.e. a shallow module. Every caller (3 Edge route handlers + the hook) had to parse upstream errors, detect RC challenges, and extract tokens on its own.

We decided: **deepen the client module, using a `DdgResult<T>` discriminated union as the unified return type.**

## Concrete design

- **Type**: `DdgResult<T> = { ok: true; data: T } | { ok: false; error: DdgError }`
- **Error variants**: `network_error`, `api_error` (with status), `rc_challenge` (with the challenge structure), `parse_error`
- **Entry points**: reduced from 4 functions to 3 — `requestLoginLink`, `loginWithOtpTwoStage` (composes the two stages), `generateAddresses`
- **Error→HTTP mapping**: `network_error`→502, `api_error`→pass through status, `rc_challenge`→429, `parse_error`→500

## Alternatives considered

- **Throw exceptions**: route handlers would need try/catch around their logic, and recoverable errors like an RC challenge are hard to distinguish from network errors. Rejected.
- **Class + injectable HttpClient port**: introduces a "hypothetical seam" (there is only one `globalThis.fetch` adapter), violating the principle that one adapter is hypothetical and only two are real. Rejected.
- **Minimal 2-function interface**: `authenticate()` + `generateAlias()`, but `authenticate` is too coarse-grained to match the current two-step UI (sendOtp → user input → verifyOtp). Rejected.

## Consequences

- Route handlers shrank from ~60 lines to ~15–20, doing only three things: validate input → call the client → serialize the response
- RC challenge detection is no longer scattered across the route layer; it is centralized inside `requestLoginLink`
- Two-stage OTP orchestration (login → dashboard) moved from the route layer into the client; `login/route.ts` no longer needs to know the temporary-token exchange details
- Test strategy change: the client module is tested standalone with a mocked `fetch`; route tests mock the client module instead of `global.fetch`
- Added `src/core/ddg/client.test.ts` (15 tests) covering all 4 error variants
