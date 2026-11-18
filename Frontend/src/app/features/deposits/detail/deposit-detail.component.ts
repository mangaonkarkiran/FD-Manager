import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  calculateMaturityValue,
  daysUntilMaturity,
  formatTenure,
} from '../deposit.model';
import { DepositsService } from '../deposits.service';

@Component({
  selector: 'app-deposit-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatSnackBarModule],
  templateUrl: './deposit-detail.component.html',
  styleUrl: './deposit-detail.component.scss',
})
export class DepositDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly depositsService = inject(DepositsService);
  readonly deposit = this.depositsService.findById(
    this.route.snapshot.paramMap.get('id') ?? '',
  );
  readonly maturityValue = computed(() =>
    this.deposit ? calculateMaturityValue(this.deposit) : 0,
  );
  readonly daysLeft = computed(() =>
    this.deposit ? daysUntilMaturity(this.deposit) : 0,
  );
  readonly tenure = this.deposit
    ? formatTenure(this.deposit.startDate, this.deposit.maturityDate)
    : null;
  readonly reminderEnabled = signal(
    localStorage.getItem('nestegg.reminders') !== 'off',
  );
  readonly progressPercent = computed(() => {
    if (!this.deposit) {
      return 0;
    }
    const start = new Date(`${this.deposit.startDate}T00:00:00`).getTime();
    const end = new Date(`${this.deposit.maturityDate}T00:00:00`).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
  });

  constructor() {
    if (!this.deposit) {
      void this.router.navigate(['/deposits']);
    }
  }

  toggleReminder(): void {
    this.reminderEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.reminders', this.reminderEnabled() ? 'on' : 'off');
  }

  manageDeposit(): void {
    this.snackBar.open('Your deposit is ready to manage.', 'Dismiss', { duration: 2500 });
  }
}
