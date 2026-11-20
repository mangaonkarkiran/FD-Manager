import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  calculateMaturityValue,
  daysUntilMaturity,
  formatTenure,
} from '../deposit.model';
import { DepositsService } from '../deposits.service';
import { DepositDataStatusComponent } from '../deposit-data-status.component';
import { DepositLoadingSkeletonComponent } from '../deposit-loading-skeleton.component';

@Component({
  selector: 'app-deposit-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatSnackBarModule,
    DepositDataStatusComponent,
    DepositLoadingSkeletonComponent,
  ],
  templateUrl: './deposit-detail.component.html',
  styleUrl: './deposit-detail.component.scss',
})
export class DepositDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly depositsService = inject(DepositsService);
  private readonly depositId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly deposit = computed(() => this.depositsService.findById(this.depositId));
  readonly maturityValue = computed(() => {
    const deposit = this.deposit();
    return deposit ? calculateMaturityValue(deposit) : 0;
  });
  readonly daysLeft = computed(() => {
    const deposit = this.deposit();
    return deposit ? daysUntilMaturity(deposit) : 0;
  });
  readonly tenure = computed(() => {
    const deposit = this.deposit();
    return deposit ? formatTenure(deposit.startDate, deposit.maturityDate) : null;
  });
  readonly reminderEnabled = signal(
    localStorage.getItem('nestegg.reminders') !== 'off',
  );
  readonly progressPercent = computed(() => {
    const deposit = this.deposit();
    if (!deposit) {
      return 0;
    }
    const start = new Date(`${deposit.startDate}T00:00:00`).getTime();
    const end = new Date(`${deposit.maturityDate}T00:00:00`).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
  });

  constructor() {
    effect(() => {
      if (this.depositsService.loaded() && !this.deposit()) {
        void this.router.navigate(['/deposits']);
      }
    });
  }

  toggleReminder(): void {
    this.reminderEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.reminders', this.reminderEnabled() ? 'on' : 'off');
  }

  manageDeposit(): void {
    this.snackBar.open('Your deposit is ready to manage.', 'Dismiss', { duration: 2500 });
  }
}
