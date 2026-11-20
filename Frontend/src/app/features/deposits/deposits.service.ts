import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { StorageService } from '../../core/services/storage.service';
import {
  calculateMaturityValue,
  Deposit,
  daysUntilMaturity,
} from './deposit.model';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'nestegg.deposits.v1';
const IMPORT_MARKER_PREFIX = 'nestegg.deposits.imported.';
const DEMO_DEPOSIT_IDS = new Set([
  'fd-001',
  'fd-002',
  'fd-003',
  'fd-004',
  'fd-005',
  'fd-006',
]);

type StoredDeposit = {
  id: string;
  institution: string;
  kind: 'Fixed deposit' | 'Recurring deposit';
  principal: number;
  annualRate: number;
  startDate: string;
  maturityDate: string;
  accountNumber: string;
  customerName?: string;
  hasNominee?: boolean;
  nomineeName?: string | null;
  autoRenew?: boolean;
  status: 'Active' | 'Matured';
};

type ApiDeposit = Omit<Deposit, 'principal' | 'annualRate'> & {
  principal: number | string;
  annualRate: number | string;
};

function parseApiNumber(value: number | string, field: string): number {
  const parsed = typeof value === 'string' && value.trim() ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw new Error(`The API returned an invalid ${field} value.`);
  }
  return parsed;
}

function normalizeApiDeposit(deposit: ApiDeposit): Deposit {
  return {
    ...deposit,
    principal: parseApiNumber(deposit.principal, 'principal'),
    annualRate: parseApiNumber(deposit.annualRate, 'annual rate'),
  };
}

function isStoredDeposit(value: unknown): value is StoredDeposit {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const deposit = value as Record<string, unknown>;
  return (
    typeof deposit['id'] === 'string' &&
    typeof deposit['institution'] === 'string' &&
    (deposit['kind'] === 'Fixed deposit' || deposit['kind'] === 'Recurring deposit') &&
    typeof deposit['principal'] === 'number' &&
    Number.isFinite(deposit['principal']) &&
    deposit['principal'] >= 1000 &&
    typeof deposit['annualRate'] === 'number' &&
    Number.isFinite(deposit['annualRate']) &&
    deposit['annualRate'] >= 0.1 &&
    deposit['annualRate'] <= 20 &&
    typeof deposit['startDate'] === 'string' &&
    Number.isFinite(Date.parse(deposit['startDate'])) &&
    typeof deposit['maturityDate'] === 'string' &&
    Number.isFinite(Date.parse(deposit['maturityDate'])) &&
    deposit['maturityDate'] > deposit['startDate'] &&
    typeof deposit['accountNumber'] === 'string' &&
    (deposit['customerName'] === undefined ||
      typeof deposit['customerName'] === 'string') &&
    (deposit['hasNominee'] === undefined ||
      typeof deposit['hasNominee'] === 'boolean') &&
    (deposit['nomineeName'] === undefined ||
      deposit['nomineeName'] === null ||
      typeof deposit['nomineeName'] === 'string') &&
    (deposit['autoRenew'] === undefined ||
      typeof deposit['autoRenew'] === 'boolean') &&
    (deposit['status'] === 'Active' || deposit['status'] === 'Matured')
  );
}

function isLegacyDepositList(value: unknown): value is StoredDeposit[] {
  return Array.isArray(value) && value.every(isStoredDeposit);
}

function normalizeDeposit(deposit: StoredDeposit): Deposit {
  const nomineeName =
    typeof deposit.nomineeName === 'string' && deposit.nomineeName.trim()
      ? deposit.nomineeName.trim()
      : null;
  const hasNominee = deposit.hasNominee === true && nomineeName !== null;

  return {
    id: deposit.id,
    institution: deposit.institution,
    customerName: deposit.customerName?.trim() || 'Not provided',
    kind: 'Fixed deposit',
    principal: deposit.principal,
    annualRate: deposit.annualRate,
    startDate: deposit.startDate,
    maturityDate: deposit.maturityDate,
    accountNumber: deposit.accountNumber,
    hasNominee,
    nomineeName: hasNominee ? nomineeName : null,
    autoRenew: deposit.autoRenew === true,
    status: deposit.status,
  };
}

