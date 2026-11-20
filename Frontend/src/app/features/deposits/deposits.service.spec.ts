import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Deposit } from './deposit.model';
import { DepositsService } from './deposits.service';
import { environment } from '../../../environments/environment';
import { AuthSessionService } from '../../core/auth/auth-session.service';

const DEPOSITS_URL = `${environment.apiBaseUrl}/api/v1/deposits`;

describe('DepositsService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        DepositsService,
        {
          provide: AuthSessionService,
          useValue: { getUserId: () => Promise.resolve('firebase-user-test') },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the API records and computes portfolio totals', async () => {
    const service = TestBed.inject(DepositsService);
    const pending = service.load();
    const request = http.expectOne(DEPOSITS_URL);

    expect(request.request.method).toBe('GET');
    request.flush([serverDeposit]);
    await pending;

    expect(service.deposits()).toEqual([serverDeposit]);
    expect(service.totalInvested()).toBe(100000);
    expect(service.activeCount()).toBe(1);
    expect(service.projectedValue()).toBeGreaterThan(service.totalInvested());
  });

  it('converts decimal strings from the API to numbers before computing totals', async () => {
    const service = TestBed.inject(DepositsService);
    const pending = service.load();
    http.expectOne(DEPOSITS_URL).flush([
      { ...serverDeposit, principal: '250000.00', annualRate: '7.50' },
      {
        ...serverDeposit,
        id: 'server-deposit-2',
        principal: '150000.00',
        annualRate: '6.95',
      },
    ]);
    await pending;

    expect(service.deposits().map((deposit) => deposit.principal)).toEqual([
      250000,
      150000,
    ]);
    expect(service.totalInvested()).toBe(400000);
    expect(typeof service.projectedValue()).toBe('number');
  });

  it('saves the auto-renew preference through the API', async () => {
    const service = TestBed.inject(DepositsService);
    const pendingLoad = service.load();
    http.expectOne(DEPOSITS_URL).flush([]);
    await pendingLoad;

    const adding = service.add({ ...newDeposit, autoRenew: true });
    await Promise.resolve();
    await Promise.resolve();
    const request = http.expectOne(DEPOSITS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.autoRenew).toBeTrue();
    const createdDeposit = { ...serverDeposit, autoRenew: true };
    request.flush(createdDeposit);
    const created = await adding;

    expect(created).toEqual(createdDeposit);
    expect(service.deposits()).toEqual([createdDeposit]);
    expect(localStorage.getItem('nestegg.deposits.v1')).toBeNull();
  });

  it('offers an explicit import for saved non-demo browser deposits', async () => {
    const legacy = {
      ...serverDeposit,
      id: 'deposit-legacy',
      customerName: 'Existing Customer',
    };
    localStorage.setItem('nestegg.deposits.v1', JSON.stringify([legacy]));
    const originalLocalData = localStorage.getItem('nestegg.deposits.v1');
    const service = TestBed.inject(DepositsService);
    const pendingLoad = service.load();
    http.expectOne(DEPOSITS_URL).flush([]);
    await pendingLoad;

    expect(service.pendingLegacyImport()).toEqual([legacy]);

    const importing = service.importLegacyDeposits();
    await Promise.resolve();
    const request = http.expectOne(`${DEPOSITS_URL}/import`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.deposits[0].customerName).toBe('Existing Customer');
    const imported = { ...serverDeposit, id: 'server-generated-id' };
    request.flush([imported]);
    await importing;

    expect(service.deposits()).toEqual([imported]);
    expect(service.pendingLegacyImport()).toBeNull();
    expect(localStorage.getItem('nestegg.deposits.v1')).toBe(originalLocalData);
    expect(
      localStorage.getItem('nestegg.deposits.imported.firebase-user-test'),
    ).toBe('true');
  });

  it('defaults the auto-renew preference for legacy browser deposits', async () => {
    const legacy: Record<string, unknown> = {
      ...serverDeposit,
      id: 'legacy-without-auto-renew',
    };
    delete legacy['autoRenew'];
    localStorage.setItem('nestegg.deposits.v1', JSON.stringify([legacy]));
    const service = TestBed.inject(DepositsService);
    const pendingLoad = service.load();
    http.expectOne(DEPOSITS_URL).flush([]);
    await pendingLoad;

    expect(service.pendingLegacyImport()?.[0].autoRenew).toBeFalse();
  });

  it('keeps local deposits separate when the server already has records', async () => {
    localStorage.setItem(
      'nestegg.deposits.v1',
      JSON.stringify([{ ...serverDeposit, id: 'deposit-legacy' }]),
    );
    const service = TestBed.inject(DepositsService);
    const pendingLoad = service.load();
    http.expectOne(DEPOSITS_URL).flush([serverDeposit]);
    await pendingLoad;

    expect(service.pendingLegacyImport()).toBeNull();
    expect(service.blockedLegacyImportCount()).toBe(1);
    expect(service.deposits()).toEqual([serverDeposit]);
  });

  it('does not replace API failures with sample deposits', async () => {
    const service = TestBed.inject(DepositsService);
    const pendingLoad = service.load();
    http.expectOne(DEPOSITS_URL).flush(
      { detail: 'Unavailable' },
      { status: 503, statusText: 'Unavailable' },
    );
    await pendingLoad;

    expect(service.deposits()).toEqual([]);
    expect(service.loaded()).toBeFalse();
    expect(service.error()).toContain('Could not load deposits');
  });

  const serverDeposit: Deposit = {
    id: 'server-deposit-1',
    institution: 'Example Bank',
    customerName: 'Aarav Sharma',
    kind: 'Fixed deposit',
    principal: 100000,
    annualRate: 7.5,
    startDate: '2026-01-01',
    maturityDate: '2027-01-01',
    accountNumber: '•••• 4821',
    hasNominee: false,
    nomineeName: null,
    autoRenew: false,
    status: 'Active',
  };

  const newDeposit: Omit<Deposit, 'id' | 'status'> = {
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
    autoRenew: false,
  };
});
