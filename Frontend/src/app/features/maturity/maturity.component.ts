import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { calculateMaturityValue, Deposit, daysUntilMaturity } from '../deposits/deposit.model';
import { DepositsService } from '../deposits/deposits.service';
import { DepositDataStatusComponent } from '../deposits/deposit-data-status.component';
import { DepositLoadingSkeletonComponent } from '../deposits/deposit-loading-skeleton.component';

interface MonthlyMaturity {
  key: string;
  label: string;
  deposits: Deposit[];
  count: number;
  maturityValue: number;
}

@Component({
  selector: 'app-maturity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    DepositDataStatusComponent,
    DepositLoadingSkeletonComponent,
  ],
  templateUrl: './maturity.component.html',
  styleUrl: './maturity.component.scss',
})
export class MaturityComponent {
  readonly depositsService = inject(DepositsService);
  readonly deposits = this.depositsService.deposits;
  private readonly today = this.dateString(new Date());
  readonly monthlyMaturities = computed(() => {
    const groups = new Map<string, Deposit[]>();

    for (const deposit of this.deposits()) {
      if (deposit.status !== 'Active' || deposit.maturityDate < this.today) {
        continue;
      }
      const key = deposit.maturityDate.slice(0, 7);
      const group = groups.get(key) ?? [];
      group.push(deposit);
      groups.set(key, group);
    }

    return [...groups.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, maturities]): MonthlyMaturity => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const deposits = [...maturities].sort((first, second) =>
          first.maturityDate.localeCompare(second.maturityDate),
        );

        return {
          key,
          label: date.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          }),
          deposits,
          count: deposits.length,
          maturityValue: deposits.reduce(
            (total, deposit) => total + calculateMaturityValue(deposit),
            0,
          ),
        };
      });
  });
  readonly nextMaturityMonth = computed(
    () => this.monthlyMaturities()[0] ?? null,
  );
  readonly upcomingCount = computed(() =>
    this.monthlyMaturities().reduce((total, month) => total + month.count, 0),
  );
  readonly upcomingValue = computed(() =>
    this.monthlyMaturities().reduce(
      (total, month) => total + month.maturityValue,
      0,
    ),
  );

  daysUntil(deposit: Deposit): number {
    return daysUntilMaturity(deposit);
  }

  valueAtMaturity(deposit: Deposit): number {
    return calculateMaturityValue(deposit);
  }

  private dateString(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
