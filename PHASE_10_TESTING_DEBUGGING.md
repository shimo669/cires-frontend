# Phase 10: Testing & Debugging (11 Apr - 17 Apr 2026)

## Objective

Stabilize CIRES frontend behavior with a repeatable testing workflow, improved error visibility, and basic performance hardening for polling-heavy pages.

## Scope Delivered

- Unit testing setup with Vitest
- API utility and report workflow tests
- Improved polling behavior to avoid overlapping network requests
- Documentation for how to run tests and interpret outputs

## Testing Strategy

### 1) Unit Tests (Fast Feedback)

Target critical business logic in isolation:

- API response normalization (`unwrapApiData`, `extractAxiosErrorMessage`)
- Role/level normalization helpers
- Report API behaviors:
  - create payload correctness
  - leader reports endpoint fallback chain
  - reporter confirm/reject payload contracts

### 2) Integration-Like API Contract Checks (Mocked)

Use mocked `axios` instance in unit tests to ensure frontend sends exactly what backend expects.

### 3) Manual Regression Smoke

Before release:

- Login/register with location
- Leader resolve -> pending reporter confirmation
- Reporter approve/reject with rating validation
- Admin sees confirmation fields and ratings

## Error Handling Improvements

- Centralized message extraction via `extractAxiosErrorMessage`
- Clear inline errors for 400 validation cases
- Status-aware message formatting with HTTP code when available

## Performance Fixes Applied

- Added in-flight request guards to prevent overlapping polling calls in:
  - `src/pages/admin/AdminDashboard.tsx`
  - `src/pages/leader/LeaderDashboard.tsx`

This reduces duplicated API requests during slow backend responses.

## New/Updated Commands

```powershell
npm run test
npm run test:run
npm run test:coverage
npm run build
```

## Test Files Added

- `src/api/responseUtils.test.ts`
- `src/api/reportApi.test.ts`

## Sample Test Results

Representative output from this phase execution:

- Unit tests: passing (`vitest run`)
  - Test Files: 2 passed
  - Tests: 9 passed
  - Duration: ~0.8s
- Coverage run: passing (`vitest run --coverage`)
  - Overall statements: 5.02%
  - `src/api/reportApi.ts`: 82.96% statements
  - `src/api/responseUtils.ts`: 72.85% statements
- Production build: passing (`tsc -b && vite build`)
  - Build completed successfully
  - Vite chunk-size warning remains informational

> Note: bundle-size warning from Vite remains informational and does not block build.

## Exit Criteria (Phase 10)

- [x] Core API utility logic has automated tests
- [x] Confirm-and-rate API payloads are validated by tests
- [x] Polling dashboards avoid overlapping requests
- [x] Testing commands and strategy are documented

