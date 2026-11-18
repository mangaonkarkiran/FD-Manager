import {
  calculateMaturityValue,
  daysUntilMaturity,
  Deposit,
  formatTenure,
} from './deposit.model';

describe('deposit calculations', () => {
  const fixedDeposit: Deposit = {
    id: 'fixed-1',
    institution: 'Example Bank',
    customerName: 'Avery Morgan',
    kind: 'Fixed deposit',
    principal: 100000,
    annualRate: 7.25,
    startDate: '2026-01-01',
    maturityDate: '2027-01-01',
    accountNumber: '•••• 1234',
    hasNominee: false,
    nomineeName: null,
    status: 'Active',
  };

  it('calculates compound interest for a fixed deposit', () => {
    const periods = 4;
    const years = 365 / 365.25;
    const expected = Math.round(
      fixedDeposit.principal *
        Math.pow(1 + fixedDeposit.annualRate / 100 / periods, periods * years),
    );
    expect(calculateMaturityValue(fixedDeposit)).toBe(expected);
  });

  it('returns the days remaining and clamps matured deposits to zero', () => {
    const now = new Date(2026, 0, 1);
    expect(daysUntilMaturity(fixedDeposit, now)).toBe(365);
    expect(
      daysUntilMaturity({ ...fixedDeposit, maturityDate: '2025-12-31' }, now),
    ).toBe(0);
  });

  it('formats tenure from the start and maturity dates', () => {
    expect(formatTenure('2026-01-01', '2027-07-01')).toBe('1 year 6 months');
    expect(formatTenure('2026-01-01', '2026-01-15')).toBe('14 days');
    expect(formatTenure('2026-02-01', '2026-01-31')).toBeNull();
  });
});
