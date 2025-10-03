# Task: Integrate Cryptonator safety checks

## Background
Storgbay currently lacks automated cryptocurrency risk assessment before users proceed with wallet-related actions. To reduce fraud exposure, the platform should consult a reputable third-party service, such as Cryptonator, to validate rates or detect suspicious wallets prior to completing sensitive flows.

## Objective
Introduce a server-side Cryptonator integration that protects Storgbay users by screening cryptocurrency data and exposing only sanitized results to authenticated clients.

## Requirements
- Add environment variables (e.g., base URL, API key) to `.env.example` to document the necessary Cryptonator configuration.
- Implement a `src/lib/cryptonator.ts` helper that wraps outbound requests, enforces HTTPS, validates responses, and normalizes errors.
- Create an authenticated API route (for example `src/app/api/security/cryptonator/route.ts`) that consumes the helper, ensures callers have an active session, and returns minimal, safe data for the UI.
- Update the relevant UI workflow (such as a dashboard warning or payment modal) to call the protected endpoint and block risky actions when Cryptonator indicates a problem.
- Add unit or integration tests covering the helper and route to guard against regressions and handle upstream failures gracefully.

## Implementation Notes
- Mirror the existing patterns from the S3 helper and upload API route to keep third-party credentials server-only and cached between requests.
- Consider response caching or rate limiting if Cryptonator imposes request quotas.
- Centralize mapping of Cryptonator error codes to user-friendly messages so the UI can communicate issues clearly without leaking sensitive details.

## Open Questions
- Which specific Cryptonator endpoints provide the necessary risk metrics or rate validation for Storgbay flows?
- What timeout and retry policies balance user experience with protection against slow or unreliable upstream responses?
- Should certain Cryptonator signals trigger alerts or logging beyond simply blocking the user action?

## Definition of Done
- New environment variables, helper, route, and UI surfaces are implemented and documented.
- Automated tests cover success, failure, and edge-case responses from Cryptonator.
- Security review confirms that no sensitive Cryptonator credentials or raw responses leak to the client.
