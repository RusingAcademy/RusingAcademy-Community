# Tenor credential incident — 2026-07-15

## Confirmed cause

The Community client contained a provider credential in tracked source. Because
the repository and browser bundle are public, the credential must be treated as
exposed even if provider-side restrictions were configured.

The repository had no blocking secret-scan or client-bundle guard. That allowed
the literal to remain on `main` and in Git history after GitHub raised an alert.

## Code containment in this branch

- Browser requests now use an authenticated tRPC procedure.
- The server reads `TENOR_API_KEY`; the client never receives it.
- The proxy fixes the upstream host, validates inputs and responses, times out,
  and applies a per-user request limit.
- Source and built-entry bundles are scanned without printing matched values.
- Gitleaks scans event commit ranges; OSV reports the existing dependency debt.

## Human actions still required

1. Add the replacement credential to the runtime secret store as
   `TENOR_API_KEY` before deployment.
2. Rotate or invalidate the exposed credential and apply least-privilege API and
   referrer restrictions in the provider console.
3. After deployment verification, confirm the GitHub alert can be resolved with
   an accurate resolution reason.
4. Decide whether historical purge is warranted. That is a separate destructive
   operation and is not part of this code-only containment.

Until steps 1–3 are complete, the incident is contained in code but not closed.
