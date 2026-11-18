import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    agreed: [false, Validators.requiredTrue],
  });

  sendVerification(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    void this.router.navigate(['/verify-mobile'], {
      queryParams: { phone: this.form.controls.phone.value },
    });
  }
}
