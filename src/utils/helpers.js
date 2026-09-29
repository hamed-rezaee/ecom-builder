export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const cn = (...parts) => parts.filter(Boolean).join(' ');

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'page';

export const FONTS = {
  sans: {
    label: 'Modern sans',
    stack:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  serif: { label: 'Classic serif', stack: 'Georgia, "Times New Roman", serif' },
  humanist: {
    label: 'Humanist',
    stack: '"Trebuchet MS", "Gill Sans", Calibri, sans-serif',
  },
  mono: {
    label: 'Mono',
    stack: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
  },
};

export function contrastColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff';
}

export function themeVars(theme) {
  return {
    '--eb-primary': theme.primary,
    '--eb-on-primary': contrastColor(theme.primary),
    '--eb-bg': theme.background,
    '--eb-text': theme.text,
    '--eb-radius': `${Number(theme.radius) || 0}px`,
    '--eb-font': (FONTS[theme.font] ?? FONTS.sans).stack,
  };
}

export function safeHref(href) {
  const value = String(href ?? '').trim();
  return /^(#|https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(value) ? value : '#';
}

export function safeSrc(src) {
  const value = String(src ?? '').trim();
  return /^(https?:\/\/|data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]|\/(?!\/))/i.test(
    value,
  )
    ? value
    : '';
}

export function placeholderImage(seed = '') {
  let hue = 0;
  for (const ch of String(seed)) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 70% 82%)"/>` +
    `<stop offset="1" stop-color="hsl(${(hue + 40) % 360} 65% 68%)"/>` +
    `</linearGradient></defs><rect width="400" height="400" fill="url(#g)"/>` +
    `<circle cx="200" cy="200" r="56" fill="rgba(255,255,255,.55)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const productImage = (product) =>
  safeSrc(product.image) || placeholderImage(product.name);

export const formatPrice = (price, currency = '$') =>
  `${currency}${(Number(price) || 0).toFixed(2)}`;

export const pageHref = (page) => (page.isHome ? '#/' : `#/p/${page.slug}`);

export const pageRoute = (page) => (page.isHome ? '' : `p/${page.slug}`);

export function linkOptions(site) {
  return [
    ...site.pages.map((p) => [pageHref(p), p.name]),
    ['#/cart', 'Cart'],
    ['#/checkout', 'Checkout'],
  ];
}
