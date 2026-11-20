import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import 'chart.js/auto';
import { calculateMaturityValue } from '../deposits/deposit.model';
import { DepositsService } from '../deposits/deposits.service';
import { DepositDataStatusComponent } from '../deposits/deposit-data-status.component';
import { DepositLoadingSkeletonComponent } from '../deposits/deposit-loading-skeleton.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    BaseChartDirective,
    DepositDataStatusComponent,
    DepositLoadingSkeletonComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  readonly depositsService = inject(DepositsService);
  readonly deposits = this.depositsService.deposits;
  private readonly chartColors = [
    '#357967',
    '#e4a77d',
    '#88a9a0',
    '#b8a4c7',
    '#ddc671',
    '#7690a1',
  ];
  readonly interest = computed(() =>
    this.deposits().reduce(
      (total, deposit) => total + calculateMaturityValue(deposit) - deposit.principal,
      0,
    ),
  );
  readonly allocationBreakdown = computed(() => {
    const totals = new Map<string, number>();
    for (const deposit of this.deposits()) {
      totals.set(
        deposit.institution,
        (totals.get(deposit.institution) ?? 0) + deposit.principal,
      );
    }

    return [...totals.entries()].map(([institution, principal], index) => ({
      institution,
      principal,
      color: this.chartColors[index % this.chartColors.length],
    }));
  });
  readonly highestRate = computed(() => {
    const highest = [...this.deposits()].sort(
      (first, second) => second.annualRate - first.annualRate,
    )[0];
    return {
      annualRate: highest?.annualRate ?? 0,
      institution: highest?.institution ?? 'your latest deposit',
    };
  });
  readonly allocationData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const breakdown = this.allocationBreakdown();
    return {
      labels: breakdown.map((item) => item.institution),
      datasets: [
        {
          data: breakdown.map((item) => item.principal),
          backgroundColor: breakdown.map((item) => item.color),
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    };
  });
  readonly allocationOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: { display: false },
      tooltip: { displayColors: false, backgroundColor: '#142b25', padding: 11 },
    },
  };
  readonly rateData = computed<ChartConfiguration<'bar'>['data']>(() => ({
    labels: this.deposits().map((deposit) => deposit.institution),
    datasets: [
      {
        data: this.deposits().map((deposit) => deposit.annualRate),
        backgroundColor: this.chartColors,
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  }));
  readonly rateOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#89938e' } },
      y: {
        beginAtZero: true,
        max: 10,
        grid: { color: 'rgba(128, 145, 137, 0.12)' },
        border: { display: false },
        ticks: { color: '#89938e', callback: (value) => `${value}%` },
      },
    },
  };
}
