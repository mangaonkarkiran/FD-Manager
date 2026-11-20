import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type DepositSkeletonVariant =
  | 'analytics'
  | 'dashboard'
  | 'detail'
  | 'list'
  | 'maturity'
  | 'report';

@Component({
  selector: 'app-deposit-loading-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="deposit-skeleton"
      role="status"
      aria-label="Loading your deposits"
      aria-busy="true"
    >
      <div class="skeleton-content" aria-hidden="true">
        @switch (variant) {
          @case ('dashboard') {
            <div class="panel balance">
              <i class="line label"></i><i class="line amount"></i>
              <i class="line caption"></i><i class="divider"></i>
              <div class="columns"><i class="line stat"></i><i class="line stat"></i></div>
            </div>
            <div class="heading"><i class="line title"></i><i class="line action"></i></div>
            <div class="panel maturity-row">
              <i class="line icon"></i><div><i class="line medium"></i><i class="line caption"></i></div>
              <i class="line amount-small"></i>
            </div>
            <div class="heading"><i class="line title"></i><i class="line action"></i></div>
            <div class="panel bank-panel">
              <i class="line bar"></i><i class="line medium"></i><i class="line medium"></i>
            </div>
            <i class="line button"></i>
          }
          @case ('list') {
            <div class="panel balance">
              <i class="line label"></i><i class="line amount"></i><i class="line caption"></i>
            </div>
            <i class="line search"></i>
            <div class="heading"><i class="line title"></i><i class="line action"></i></div>
            @for (row of rows; track row) {
              <div class="panel deposit-row">
                <i class="line icon"></i>
                <div class="deposit-copy"><i class="line medium"></i><i class="line caption"></i></div>
                <i class="line tag"></i>
                <div class="deposit-values">
                  <i class="line value"></i><i class="line value"></i><i class="line value"></i>
                </div>
              </div>
            }
          }
          @case ('maturity') {
            <i class="line intro"></i>
            <div class="panel balance">
              <i class="line label"></i><i class="line amount"></i><i class="line caption"></i>
              <i class="divider"></i>
              <div class="columns"><i class="line stat"></i><i class="line stat"></i></div>
            </div>
            <div class="heading"><i class="line title"></i><i class="line action"></i></div>
            @for (row of rows; track row) {
              <div class="panel maturity-row">
                <i class="line icon"></i><div><i class="line medium"></i><i class="line caption"></i></div>
                <i class="line amount-small"></i>
              </div>
            }
          }
          @case ('analytics') {
            <div class="panel balance">
              <i class="line label"></i><i class="line amount"></i><i class="line caption"></i>
              <i class="divider"></i>
              <div class="columns"><i class="line stat"></i><i class="line stat"></i></div>
            </div>
            <div class="heading"><i class="line title"></i></div>
            <div class="chart-grid">
              <div class="panel chart-panel"><i class="line medium"></i><i class="line chart"></i></div>
              <div class="panel chart-panel"><i class="line medium"></i><i class="line chart"></i></div>
            </div>
            <div class="panel insight"><i class="line icon"></i><i class="line medium"></i></div>
          }
          @case ('report') {
            <div class="heading"><i class="line title"></i><i class="line action"></i></div>
            <div class="panel report-hero">
              <i class="line medium"></i><i class="line value"></i>
              <i class="line caption"></i><i class="line button"></i>
            </div>
            <div class="panel table-panel">
              <i class="line medium"></i>
              @for (row of rows; track row) {
                <div class="table-row">
                  <i class="line medium"></i><i class="line value"></i><i class="line value"></i>
                </div>
              }
            </div>
          }
          @case ('detail') {
            <div class="heading"><i class="line title"></i></div>
            <div class="panel detail-panel">
              <div class="maturity-row"><i class="line icon"></i><i class="line medium"></i><i class="line tag"></i></div>
              <i class="line label"></i><i class="line amount"></i>
              <div class="columns"><i class="line stat"></i><i class="line stat"></i></div>
              <i class="divider"></i>
              @for (row of rows; track row) {
                <div class="table-row"><i class="line medium"></i><i class="line value"></i></div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './deposit-loading-skeleton.component.scss',
})
export class DepositLoadingSkeletonComponent {
  @Input({ required: true }) variant!: DepositSkeletonVariant;

  readonly rows = [0, 1, 2];
}
