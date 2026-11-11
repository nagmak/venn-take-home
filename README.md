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
      hooks/            The feature's hooks
      schema.ts         The feature's validation rules and types
  styles/               Global CSS: design tokens and base styles
  test/                 Test-only code: setup and MSW mocks
  App.tsx               Page layout
  main.tsx              Entry point
```

- `components/` holds UI any feature could reuse; UI that belongs to one feature lives in that feature.
- Dependencies point one way: `features/` may use `api/` and `components/`, never the reverse.
- App code never imports from `test/`.
- Tests sit next to the file they test (`Button.tsx` → `Button.test.tsx`).

`npm run lint` enforces the dependency and `test/` rules.
