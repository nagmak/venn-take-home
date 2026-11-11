# Incident log

Bugs that reached `master`, what fixed them, and which check should have caught them.

## 2026-11-11: Corporation check and submit messages (PRs #8 and #9)

Found by two `/code-review` runs after PR #9 was merged. Fixed on `fix/review-findings`.

| Bug | Caused by | Fixed by |
| --- | --- | --- |
| A cancelled corporation check counted as valid, so a submit sharing it could POST a number the API never confirmed | `4a1b039` | `0fa634d`, `8c9e045` |
| Returning to an already-checked number left "Checking…" showing and hid the field's error | `4a1b039` | `2401847` |
| "Checking…" replaced the field's real error when the value changed to an empty or badly formatted number while another check was in flight | `4a1b039` | `5565546` |
| After a success, a submit that failed validation showed the success and fix-fields messages together | `122c766`, `5ad17a8` | `f35263f` |
| After a 400, fixing the fields brought the old API message back without resubmitting | `122c766`, `5ad17a8` | `f35263f` |
| The previous submit result stayed visible while a new submit was still validating (e.g. waiting on a slow corporation check) | `54ef532` | `2f288dc` |
| A pending corporation check kept running after the form unmounted | `7f24390` | `12d1786` |
| `TextField` treated `error=""` as an error: the hint was dropped and the message styled as an error without `aria-invalid` | `4a1b039` | `94553db` |

**Which check should have caught it:** a fresh-context code review before merging. PRs #8 and #9 were Medium tier, which calls for an AI review pass before merge; the reviews ran only after PR #9 was merged. The tests covered each behaviour on its own path (blur, submit), but not the combinations: a check cancelled while a submit shared it, a cache hit while another number was in flight, a value changing during a pending check, and consecutive submits. One test relied on timing (`aborts a stale check…`) and was flaky until `32c03c5`.

**Missing check to add:** run `/code-review` on every Medium or High PR before it merges, and add regression tests for interactions between async paths (blur + submit, cache + in-flight request, value changes during a check, consecutive submits). Tests should wait for an observable outcome, never a fixed delay.
