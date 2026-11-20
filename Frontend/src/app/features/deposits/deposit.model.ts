export type DepositStatus = 'Active' | 'Matured';

export interface Deposit {
  id: string;
  institution: string;
  customerName: string;
  kind: 'Fixed deposit';
  principal: number;
  annualRate: number;
  startDate: string;
  maturityDate: string;
  accountNumber: string;
  hasNominee: boolean;
  nomineeName: string | null;
  autoRenew: boolean;
  status: DepositStatus;
}

export function calculateMaturityValue(deposit: Deposit): number {
  const years =
    (new Date(deposit.maturityDate).getTime() -
      new Date(deposit.startDate).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);
  const periods = 4;
  return Math.round(
    deposit.principal *
      Math.pow(1 + deposit.annualRate / 100 / periods, periods * years),
  );
}

export function formatTenure(startDate: string, maturityDate: string): string | null {
  const start = new Date(`${startDate}T00:00:00Z`);
  const maturity = new Date(`${maturityDate}T00:00:00Z`);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(maturity.getTime()) ||
    maturity <= start
  ) {
    return null;
  }

  const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    const originalDay = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);
    const lastDay = new Date(
      Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
    ).getUTCDate();
    result.setUTCDate(Math.min(originalDay, lastDay));
    return result;
  };

  let totalMonths =
    (maturity.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    maturity.getUTCMonth() -
    start.getUTCMonth();
  while (totalMonths > 0 && addMonths(start, totalMonths) > maturity) {
    totalMonths -= 1;
  }

  const anniversary = addMonths(start, totalMonths);
  const remainingDays = Math.round(
    (maturity.getTime() - anniversary.getTime()) / (24 * 60 * 60 * 1000),
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  }
  if (remainingDays > 0 || parts.length === 0) {
    parts.push(`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`);
  }

  return parts.join(' ');
}

export function daysUntilMaturity(deposit: Deposit, now = new Date()): number {
  const maturity = new Date(`${deposit.maturityDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(
    0,
    Math.ceil((maturity.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
  );
}
