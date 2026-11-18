import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (component) => component.DashboardComponent,
      ),
  },
  {
    path: 'deposits',
    loadComponent: () =>
      import('./features/deposits/list/deposit-list.component').then(
        (component) => component.DepositListComponent,
      ),
  },
  {
    path: 'deposits/new',
    loadComponent: () =>
      import('./features/deposits/add/add-deposit.component').then(
        (component) => component.AddDepositComponent,
      ),
  },
  {
    path: 'maturity',
    loadComponent: () =>
      import('./features/maturity/maturity.component').then(
        (component) => component.MaturityComponent,
      ),
  },
  {
    path: 'deposits/:id',
    loadComponent: () =>
      import('./features/deposits/detail/deposit-detail.component').then(
        (component) => component.DepositDetailComponent,
      ),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/analytics.component').then(
        (component) => component.AnalyticsComponent,
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (component) => component.ReportsComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/overview/settings.component').then(
        (component) => component.SettingsComponent,
      ),
  },
  {
    path: 'security',
    loadComponent: () =>
      import('./features/settings/security/security.component').then(
        (component) => component.SecurityComponent,
      ),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/sign-in/auth.component').then(
        (component) => component.AuthComponent,
      ),
  },
  {
    path: 'verify-mobile',
    loadComponent: () =>
      import('./features/auth/verify-mobile/verify-mobile.component').then(
        (component) => component.VerifyMobileComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
