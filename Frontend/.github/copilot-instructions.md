# FD Manager Project Guidelines

## Architecture
- Keep route-level code in `src/app/features/<feature>` and group each screen's component, template, styles, and tests in a descriptive subfolder when a feature has multiple screens.
- Keep deposit models and services inside `features/deposits`; keep shared browser storage in `core` and reusable UI in `shared`.
- Preserve lazy-loaded routes and update route imports and README structure notes when moving feature files.

## Product and UI
- This first phase tracks fixed deposits only; do not add recurring-deposit or calculator flows unless requested.
- Match new screens to the compact, mobile-first dashboard design: use shared page headings, spacing, cards, and theme variables from `src/styles.scss`.
- Keep screens responsive, keyboard accessible, and free of horizontal overflow; provide clear empty and validation states.

## Validation
- Use existing Angular patterns and dependencies; avoid adding packages unless required.
- Run `npm run build` and `npm test -- --watch=false` after application changes.
- Keep documentation in sync with meaningful route, feature-structure, or behavior changes.
