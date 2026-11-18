import { TestBed } from '@angular/core/testing';
import { Deposit } from './deposit.model';
import { DepositsService } from './deposits.service';
import { StorageService } from '../../core/services/storage.service';

describe('DepositsService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [DepositsService, StorageService],
    });
  });

  it('starts with mock deposits and computes portfolio totals', () => {
    const service = TestBed.inject(DepositsService);
    expect(service.deposits().length).toBe(6);
    expect(service.totalInvested()).toBe(1000000);
    expect(service.activeCount()).toBe(6);
    expect(service.projectedValue()).toBeGreaterThan(service.totalInvested());
  });

  it('adds and persists a new deposit', () => {
    const service = TestBed.inject(DepositsService);
    const deposit: Omit<Deposit, 'id' | 'status'> = {
      institution: 'New Bank',
      customerName: 'Jordan Lee',
      kind: 'Fixed deposit',
      principal: 20000,
      annualRate: 6.5,
      startDate: '2026-01-01',
      maturityDate: '2027-01-01',
      accountNumber: '•••• 5555',
      hasNominee: true,
      nomineeName: 'Casey Lee',
    };
    const created = service.add(deposit);

    expect(created.id.startsWith('deposit-')).toBeTrue();
    expect(created.status).toBe('Active');
    expect(service.deposits()[0]).toEqual(created);
    expect(localStorage.getItem('nestegg.deposits.v1')).toContain('New Bank');
  });

  it('uses valid persisted deposits instead of the mock set', () => {
    const persisted: Deposit[] = [
      {
        id: 'saved-1',
        institution: 'Saved Bank',
        customerName: 'Sam Taylor',
        kind: 'Fixed deposit',
        principal: 10000,
        annualRate: 5,
        startDate: '2026-01-01',
        maturityDate: '2027-01-01',
        accountNumber: '•••• 1111',
        hasNominee: false,
        nomineeName: null,
        status: 'Active',
      },
    ];
    localStorage.setItem('nestegg.deposits.v1', JSON.stringify(persisted));

    const service = TestBed.inject(DepositsService);
    expect(service.deposits()).toEqual(persisted);
  });

  it('normalizes saved fixed deposits and removes legacy recurring deposits', () => {
    const fixedDeposit = {
      id: 'saved-1',
      institution: 'Saved Bank',
      kind: 'Fixed deposit',
      principal: 10000,
      annualRate: 5,
      startDate: '2026-01-01',
      maturityDate: '2027-01-01',
      accountNumber: '•••• 1111',
      compounding: 'Yearly',
      status: 'Active',
    };
    const recurringDeposit = {
      ...fixedDeposit,
      id: 'old-rd',
      kind: 'Recurring deposit',
    };
    localStorage.setItem(
      'nestegg.deposits.v1',
      JSON.stringify([fixedDeposit, recurringDeposit]),
    );

    const service = TestBed.inject(DepositsService);
    const [normalized] = service.deposits();
    expect(service.deposits().length).toBe(1);
    expect(normalized.id).toBe('saved-1');
    expect(normalized.customerName).toBe('Not provided');
    expect(normalized.hasNominee).toBeFalse();
    expect(normalized.nomineeName).toBeNull();
    expect('compounding' in normalized).toBeFalse();
    expect(JSON.parse(localStorage.getItem('nestegg.deposits.v1')!)).toEqual([
      normalized,
    ]);
  });
});
