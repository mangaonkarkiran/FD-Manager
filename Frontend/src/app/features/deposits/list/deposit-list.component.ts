import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Deposit } from '../deposit.model';
import { DepositsService } from '../deposits.service';

@Component({
  selector: 'app-deposit-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './deposit-list.component.html',
  styleUrl: './deposit-list.component.scss',
})
export class DepositListComponent {
  readonly depositsService = inject(DepositsService);
  readonly deposits = this.depositsService.deposits;
  readonly query = signal('');
  readonly filteredDeposits = computed(() => {
    const search = this.query().trim().toLowerCase();
    return this.deposits().filter((deposit) => {
      const matchesSearch =
        search.length === 0 ||
        deposit.institution.toLowerCase().includes(search) ||
        deposit.accountNumber.toLowerCase().includes(search);
      return matchesSearch;
    });
  });

  setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
