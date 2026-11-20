import { FirebaseError } from 'firebase/app';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  let service: AuthSessionService;

  beforeEach(() => {
    service = new AuthSessionService();
  });

  it('explains when the current domain is not authorized in Firebase', () => {
    const error = new FirebaseError('auth/unauthorized-domain', 'Domain not authorized');

    expect(service.errorMessage(error)).toContain('authorized');
    expect(service.errorMessage(error)).toContain('hostname');
  });

  it('explains when Firebase Authentication is not configured', () => {
    const error = new FirebaseError('auth/configuration-not-found', 'Configuration not found');

    expect(service.errorMessage(error)).toContain('Authentication is not initialized');
    expect(service.errorMessage(error)).toContain('enable Phone sign-in');
  });

  it('includes an unrecognized Firebase error code for diagnosis', () => {
    const error = new FirebaseError('auth/unexpected-error', 'Unexpected error');

    expect(service.errorMessage(error)).toContain('auth/unexpected-error');
  });
});
