import { formatMoney } from './currency';

export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const cn = (...parts) => parts.filter(Boolean).join(' ');

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'page';

export function contrastColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff';
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

// Returns an embed URL only for YouTube or Vimeo; anything else yields '' so no arbitrary iframe src is rendered.
export function videoEmbedUrl(url) {
  let u;
  try {
    u = new URL(String(url ?? '').trim());
  } catch {
    return '';
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
  const host = u.hostname.replace(/^www\./, '');
  const youtube = ['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'];
  if (host === 'youtu.be' || youtube.includes(host)) {
    const id =
      host === 'youtu.be'
        ? u.pathname.split('/')[1]
        : (u.searchParams.get('v') ??
          /^\/(?:embed|shorts|live)\/([^/]+)/.exec(u.pathname)?.[1]);
    return /^[\w-]{11}$/.test(id ?? '')
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : '';
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = /^\/(?:video\/)?(\d+)/.exec(u.pathname);
    return m ? `https://player.vimeo.com/video/${m[1]}` : '';
  }
  return '';
}

export function mapEmbedUrl(query) {
  const q = String(query ?? '')
    .trim()
    .slice(0, 200);
  return q
    ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
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

export const formatPrice = formatMoney;

export const pageHref = (page) => (page.isHome ? '#/' : `#/p/${page.slug}`);

export const pageRoute = (page) => (page.isHome ? '' : `p/${page.slug}`);

export function linkOptions(site) {
  return [
    ...site.pages.map((p) => [pageHref(p), p.name]),
    ['#/cart', 'Cart'],
    ['#/checkout', 'Checkout'],
  ];
}
