# FD Manager

A mobile-first fixed deposit tracker built with Angular 18. The frontend uses
the FastAPI service and PostgreSQL for deposit data and Firebase Phone
Authentication for sign-in.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`. The app starts on **Overview** after Firebase
Phone Authentication. Configure the Firebase Web app settings in
`src/environments/environment.development.ts` before testing sign-in.

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

Deposit data is loaded from the backend API. Theme and reminder preferences
remain in browser storage. Existing locally saved deposits are not removed; if
the signed-in account has no server deposits, the app offers an explicit import
of saved non-demo deposits.

Backend setup, Firebase configuration, PostgreSQL migrations, and API routes
are documented in [../Backend/README.md](../Backend/README.md).

## Build and tests

```bash
npm run build
npm test -- --watch=false
```
