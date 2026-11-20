import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);
  readonly sending = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    agreed: [false, Validators.requiredTrue],
  });

  async sendVerification(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.errorMessage.set(null);
    try {
      await this.session.sendVerificationCode(
        `+91${this.form.controls.phone.value}`,
        'recaptcha-container',
      );
      await this.router.navigate(['/verify-mobile'], {
        queryParams: { phone: this.form.controls.phone.value },
      });
    } catch (error) {
      this.errorMessage.set(this.session.errorMessage(error));
    } finally {
      this.sending.set(false);
    }
  }
}
