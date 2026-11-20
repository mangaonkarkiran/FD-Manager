import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { calculateMaturityValue, Deposit, formatTenure } from '../deposit.model';
import { DepositsService } from '../deposits.service';
import { DepositDataStatusComponent } from '../deposit-data-status.component';

function validateDepositDetails(control: AbstractControl): ValidationErrors | null {
  const startDate = control.get('startDate')?.value as string | undefined;
  const maturityDate = control.get('maturityDate')?.value as string | undefined;
  const hasNominee = control.get('hasNominee')?.value === true;
  const nomineeName = control.get('nomineeName')?.value as string | undefined;
  const errors: ValidationErrors = {};

  if (startDate && maturityDate && maturityDate <= startDate) {
    errors['invalidDateRange'] = true;
  }
  if (hasNominee && !nomineeName?.trim()) {
    errors['nomineeNameRequired'] = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

@Component({
  selector: 'app-add-deposit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule,
    DepositDataStatusComponent,
  ],
  templateUrl: './add-deposit.component.html',
  styleUrl: './add-deposit.component.scss',
})
export class AddDepositComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly depositsService = inject(DepositsService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly banks = [
    'HDFC Bank',
    'ICICI Bank',
    'SBI',
    'Axis Bank',
    'Kotak Mahindra',
    'IDFC FIRST Bank',
  ];
  readonly reminderEnabled = signal(
    localStorage.getItem('nestegg.reminders') !== 'off',
  );
  private readonly today = this.dateString(new Date());
  readonly form = this.formBuilder.nonNullable.group({
    customerName: ['', [Validators.required, Validators.pattern(/\S/)]],
    institution: ['HDFC Bank', Validators.required],
    principal: [100000, [Validators.required, Validators.min(1000), Validators.max(100000000)]],
    annualRate: [7.5, [Validators.required, Validators.min(0.1), Validators.max(20)]],
    startDate: [this.today, Validators.required],
    maturityDate: [this.maturityDate(this.today, 12), Validators.required],
    hasNominee: [false],
    nomineeName: [''],
    autoRenew: [false],
  }, { validators: validateDepositDetails });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    try {
      const created = await this.depositsService.add({
        customerName: value.customerName.trim(),
        institution: value.institution,
        kind: 'Fixed deposit',
        principal: value.principal,
        annualRate: value.annualRate,
        startDate: value.startDate,
        maturityDate: value.maturityDate,
        accountNumber: '•••• 4821',
        hasNominee: value.hasNominee,
        nomineeName: value.hasNominee ? value.nomineeName.trim() : null,
        autoRenew: value.autoRenew,
      });

      localStorage.setItem('nestegg.reminders', this.reminderEnabled() ? 'on' : 'off');
      this.snackBar.open('Your deposit has been added.', 'Dismiss', { duration: 3000 });
      await this.router.navigate(['/deposits', created.id]);
    } catch (error) {
      this.snackBar.open(
        error instanceof Error ? error.message : 'Your deposit could not be saved.',
        'Dismiss',
        { duration: 5000 },
      );
    }
  }

  estimatedValue(): number | null {
    if (
      this.form.controls.principal.invalid ||
      this.form.controls.annualRate.invalid ||
      this.form.controls.startDate.invalid ||
      this.form.controls.maturityDate.invalid ||
      this.form.hasError('invalidDateRange')
    ) {
      return null;
    }

    const value = this.form.getRawValue();
    const preview: Deposit = {
      id: 'preview',
      institution: value.institution,
      customerName: value.customerName.trim(),
      kind: 'Fixed deposit',
      principal: value.principal,
      annualRate: value.annualRate,
      startDate: value.startDate,
      maturityDate: value.maturityDate,
      accountNumber: '•••• 4821',
      hasNominee: value.hasNominee,
      nomineeName: value.hasNominee ? value.nomineeName.trim() : null,
      autoRenew: value.autoRenew,
      status: 'Active',
    };
    const estimate = calculateMaturityValue(preview);
    return Number.isFinite(estimate) ? estimate : null;
  }

  estimatedTenure(): string | null {
    const { startDate, maturityDate } = this.form.getRawValue();
    return formatTenure(startDate, maturityDate);
  }

  maturityDate(startDate: string, months: number): string {
    const date = new Date(`${startDate}T00:00:00`);
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(originalDay, lastDay));
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private dateString(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  toggleReminder(): void {
    this.reminderEnabled.update((enabled) => !enabled);
  }
}
