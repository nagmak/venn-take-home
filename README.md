# venn-take-home

An onboarding form where users enter their personal and business details. Fields are validated on blur (the corporation number is also checked against the API) and submitted to the Venn API.

## Getting started

Requires Node 22.12 or later.

```sh
npm install
cp .env.example .env   # sets VITE_API_BASE_URL
npm run dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the tests once (`npm run test:watch` to watch) |
| `npm run lint` | Lint with oxlint |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build (run `npm run build` first) |

## Stack

- **Vite + React 19 + TypeScript** (strict mode is TypeScript 7's default)
- **react-hook-form + zod**: one zod schema defines the validation rules and the form's types
- **TanStack Query**: caches each corporation number's answer and shares a check already in flight
- **libphonenumber-js**: confirms a phone number is Canadian
- **CSS Modules** with design tokens as CSS variables
- **Vitest + React Testing Library + MSW**: integration tests against a mocked network

## Project structure

```
src/
  api/                  HTTP client, config and endpoint functions
  components/           Shared UI, one folder per component (Button, StepIndicator, TextField)
  features/
    onboarding/
      components/       OnboardingForm, CorporationNumberField
      hooks/            Form state and submit
      corporationNumberQuery.ts  The corporation number check (TanStack Query)
      onboardingSchema.ts  Validation rules and types
  styles/               Design tokens and global styles
  test/                 Test setup, MSW mocks and helpers
```

- `components/` is UI any feature could reuse; anything specific to one feature lives in that feature.
- Imports point one way: `features/` may use `api/` and `components/`, never the reverse, and app code never imports `test/`. `npm run lint` enforces both.
- Tests sit next to the file they test.
- Files are named after their main export (`onboardingSchema.ts` exports `onboardingSchema`).

## Linting

The brief lists ESLint as optional. This project uses [oxlint](https://oxc.rs/docs/guide/usage/linter), the Vite template's default, which runs ESLint-compatible rules. `.oxlintrc.json` enables the React hooks and fast-refresh rules, TypeScript correctness rules, and the import boundaries above. A local rule in `lint/test-rules.js` stops tests from waiting a fixed time instead of waiting for an outcome; tests hold mocked responses with a gate (`src/test/gate.ts`) instead.

## AI use

Built with Claude Code as a pair programmer. I made the product and architecture decisions and directed each change. Every change was reviewed and verified before merging: tests, deliberately breaking code to confirm the tests catch it, and runs in a real browser against the API.
