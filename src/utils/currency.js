export const CURRENCIES = [
  ['USD', 'US dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British pound'],
  ['JPY', 'Japanese yen'],
  ['CAD', 'Canadian dollar'],
  ['AUD', 'Australian dollar'],
  ['NZD', 'New Zealand dollar'],
  ['CHF', 'Swiss franc'],
  ['CNY', 'Chinese yuan'],
  ['HKD', 'Hong Kong dollar'],
  ['SGD', 'Singapore dollar'],
  ['INR', 'Indian rupee'],
  ['KRW', 'South Korean won'],
  ['SEK', 'Swedish krona'],
  ['NOK', 'Norwegian krone'],
  ['DKK', 'Danish krone'],
  ['PLN', 'Polish zloty'],
  ['BRL', 'Brazilian real'],
  ['MXN', 'Mexican peso'],
  ['ZAR', 'South African rand'],
  ['AED', 'UAE dirham'],
  ['SAR', 'Saudi riyal'],
  ['TRY', 'Turkish lira'],
  ['ILS', 'Israeli shekel'],
];

export const MAX_CURRENCIES = 8;
export const DEFAULT_LOCALE = 'en-US';

// Sites saved before ISO codes stored a bare symbol.
const LEGACY_SYMBOLS = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
  '₩': 'KRW',
};

export function normalizeCurrencyCode(v, fallback = 'USD') {
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  if (Object.hasOwn(LEGACY_SYMBOLS, s)) return LEGACY_SYMBOLS[s];
  return /^[A-Za-z]{3}$/.test(s) ? s.toUpperCase() : fallback;
}

// Extra currencies shown to visitors; `rate` is units of that currency per 1 unit of base.
export function normalizeCurrencies(raw, base) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set([base]);
  const out = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object') continue;
    const code = normalizeCurrencyCode(c.code, '');
    const rate = Number(c.rate);
    if (!code || seen.has(code) || !(rate > 0) || !Number.isFinite(rate))
      continue;
    seen.add(code);
    out.push({ code, rate: Math.min(1e6, Math.max(1e-6, rate)) });
    if (out.length >= MAX_CURRENCIES) break;
  }
  return out;
}

export function formatMoney(amount, currency = 'USD', locale = DEFAULT_LOCALE) {
  const n = Number(amount) || 0;
  const code = normalizeCurrencyCode(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).format(n);
  } catch {
    return `${code} ${n.toFixed(2)}`;
  }
}