@Injectable({ providedIn: 'root' })
export class DepositsService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly storage = inject(StorageService);
  private readonly endpoint = `${environment.apiBaseUrl}/api/v1/deposits`;
  private readonly depositState = signal<Deposit[]>([]);
  private loadPromise: Promise<void> | null = null;
  private generation = 0;

  readonly deposits = this.depositState.asReadonly();
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly pendingLegacyImport = signal<Deposit[] | null>(null);
  readonly blockedLegacyImportCount = signal(0);
  readonly totalInvested = computed(() =>
    this.depositState().reduce((sum, deposit) => sum + deposit.principal, 0),
  );
  readonly projectedValue = computed(() =>
    this.depositState().reduce(
      (sum, deposit) => sum + calculateMaturityValue(deposit),
      0,
    ),
  );
  readonly activeCount = computed(
    () => this.depositState().filter((deposit) => deposit.status === 'Active').length,
  );
  readonly upcomingMaturities = computed(() =>
    [...this.depositState()]
      .filter(
        (deposit) =>
          deposit.status === 'Active' && daysUntilMaturity(deposit) > 0,
      )
      .sort(
        (first, second) =>
          daysUntilMaturity(first) - daysUntilMaturity(second),
      )
      .slice(0, 3),
  );

  constructor() {
    void this.load();
  }

  load(): Promise<void> {
    if (this.loaded()) {
      return Promise.resolve();
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loading.set(true);
    this.error.set(null);
    const generation = this.generation;
    this.loadPromise = firstValueFrom(this.http.get<ApiDeposit[]>(this.endpoint))
      .then(async (deposits) => {
        if (generation !== this.generation) {
          return;
        }
        const normalizedDeposits = deposits.map(normalizeApiDeposit);
        const ownerUid = await this.authSession.getUserId();
        if (generation !== this.generation) {
          return;
        }
        this.depositState.set(normalizedDeposits);
        this.loaded.set(true);
        const legacyDeposits = ownerUid
          ? this.getLegacyDeposits(ownerUid)
          : null;
        this.pendingLegacyImport.set(
          normalizedDeposits.length === 0 ? legacyDeposits : null,
        );
        this.blockedLegacyImportCount.set(
          normalizedDeposits.length > 0 ? legacyDeposits?.length ?? 0 : 0,
        );
      })
      .catch((error: unknown) => {
        if (generation === this.generation) {
          this.error.set(this.getErrorMessage(error));
        }
      })
      .finally(() => {
        if (generation === this.generation) {
          this.loading.set(false);
          this.loadPromise = null;
        }
      });

    return this.loadPromise;
  }

  async add(deposit: Omit<Deposit, 'id' | 'status'>): Promise<Deposit> {
    await this.ensureLoaded();
    const generation = this.generation;
    const response = await firstValueFrom(
      this.http.post<ApiDeposit>(this.endpoint, deposit),
    );
    const created = normalizeApiDeposit(response);
    if (generation === this.generation) {
      this.depositState.update((deposits) => [created, ...deposits]);
      this.error.set(null);
    }
    return created;
  }

  async update(id: string, deposit: Omit<Deposit, 'id'>): Promise<Deposit> {
    const generation = this.generation;
    const response = await firstValueFrom(
      this.http.put<ApiDeposit>(
        `${this.endpoint}/${encodeURIComponent(id)}`,
        deposit,
      ),
    );
    const updated = normalizeApiDeposit(response);
    if (generation === this.generation) {
      this.depositState.update((deposits) =>
        deposits.map((item) => (item.id === id ? updated : item)),
      );
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const generation = this.generation;
    await firstValueFrom(
      this.http.delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`),
    );
    if (generation === this.generation) {
      this.depositState.update((deposits) =>
        deposits.filter((item) => item.id !== id),
      );
    }
  }

  async importLegacyDeposits(): Promise<void> {
    const deposits = this.pendingLegacyImport();
    if (!deposits?.length) {
      throw new Error('There are no locally saved deposits available to import.');
    }

    const ownerUid = await this.authSession.getUserId();
    if (!ownerUid) {
      throw new Error('Sign in again before importing local deposits.');
    }
    const generation = this.generation;
    const response = await firstValueFrom(
      this.http.post<ApiDeposit[]>(`${this.endpoint}/import`, { deposits }),
    );
    const imported = response.map(normalizeApiDeposit);
    if (generation === this.generation) {
      this.depositState.set(imported);
      this.pendingLegacyImport.set(null);
      this.blockedLegacyImportCount.set(0);
      this.error.set(null);
      this.storage.write(`${IMPORT_MARKER_PREFIX}${ownerUid}`, true);
    }
  }

  dismissLegacyImport(): void {
    this.pendingLegacyImport.set(null);
  }

  reset(): void {
    this.generation += 1;
    this.loadPromise = null;
    this.depositState.set([]);
    this.loading.set(false);
    this.loaded.set(false);
    this.error.set(null);
    this.pendingLegacyImport.set(null);
    this.blockedLegacyImportCount.set(0);
  }

  findById(id: string): Deposit | undefined {
    return this.depositState().find((deposit) => deposit.id === id);
  }

  private async ensureLoaded(): Promise<void> {
    await this.load();
    if (!this.loaded()) {
      throw new Error(this.error() ?? 'Deposits could not be loaded.');
    }
  }

  private getLegacyDeposits(ownerUid: string): Deposit[] | null {
    const wasImported = this.storage.read(
      `${IMPORT_MARKER_PREFIX}${ownerUid}`,
      (value: unknown): value is true => value === true,
    );
    if (wasImported) {
      return null;
    }

    const stored = this.storage.read(STORAGE_KEY, isLegacyDepositList);
    if (!stored) {
      return null;
    }
    const legacy = stored
      .filter(
        (deposit) =>
          deposit.kind === 'Fixed deposit' && !DEMO_DEPOSIT_IDS.has(deposit.id),
      )
      .map(normalizeDeposit);
    return legacy.length > 0 ? legacy : null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Could not reach the FD Manager API. Check that the backend is running.';
      }
      if (error.status === 401) {
        return 'Your sign-in has expired. Sign in again to continue.';
      }
    }
    return 'Could not load deposits. Try again.';
  }
}
