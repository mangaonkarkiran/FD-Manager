# FD Manager

A mobile-first fixed deposit tracker built with Angular 18. The interface follows the supplied Figma screens and uses local browser storage for its demo data.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`. The app starts on **Overview**.

## Source structure

```text
src/app/
  core/
    services/     Shared browser storage
  features/       Route-level screens grouped by product area
    auth/
      sign-in/       Sign-in screen
      verify-mobile/ Mobile verification screen
    dashboard/
    deposits/
      add/        Add-deposit screen
      detail/     Deposit detail screen
      list/       Deposit list screen
      deposit.model.ts
      deposits.service.ts
    maturity/
    onboarding/
    reports/
    settings/
      overview/   Profile and preferences screen
      security/   Security settings screen
  shared/
    icons/        SVG symbol library shared by screens
  app.component.* Root application shell and navigation
  app.routes.ts   Lazy-loaded route definitions
```

Keep deposit domain logic and state inside the deposits feature, shared browser storage in `core`, route-specific screens in their feature folders, and reusable presentational UI in `shared`.

## Screens

- Overview: `/dashboard`
- My deposits: `/deposits`
- Deposit details: `/deposits/:id`
- Maturity calendar: `/maturity`
- Add deposit: `/deposits/new`
- Welcome: `/welcome`
- Sign in: `/auth`
- Verify mobile: `/verify-mobile`
- Profile & settings: `/settings`
- Security: `/security`

The sign-in and verification flow is a front-end prototype; it does not send SMS messages or authenticate an account. Deposit data and preferences are stored locally in the browser.

## Build and tests

```bash
npm run build
npm test -- --watch=false
```
