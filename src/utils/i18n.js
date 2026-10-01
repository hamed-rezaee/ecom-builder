// Pure locale helpers. Keep this file free of block/registry imports so components can use ui().

export const LOCALES = [
  ['en', 'English'],
  ['fr', 'Français'],
  ['es', 'Español'],
  ['de', 'Deutsch'],
  ['it', 'Italiano'],
  ['pt', 'Português'],
  ['nl', 'Nederlands'],
  ['sv', 'Svenska'],
  ['pl', 'Polski'],
  ['tr', 'Türkçe'],
  ['ru', 'Русский'],
  ['ar', 'العربية'],
  ['he', 'עברית'],
  ['ja', '日本語'],
  ['ko', '한국어'],
  ['zh', '中文'],
];

export const MAX_LOCALES = 8;
const MAX_TRANSLATION_LENGTH = 5000;
const RTL = new Set(['ar', 'he', 'fa', 'ur']);
const CODES = new Set(LOCALES.map(([code]) => code));

export const DEFAULT_LOCALES = { default: 'en', enabled: [] };

export const localeName = (code) =>
  LOCALES.find(([c]) => c === code)?.[1] ?? code;

export const localeDir = (code) => (RTL.has(code) ? 'rtl' : 'ltr');

// Built-in store text; each one is translatable in the Languages panel.
export const UI_STRINGS = {
  addToCart: 'Add to cart',
  added: 'Added ✓',
  viewDetails: 'View details',
  viewCart: 'View cart',
  continueShopping: 'Continue shopping',
  loadMore: 'Load more',
  previous: 'Previous',
  next: 'Next',
  inCart: 'In cart: {count}',
  cart: 'Cart',
  yourCart: 'Your cart',
  cartEmpty: 'Your cart is empty.',
  startShopping: 'Start shopping',
  subtotal: 'Subtotal: {amount}',
  checkout: 'Checkout',
  fullName: 'Full name',
  email: 'Email',
  address: 'Address',
  city: 'City',
  postalCode: 'Postal code',
  placeOrder: 'Place order',
  demoNote: 'Demo checkout: no payment is taken and no data is sent anywhere.',
  orderSummary: 'Order summary',
  total: 'Total',
  thanks: 'Thank you, {name}!',
  orderPlaced:
    'Order {number} was placed. This is a demo store, so nothing was charged.',
  remove: 'Remove',
  removeItem: 'Remove {name}',
  decreaseQty: 'Decrease quantity',
  increaseQty: 'Increase quantity',
  notFound: 'Page not found',
  backHome: 'Back to home',
  language: 'Language',
  currency: 'Currency',
  name: 'Name',
  message: 'Message',
  sendMessage: 'Send message',
  emailAddress: 'Email address',
  subscribed: 'Thanks for subscribing!',
  messageSent: 'Thanks! Your message was received (demo, nothing was sent).',
};

export const uiKeys = Object.keys(UI_STRINGS);

export const ui = (site, key) => site?.ui?.[key] ?? UI_STRINGS[key];

export const fmt = (text, vars = {}) =>
  String(text).replace(/\{(\w+)\}/g, (m, k) =>
    Object.hasOwn(vars, k) ? String(vars[k]) : m,
  );

const isObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

export function normalizeLocales(raw) {
  const r = isObject(raw) ? raw : {};
  const def = CODES.has(r.default) ? r.default : DEFAULT_LOCALES.default;
  const enabled = [];
  for (const c of Array.isArray(r.enabled) ? r.enabled : []) {
    if (CODES.has(c) && c !== def && !enabled.includes(c)) enabled.push(c);
    if (enabled.length >= MAX_LOCALES) break;
  }
  return { default: def, enabled };
}

// translations[locale][key] = text; unknown locales and blank values are dropped.
export function normalizeTranslations(raw, locales) {
  const out = {};
  for (const code of locales.enabled) {
    const src = isObject(raw?.[code]) ? raw[code] : {};
    const map = {};
    for (const [k, v] of Object.entries(src)) {
      if (typeof v === 'string' && v.trim() && k.length <= 120)
        map[k] = v.slice(0, MAX_TRANSLATION_LENGTH);
    }
    out[code] = map;
  }
  return out;
}
