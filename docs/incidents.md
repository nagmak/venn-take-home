# Incident log

Bugs that reached `master`, what fixed them, and which check should have caught them.

## 2026-11-11: Corporation check and submit messages (PR #9)

Found by a `/code-review` run after PR #9 was merged. Fixed on `fix/review-findings`.

| Bug | Caused by | Fixed by |
| --- | --- | --- |
| A cancelled corporation check counted as valid, so a submit sharing it could POST a number the API never confirmed | `4a1b039` | `0fa634d` |
| Returning to an already-checked number left "Checking…" showing and hid the field's error | `4a1b039` | `2401847` |
| After a success, a submit that failed validation showed the success and fix-fields messages together | `122c766`, `5ad17a8` | `f35263f` |
| After a 400, fixing the fields brought the old API message back without resubmitting | `122c766`, `5ad17a8` | `f35263f` |

**Which check should have caught it:** a fresh-context code review before merging. PR #9 was Medium tier, which calls for an AI review pass before merge; the review ran only after the merge. The tests covered each behaviour on its own path (blur, submit), but not the combinations: a check cancelled while a submit shared it, a cache hit while another number was in flight, and a failed submit after an earlier result.

**Missing check to add:** run `/code-review` on every Medium or High PR before it merges, and add regression tests for interactions between async paths (blur + submit, cache + in-flight request, consecutive submits), not only each path on its own.
