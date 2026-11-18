import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-verify-mobile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-mobile.component.html',
  styleUrl: './verify-mobile.component.scss',
})
export class VerifyMobileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly phoneNumber = this.route.snapshot.queryParamMap.get('phone') || '9876543210';
  readonly resent = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    code: ['482619', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  verify(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    void this.router.navigate(['/dashboard']);
  }

  changeNumber(): void {
    void this.router.navigate(['/auth']);
  }

  resendCode(): void {
    this.resent.set(true);
  }
}
