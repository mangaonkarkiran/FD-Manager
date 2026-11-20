import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Deposit } from '../deposits/deposit.model';
import { DepositsService } from '../deposits/deposits.service';
import { DepositDataStatusComponent } from '../deposits/deposit-data-status.component';
import { DepositLoadingSkeletonComponent } from '../deposits/deposit-loading-skeleton.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatSnackBarModule,
    DepositDataStatusComponent,
    DepositLoadingSkeletonComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  readonly depositsService = inject(DepositsService);
  private readonly snackBar = inject(MatSnackBar);
  readonly deposits = this.depositsService.deposits;

  downloadCsv(): void {
    const header = [
      'Institution',
      'Type',
      'Principal (INR)',
      'Annual rate (%)',
      'Start date',
      'Maturity date',
      'Account',
      'Auto-renew at maturity',
      'Status',
    ];
    const rows = this.deposits().map((deposit) => [
      deposit.institution,
      deposit.kind,
      String(deposit.principal),
      String(deposit.annualRate),
      deposit.startDate,
      deposit.maturityDate,
      deposit.accountNumber,
      deposit.autoRenew ? 'Yes' : 'No',
      deposit.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((field) => this.escapeCsv(field)).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fd-manager-deposits.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.snackBar.open('Your CSV report is ready.', 'Dismiss', { duration: 3000 });
  }

  describe(deposit: Deposit): string {
    return `${deposit.kind} · ${deposit.maturityDate}`;
  }

  private escapeCsv(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
  }
}
