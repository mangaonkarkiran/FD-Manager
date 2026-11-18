import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { calculateMaturityValue, daysUntilMaturity } from '../deposits/deposit.model';
import { DepositsService } from '../deposits/deposits.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, MatSnackBarModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly bankColors = ['#2442b2', '#15966f', '#d58a45', '#8356ad', '#23849a', '#c65268'];
  private readonly snackBar = inject(MatSnackBar);
  readonly depositsService = inject(DepositsService);
  readonly deposits = this.depositsService.deposits;
  readonly nextMaturity = computed(
    () => this.depositsService.upcomingMaturities()[0] ?? null,
  );
  readonly bankBreakdown = computed(() => {
    const totals = new Map<string, { amount: number; count: number }>();
    for (const deposit of this.deposits()) {
      const bank = totals.get(deposit.institution) ?? { amount: 0, count: 0 };
      bank.amount += deposit.principal;
      bank.count += 1;
      totals.set(deposit.institution, bank);
    }
    const totalInvested = this.depositsService.totalInvested();
    return [...totals.entries()]
      .map(([institution, summary]) => ({ institution, ...summary }))
      .sort((first, second) => second.amount - first.amount)
      .map((bank, index) => ({
        ...bank,
        share: totalInvested ? (bank.amount / totalInvested) * 100 : 0,
        color: this.bankColors[index % this.bankColors.length],
      }));
  });
  readonly interest = computed(
    () => this.depositsService.projectedValue() - this.depositsService.totalInvested(),
  );
  readonly upcoming = computed(() => this.depositsService.upcomingMaturities().slice(1, 3));

  daysUntil(maturityDate: string): number {
    const deposit = this.deposits().find((item) => item.maturityDate === maturityDate);
    return deposit ? daysUntilMaturity(deposit) : 0;
  }

  amountForMaturity(depositId: string): number {
    const deposit = this.deposits().find((item) => item.id === depositId);
    return deposit ? calculateMaturityValue(deposit) : 0;
  }

  showNotifications(): void {
    this.snackBar.open('You’re all caught up.', 'Dismiss', { duration: 2500 });
  }
}
