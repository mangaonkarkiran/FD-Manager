import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Deposit } from './deposit.model';
import { DepositsService } from './deposits.service';

@Component({
  selector: 'app-legacy-deposit-import',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (depositsService.pendingLegacyImport(); as deposits) {
      <section class="legacy-import card" aria-labelledby="legacy-import-heading">
        <strong id="legacy-import-heading">Deposits saved on this device</strong>
        <p>
          We found {{ deposits.length }} locally saved
          {{ deposits.length === 1 ? 'deposit' : 'deposits' }}. Import them into
          this account? The local copy will be left unchanged.
        </p>
        @if (errorMessage()) {
          <p class="legacy-import-error" role="alert">{{ errorMessage() }}</p>
        }
        <div class="legacy-import-actions">
          <button type="button" [disabled]="importing()" (click)="importDeposits()">
            {{ importing() ? 'Importing…' : 'Import deposits' }}
          </button>
          <button type="button" class="legacy-import-dismiss" [disabled]="importing()" (click)="dismiss()">
            Not now
          </button>
        </div>
      </section>
    }
    @if (depositsService.blockedLegacyImportCount() > 0) {
      <section class="legacy-import card" role="status">
        <strong>Local deposits were kept safe</strong>
        <p>
          We found {{ depositsService.blockedLegacyImportCount() }} locally saved
          {{ depositsService.blockedLegacyImportCount() === 1 ? 'deposit' : 'deposits' }},
          but this account already has server data. To avoid duplicates, nothing
          was imported or changed.
        </p>
      </section>
    }
    @if (notice()) {
      <p class="legacy-import-notice" role="status">{{ notice() }}</p>
    }
  `,
  styles: `
    .legacy-import {
      margin-bottom: 16px;
      padding: 16px;
      border-color: var(--line);
    }
    .legacy-import > strong { color: var(--ink); font-size: 14px; }
    .legacy-import p { margin: 6px 0 12px; color: var(--ink-soft); font-size: 12px; }
    .legacy-import .legacy-import-error { color: #b33a54; }
    .legacy-import-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .legacy-import-actions button {
      min-height: 36px;
      padding: 0 12px;
      border: 0;
      border-radius: 8px;
      background: var(--blue);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .legacy-import-actions button:disabled { cursor: wait; opacity: .7; }
    .legacy-import-actions .legacy-import-dismiss {
      background: var(--surface-soft);
      color: var(--ink-soft);
    }
    .legacy-import-notice { color: var(--green); font-size: 12px; }
  `,
})
export class LegacyDepositImportComponent {
  readonly depositsService = inject(DepositsService);
  readonly importing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  async importDeposits(): Promise<void> {
    const deposits: Deposit[] | null = this.depositsService.pendingLegacyImport();
    if (!deposits?.length) {
      return;
    }

    this.importing.set(true);
    this.errorMessage.set(null);
    try {
      await this.depositsService.importLegacyDeposits();
      this.notice.set(`${deposits.length} deposits were imported. Your local copy remains unchanged.`);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'The deposits could not be imported.',
      );
    } finally {
      this.importing.set(false);
    }
  }

  dismiss(): void {
    this.depositsService.dismissLegacyImport();
  }
}
