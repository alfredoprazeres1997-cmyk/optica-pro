import type { CurrencyCode } from '../types/optica.ts';

const CURRENCY_RATES: Record<CurrencyCode, number> = {
  AOA: 1,
  EUR: 0.001,
  USD: 0.0011,
};

export function formatMoney(
  value: number | string,
  currency: CurrencyCode = 'AOA'
): string {
  const num = Number(value) || 0;
  const converted = num * (CURRENCY_RATES[currency] ?? 1);

  if (currency === 'AOA') {
    const formatted = new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(converted));
    return `${formatted} Kz`;
  }

  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
