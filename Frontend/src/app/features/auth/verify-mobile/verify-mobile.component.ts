import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-verify-mobile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './verify-mobile.component.html',
  styleUrl: './verify-mobile.component.scss',
})
export class VerifyMobileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);

  readonly phoneNumber = this.route.snapshot.queryParamMap.get('phone') || '';
  readonly resent = signal(false);
  readonly verifying = signal(false);
  readonly sending = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  async verify(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.verifying.set(true);
    this.errorMessage.set(null);
    try {
      await this.session.verifyCode(this.form.controls.code.value);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage.set(this.session.errorMessage(error));
    } finally {
      this.verifying.set(false);
    }
  }

  changeNumber(): void {
    this.session.cancelVerification();
    void this.router.navigate(['/auth']);
  }

  async resendCode(): Promise<void> {
    this.sending.set(true);
    this.errorMessage.set(null);
    try {
      await this.session.sendVerificationCode(
        `+91${this.phoneNumber}`,
        'recaptcha-container',
      );
      this.resent.set(true);
      this.form.controls.code.reset();
    } catch (error) {
      this.errorMessage.set(this.session.errorMessage(error));
    } finally {
      this.sending.set(false);
    }
  }
}
