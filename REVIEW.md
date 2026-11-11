# Review guide

What a reviewer of this repo should check. Style is the linter's job, so don't report it.

## What failure means here

- A corporation number the API never confirmed must never be treated as valid or submitted.
- The form must never show a message that's no longer true: a stale error, an old submit result, or "Checking…" for a number the field no longer holds.
- Docs must not contradict the code.

## Rules learned from past bugs

See [docs/incidents.md](docs/incidents.md).

- **Use a well-tested library for caching and request sharing; don't hand-roll it.** A hand-written version of the corporation check produced a new async bug in every review cycle until it was replaced with TanStack Query.
- **When adopting a library, check its defaults against the behaviour it replaces.** TanStack Query pauses requests while the browser is offline by default; the hand-written check failed at once with a message, so the query sets `networkMode: 'always'`.
- **Never cancel a shared or cached request on behalf of one caller.** Other callers may be waiting on it and would get a cancelled result. To ignore an outdated answer, discard it where it's used; react-hook-form already does this for blur results.
- **Check interactions between async paths**, not only each path alone: blur + submit, cache hit + request in flight, the value changing during a check, consecutive submits.
- **Tests wait for an observable outcome**, never a fixed delay. To hold a mocked response, use a gate the test opens (`src/test/gate.ts`, `holdCorporationChecks`). To assert that a late answer is ignored, wait for `waitForCheckHandled`. `npm run lint` enforces this (`test-rules/no-fixed-delay`).

## How to report

- Open with a summary: the number of findings, or "No issues".
- Label each finding **Important**, **Nit** or **Pre-existing**, and cite file and line.
- Report the class of bug, so every instance gets fixed.

## Ignore

`dist/`, `node_modules/`, `package-lock.json`.
