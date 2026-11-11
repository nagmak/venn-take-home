# venn-take-home
Front-end take home task for Venn

## Setup

```sh
npm install
cp .env.example .env   # sets VITE_API_BASE_URL
npm run dev
```

## Scripts

- `npm run dev`: start the dev server
- `npm test`: run the test suite once (`npm run test:watch` to watch)
- `npm run lint`: lint with oxlint
- `npm run build`: type-check and build for production
- `npm run preview`: serve the production build (run `npm run build` first)

## Project structure

```
src/
  api/                  HTTP client, config and endpoint functions (no React, no UI)
  components/           Shared, feature-agnostic UI; one folder per component
    Button/             Button.tsx, Button.module.css, Button.test.tsx
    StepIndicator/
    TextField/
  features/             One folder per feature
    onboarding/
      components/       The feature's own UI (OnboardingForm)
      hooks/            The feature's hooks (form state, corporation check, submit)
      onboardingSchema.ts  The feature's validation rules and types
  styles/               Global CSS: design tokens and base styles
  test/                 Test-only code: setup and MSW mocks
  App.tsx               Page layout
  main.tsx              Entry point
```

- `components/` holds UI any feature could reuse; UI that belongs to one feature lives in that feature.
- Dependencies point one way: `features/` may use `api/` and `components/`, never the reverse.
- App code never imports from `test/`.
- Tests sit next to the file they test (`Button.tsx` → `Button.test.tsx`).
- Files are named after their main export: `Button.tsx` → `Button`, `useOnboardingForm.ts` → `useOnboardingForm`, `onboardingSchema.ts` → `onboardingSchema`.
- Code stays in its feature until a second feature needs it; shared code then gets a purpose-named home rather than a general `utils/` folder.

`npm run lint` enforces the dependency and `test/` rules.

## Linting

Linting uses [oxlint](https://oxc.rs/docs/guide/usage/linter), which runs ESLint-compatible rules and is the Vite template's default linter. The brief lists ESLint as optional; oxlint fills the same role with no extra plugins to install. The config is in `.oxlintrc.json`:

- **React hooks:** `rules-of-hooks` (error) and `exhaustive-deps` (warning)
- **Fast refresh:** `only-export-components`, so component files hot-reload correctly
- **TypeScript and oxc** correctness rules
- **Import boundaries:** `no-restricted-imports` blocks `api/` and `components/` from importing `features/`, and app code from importing `test/`

## Stack

- **Vite + React 19 + TypeScript** (strict mode is TypeScript 7's default)
- **react-hook-form + zod** (`@hookform/resolvers`): a zod schema is the single source of truth for rules and types
- **libphonenumber-js** (`/min` metadata): confirms a phone number is Canadian
- **CSS Modules** with design tokens as CSS variables, and DM Sans
- **Vitest + React Testing Library + user-event + MSW**: integration tests against a mocked network

## Decisions and trade-offs

- **Validation runs on blur**, and again on blur after a failed submit (not on every keystroke), so the corporation API isn't called while typing.
- **Canadian phone numbers:** the number must be `+1` followed by 10 digits with no other characters, then `libphonenumber-js` must identify it as Canadian. Canada and the US share `+1`, so a format check alone would accept US numbers. Cost: about 30 kB gzipped.
- **Where the corporation check lives:** inside the form's resolver, after the zod schema. It only calls the API when the corporation field itself is being validated (its blur, or submit) and its 9-digit format already passed. react-hook-form owns all error state, so the API error can't be wiped by other fields validating or by submit.
- **Corporation requests:** each number is requested once (blur and submit share the answer), checking a new number aborts the previous request, and "Checking…" shows while one is pending.
- **404 means "invalid":** for an unknown corporation number the API returns HTTP 404 with `{ valid: false, message }`. The brief doesn't mention the status, so the client treats that 404 as an answer, not a failure.
- **Network errors** are normalized into the same `ApiError` type as HTTP errors (status `0`). If the corporation check can't reach the API, the field asks the user to try again and **submit stays blocked**, so an unverified number is never sent. A network failure on submit shows a message to check the connection.
- **Length limits are enforced in the inputs** (`maxlength`: 50 / 50 / 12 / 9), using the same constants as the schema, so users can't type past them.
- **Accessibility:** labels are linked to inputs. Errors set `aria-invalid` and are linked with `aria-describedby`. Field messages are in a polite live region, submit errors use `role="alert"`, and focus moves to the first invalid field on submit.
- **Tests mock the network, not the code:** MSW intercepts `fetch`, so the real API client and hooks run in tests. Unhandled requests fail the test, and tests use a fake API host, so they never reach the real API.

## Known limitations

- **Real submissions aren't covered by automated tests:** the POST flow is tested with MSW using the brief's example responses.
- **Submit is blocked while the corporation check can't reach the API**, until a retry succeeds (see above).
- **After a successful submit the form stays on screen** with a confirmation message; "Step 1 of 5" is static, and there is no next step.
- **Bundle size:** about 136 kB gzipped, mostly zod and libphonenumber-js.
- **Autofill:** a saved phone number with spaces or dashes may be cut off at 12 characters and then fail validation, until the user corrects it.
- **Tooling:** no CI workflow, no Prettier, and type-checking runs as part of `npm run build` (there's no separate script).
- **Test tooling quirk:** `@testing-library/user-event` ignores `maxlength` on `type="tel"` inputs, so the length test checks the attribute instead (explained in the test).

## What I'd do next

- Add CI that runs lint, type-check, tests and build on every push and pull request.
- Add `typecheck` and `format` scripts, and Prettier.
- Add an automated accessibility check (e.g. `vitest-axe`), plus a keyboard-only and screen-reader pass.
- Show a 400 message under the matching field when it clearly names one (e.g. "Invalid phone number").
- Consider `zod/mini` to trim about 17 kB from the bundle.

## AI use

Built with Claude Code as a pair programmer. I made the product and architecture decisions and directed each change. Every change was reviewed and verified before merging: tests, deliberately breaking code to confirm the tests catch it, and runs in a real browser against the API.
