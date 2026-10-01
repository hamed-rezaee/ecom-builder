import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  normalizeCurrencies,
  normalizeCurrencyCode,
} from './currency';
import { normalizeTheme } from './theme';

describe('currency', () => {
  it('maps legacy symbols and rejects junk', () => {
    expect(normalizeCurrencyCode('€')).toBe('EUR');
    expect(normalizeCurrencyCode('gbp')).toBe('GBP');
    expect(normalizeCurrencyCode('kr')).toBe('USD');
    expect(normalizeCurrencyCode(5)).toBe('USD');
  });

  it('cleans the extra currency list', () => {
    const list = normalizeCurrencies(
      [
        { code: 'EUR', rate: 0.9 },
        { code: 'EUR', rate: 2 },
        { code: 'USD', rate: 1 },
        { code: 'GBP', rate: -1 },
        null,
      ],
      'USD',
    );
    expect(list).toEqual([{ code: 'EUR', rate: 0.9 }]);
  });

  it('formats with Intl', () => {
    expect(formatMoney(9, 'USD')).toBe('$9.00');
    expect(formatMoney(1234.5, 'EUR', 'de-DE')).toBe('1.234,50\u00a0€');
    expect(formatMoney('x', '$')).toBe('$0.00');
  });

  it('migrates an old theme symbol', () => {
    const t = normalizeTheme({ currency: '€' });
    expect(t.currency).toBe('EUR');
    expect(t.currencies).toEqual([]);
  });
});
