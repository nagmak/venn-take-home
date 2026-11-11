# Review guide

What a reviewer of this repo should check. Style is the linter's job, so don't report it.

## What failure means here

- A corporation number the API never confirmed must never be treated as valid or submitted.
- The form must never show a message that's no longer true: a stale error, an old submit result, or "Checking…" for a number the field no longer holds.
- Docs must not contradict the code.

## Rules learned from past bugs

See [docs/incidents.md](docs/incidents.md).

- **Never cancel a shared or cached promise on behalf of one caller.** Other callers may be waiting on it and would get a cancelled result. This came up in three review cycles in a row. To ignore an outdated answer, discard it where it's used; react-hook-form already does this for blur results.
- **Check interactions between async paths**, not only each path alone: blur + submit, cache hit + request in flight, the value changing during a check, consecutive submits.
- **Tests wait for an observable outcome**, never a fixed delay. `npm run lint` enforces this (`test-rules/no-fixed-delay`); `delay()` is only allowed inside MSW handlers.

## How to report

- Open with a summary: the number of findings, or "No issues".
- Label each finding **Important**, **Nit** or **Pre-existing**, and cite file and line.
- Report the class of bug, so every instance gets fixed.

## Ignore

`dist/`, `node_modules/`, `package-lock.json`.
