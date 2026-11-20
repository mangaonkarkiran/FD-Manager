import { Injectable } from '@angular/core';
import { FirebaseError, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  ConfirmationResult,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly firebaseConfig: FirebaseOptions = environment.firebase;
  private authClient: Auth | null = null;
  private confirmationResult: ConfirmationResult | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  async isAuthenticated(): Promise<boolean> {
    const auth = this.getAuthClient();
    if (!auth) {
      return false;
    }

    await auth.authStateReady();
    return auth.currentUser !== null;
  }

  hasPendingVerification(): boolean {
    return this.confirmationResult !== null;
  }

  cancelVerification(): void {
    this.confirmationResult = null;
    this.recaptchaVerifier?.clear();
    this.recaptchaVerifier = null;
  }

  async sendVerificationCode(phoneNumber: string, recaptchaContainerId: string): Promise<void> {
    const auth = this.requireAuthClient();
    this.recaptchaVerifier?.clear();
    this.confirmationResult = null;

    const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });
    this.recaptchaVerifier = verifier;

    try {
      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        verifier,
      );
    } catch (error) {
      verifier.clear();
      this.recaptchaVerifier = null;
      throw error;
    }
  }

  async verifyCode(code: string): Promise<void> {
    if (!this.confirmationResult) {
      throw new Error('Request a verification code before entering it.');
    }

    await this.confirmationResult.confirm(code);
    this.confirmationResult = null;
    this.recaptchaVerifier?.clear();
    this.recaptchaVerifier = null;
  }

  async getIdToken(): Promise<string | null> {
    const auth = this.getAuthClient();
    if (!auth) {
      return null;
    }

    await auth.authStateReady();
    return auth.currentUser?.getIdToken() ?? null;
  }

  async getUserId(): Promise<string | null> {
    const auth = this.getAuthClient();
    if (!auth) {
      return null;
    }

    await auth.authStateReady();
    return auth.currentUser?.uid ?? null;
  }

  async signOut(): Promise<void> {
    const auth = this.requireAuthClient();
    await firebaseSignOut(auth);
    this.cancelVerification();
  }

  errorMessage(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return error instanceof Error
        ? error.message
        : 'Authentication could not be completed. Try again.';
    }

    switch (error.code) {
      case 'auth/invalid-phone-number':
        return 'Enter a valid mobile number.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Wait a little before trying again.';
      case 'auth/quota-exceeded':
        return 'SMS verification is temporarily unavailable. Try again later.';
      case 'auth/operation-not-allowed':
        return 'Phone sign-in is not enabled for this Firebase project.';
      case 'auth/configuration-not-found':
        return 'Firebase Authentication is not initialized for this project. In Firebase Console, open Authentication and complete setup, then enable Phone sign-in.';
      case 'auth/unauthorized-domain':
        return 'This website is not authorized in Firebase. Add its hostname under Authentication settings > Authorized domains.';
      case 'auth/app-not-authorized':
      case 'auth/invalid-api-key':
        return 'Firebase rejected this web app configuration. Check the Firebase web app settings and API key.';
      case 'auth/captcha-check-failed':
      case 'auth/invalid-app-credential':
      case 'auth/missing-app-credential':
        return 'Firebase reCAPTCHA verification failed. Check the authorized domain and try again.';
      case 'auth/network-request-failed':
        return 'Could not reach Firebase Authentication. Check your connection, browser extensions, and firewall.';
      case 'auth/invalid-verification-code':
        return 'That verification code is incorrect.';
      case 'auth/code-expired':
        return 'That verification code has expired. Request a new one.';
      default:
        return `Firebase authentication failed (${error.code}). Check the Firebase Authentication settings and try again.`;
    }
  }

  private getAuthClient(): Auth | null {
    const { apiKey, authDomain, projectId, appId } = this.firebaseConfig;
    if (!apiKey || !authDomain || !projectId || !appId) {
      return null;
    }

    if (!this.authClient) {
      const app = getApps().some((candidate) => candidate.name === 'fd-manager')
        ? getApp('fd-manager')
        : initializeApp(this.firebaseConfig, 'fd-manager');
      this.authClient = getAuth(app);
    }
    return this.authClient;
  }

  private requireAuthClient(): Auth {
    const auth = this.getAuthClient();
    if (!auth) {
      throw new Error(
        'Firebase is not configured. Add the Firebase web app settings to the Frontend environment files.',
      );
    }
    return auth;
  }
}
