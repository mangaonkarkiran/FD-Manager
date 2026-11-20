import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard, verificationGuard } from './auth.guard';
import { AuthSessionService } from './auth-session.service';

describe('authGuard', () => {
  let session: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    session = jasmine.createSpyObj<AuthSessionService>(
      'AuthSessionService',
      ['isAuthenticated', 'hasPendingVerification'],
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: session },
      ],
    });
  });

  it('redirects unauthenticated users to the login page', async () => {
    session.isAuthenticated.and.resolveTo(false);
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/auth']));
  });

  it('allows authenticated users through', async () => {
    session.isAuthenticated.and.resolveTo(true);
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toBeTrue();
  });

  it('redirects direct verification-page visits to login', async () => {
    session.isAuthenticated.and.resolveTo(false);
    session.hasPendingVerification.and.returnValue(false);
    const result = await TestBed.runInInjectionContext(() =>
      verificationGuard({} as never, {} as never),
    );

    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/auth']));
  });

  it('allows verification only after starting the sign-in flow', async () => {
    session.isAuthenticated.and.resolveTo(false);
    session.hasPendingVerification.and.returnValue(true);
    const result = await TestBed.runInInjectionContext(() =>
      verificationGuard({} as never, {} as never),
    );

    expect(result).toBeTrue();
  });
});
