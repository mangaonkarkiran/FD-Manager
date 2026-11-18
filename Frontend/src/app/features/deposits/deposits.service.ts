import { computed, inject, Injectable, signal } from '@angular/core';
import {
  calculateMaturityValue,
  Deposit,
  daysUntilMaturity,
} from './deposit.model';
import { StorageService } from '../../core/services/storage.service';

const STORAGE_KEY = 'nestegg.deposits.v1';

const INITIAL_DEPOSITS: Deposit[] = [
  {
    id: 'fd-001',
    institution: 'HDFC Bank',
    customerName: 'Aarav Sharma',
    kind: 'Fixed deposit',
    principal: 300000,
    annualRate: 7.25,
    startDate: '2025-11-18',
    maturityDate: '2027-11-18',
    accountNumber: '•••• 4821',
    hasNominee: false,
    nomineeName: null,
    status: 'Active',
  },
  {
    id: 'fd-002',
    institution: 'State Bank of India',
    customerName: 'Aarav Sharma',
    kind: 'Fixed deposit',
    principal: 250000,
    annualRate: 7.1,
    startDate: '2026-02-14',
    maturityDate: '2027-02-14',
    accountNumber: '•••• 1038',
    hasNominee: false,
    nomineeName: null,
    status: 'Active',
  },
  {
    id: 'fd-003',
    institution: 'ICICI Bank',
    customerName: 'Aarav Sharma',
    kind: 'Fixed deposit',
    principal: 200000,
    annualRate: 7.2,
    startDate: '2025-12-01',
    maturityDate: '2027-12-01',
    accountNumber: '•••• 7734',
    hasNominee: false,
    nomineeName: null,
    status: 'Active',
  },
  {
    id: 'fd-004',
    institution: 'HDFC Bank',
    customerName: 'Aarav Sharma',
    kind: 'Fixed deposit',
    principal: 150000,
    annualRate: 7.35,
    startDate: '2026-08-20',
    maturityDate: '2027-02-20',
    accountNumber: '•••• 2295',
    hasNominee: false,
    nomineeName: null,
    status: 'Active',
  },
  {
    id: 'fd-005',
    institution: 'IDFC FIRST Bank',
    customerName: 'Aarav Sharma',
    kind: 'Fixed deposit',
    principal: 26320,
    annualRate: 7.5,
    startDate: '2025-11-28',
    maturityDate: '2026-11-28',
    accountNumber: '•••• 6150',
    hasNominee: false,
    nomineeName: null,
    status: 'Active',
  },
  {
    id: 'fd-006',
    institution: 'Axis Bank',
    customerName: 'Aarav Sharma',
    kind: 'Fixed deposit',
    principal: 73680,
    annualRate: 7.4,
    startDate: '2025-12-12',
    maturityDate: '2026-12-12',
    accountNumber: '•••• 8042',
    hasNominee: false,
    nomineeName: null,
    status: 'Active',
  },
];

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
  status: 'Active' | 'Matured';
};

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
    deposit['principal'] > 0 &&
    typeof deposit['annualRate'] === 'number' &&
    Number.isFinite(deposit['annualRate']) &&
    deposit['annualRate'] > 0 &&
    deposit['annualRate'] <= 20 &&
    typeof deposit['startDate'] === 'string' &&
    Number.isFinite(Date.parse(deposit['startDate'])) &&
    typeof deposit['maturityDate'] === 'string' &&
    Number.isFinite(Date.parse(deposit['maturityDate'])) &&
    typeof deposit['accountNumber'] === 'string' &&
    (deposit['customerName'] === undefined ||
      typeof deposit['customerName'] === 'string') &&
    (deposit['hasNominee'] === undefined ||
      typeof deposit['hasNominee'] === 'boolean') &&
    (deposit['nomineeName'] === undefined ||
      deposit['nomineeName'] === null ||
      typeof deposit['nomineeName'] === 'string') &&
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
    status: deposit.status,
  };
}

function readDeposits(storage: StorageService): Deposit[] {
  const stored = storage.read(STORAGE_KEY, isLegacyDepositList);
  if (stored === null) {
    return INITIAL_DEPOSITS;
  }
  const fixedDeposits = stored
    .filter((deposit) => deposit.kind === 'Fixed deposit')
    .map(normalizeDeposit);
  if (JSON.stringify(fixedDeposits) !== JSON.stringify(stored)) {
    storage.write(STORAGE_KEY, fixedDeposits);
  }
  return fixedDeposits;
}

@Injectable({ providedIn: 'root' })
export class DepositsService {
  private readonly storage = inject(StorageService);
  private readonly depositState = signal<Deposit[]>(
    readDeposits(this.storage),
  );

  readonly deposits = this.depositState.asReadonly();
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

  findById(id: string): Deposit | undefined {
    return this.depositState().find((deposit) => deposit.id === id);
  }

  add(deposit: Omit<Deposit, 'id' | 'status'>): Deposit {
    const created: Deposit = {
      ...deposit,
      id: `deposit-${globalThis.crypto.randomUUID()}`,
      status: 'Active',
    };
    this.save([created, ...this.depositState()]);
    return created;
  }

  private save(deposits: Deposit[]): void {
    this.storage.write(STORAGE_KEY, deposits);
    this.depositState.set(deposits);
  }
}
