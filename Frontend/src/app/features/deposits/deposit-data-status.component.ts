import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { DepositsService } from './deposits.service';

@Component({
  selector: 'app-deposit-data-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showLoading && depositsService.loading()) {
      <p class="deposit-data-status" role="status">Loading your deposits…</p>
    }
    @if (depositsService.error(); as error) {
      <div class="deposit-data-status deposit-data-status--error" role="alert">
        <span>{{ error }}</span>
        <button type="button" (click)="depositsService.load()">Retry</button>
      </div>
    }
  `,
  styles: `
    .deposit-data-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0 0 14px;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface);
      color: var(--ink-soft);
      font-size: 13px;
    }
    .deposit-data-status--error { color: #b33a54; }
    .deposit-data-status button {
      border: 0;
      background: transparent;
      color: var(--blue);
      font-weight: 700;
      cursor: pointer;
    }
  `,
  imports: [],
})
export class DepositDataStatusComponent {
  @Input() showLoading = true;

  readonly depositsService = inject(DepositsService);
}
