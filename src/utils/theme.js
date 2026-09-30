import {
  FONT_EXTENSIONS,
  GOOGLE_FONTS,
  isGoogleFont,
  isSystemFont,
  resolveFont,
  uploadedFamily,
} from '../data/fonts';
import { EASINGS, ENTRANCES, HOVERS, PAGE_TRANSITIONS } from './animation';
import { contrastColor } from './helpers';

export const MAX_CUSTOM_FONTS = 3;
export const MAX_FONT_BYTES = 500 * 1024;

export const DEFAULT_THEME = {
  primary: '#4f46e5',
  secondary: '',
  background: '#ffffff',
  text: '#111827',
  surface: '',
  border: '',
  muted: '',
  font: 'sans',
  headingFont: '',
  headingWeight: 600,
  baseSize: 16,
  lineHeight: 1.5,
  radius: 8,
  buttonStyle: 'solid',
  buttonShape: 'inherit',
  shadow: 'none',
  containerWidth: 1120,
  sectionSpacing: 72,
  animEntrance: 'none',
  animHover: 'none',
  animDuration: 600,
  animEasing: 'ease-out',
  animOnce: true,
  pageTransition: 'none',
  smoothScroll: false,
  scrollProgress: false,
  darkMode: 'off',
  darkBackground: '#0f172a',
  darkText: '#f1f5f9',
  darkPrimary: '#818cf8',
  currency: '$',
  customFonts: [],
};

const BUTTON_STYLES = ['solid', 'outline', 'soft'];
const BUTTON_SHAPES = ['inherit', 'square', 'pill'];
const SHADOWS = {
  none: '0 0 #0000',
  sm: '0 1px 3px rgb(0 0 0 / 0.14)',
  md: '0 4px 14px rgb(0 0 0 / 0.14)',
  lg: '0 12px 32px rgb(0 0 0 / 0.2)',
};
const DARK_MODES = ['off', 'toggle', 'system'];

const HEX = /^#[0-9a-f]{6}$/i;
const FONT_DATA = /^data:[a-z0-9.+/-]*;base64,[A-Za-z0-9+/=]+$/i;
const FONT_ID = /^[a-z0-9_]{1,24}$/i;

const color = (v, fb) => (typeof v === 'string' && HEX.test(v) ? v : fb);
const num = (v, min, max, fb) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
};
const oneOf = (v, list, fb) => (list.includes(v) ? v : fb);
const entries = (list) => list.map(([v]) => v);

function normalizeCustomFonts(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw
    .filter(
      (f) =>
        f &&
        typeof f === 'object' &&
        FONT_ID.test(f.id ?? '') &&
        Object.hasOwn(FONT_EXTENSIONS, f.ext) &&
        typeof f.data === 'string' &&
        f.data.length <= MAX_FONT_BYTES * 1.4 &&
        FONT_DATA.test(f.data),
    )
    .filter((f) => !seen.has(f.id) && seen.add(f.id))
    .slice(0, MAX_CUSTOM_FONTS)
    .map((f) => ({
      id: f.id,
      name:
        String(f.name ?? 'Custom font')
          .replace(/[^\w .-]/g, '')
          .slice(0, 40) || 'Custom font',
      ext: f.ext,
      data: f.data,
    }));
}

function fontValue(v, customFonts, fallback) {
  if (isSystemFont(v) || isGoogleFont(v)) return v;
  if (
    typeof v === 'string' &&
    v.startsWith('u:') &&
    customFonts.some((f) => f.id === v.slice(2))
  )
    return v;
  return fallback;
}

// Validates every field so the result is safe to interpolate into CSS.
export function normalizeTheme(raw) {
  const t = {
    ...DEFAULT_THEME,
    ...(raw && typeof raw === 'object' ? raw : {}),
  };
  const d = DEFAULT_THEME;
  const customFonts = normalizeCustomFonts(t.customFonts);
  return {
    primary: color(t.primary, d.primary),
    secondary: color(t.secondary, ''),
    background: color(t.background, d.background),
    text: color(t.text, d.text),
    surface: color(t.surface, ''),
    border: color(t.border, ''),
    muted: color(t.muted, ''),
    font: fontValue(t.font, customFonts, d.font),
    headingFont: fontValue(t.headingFont, customFonts, ''),
    headingWeight: num(t.headingWeight, 400, 900, d.headingWeight),
    baseSize: num(t.baseSize, 13, 22, d.baseSize),
    lineHeight: num(t.lineHeight, 1.2, 2, d.lineHeight),
    radius: num(t.radius, 0, 32, d.radius),
    buttonStyle: oneOf(t.buttonStyle, BUTTON_STYLES, d.buttonStyle),
    buttonShape: oneOf(t.buttonShape, BUTTON_SHAPES, d.buttonShape),
    shadow: oneOf(t.shadow, Object.keys(SHADOWS), d.shadow),
    containerWidth: num(t.containerWidth, 640, 1600, d.containerWidth),
    sectionSpacing: num(t.sectionSpacing, 16, 160, d.sectionSpacing),
    animEntrance: oneOf(t.animEntrance, entries(ENTRANCES), d.animEntrance),
    animHover: oneOf(t.animHover, entries(HOVERS), d.animHover),
    animDuration: num(t.animDuration, 100, 3000, d.animDuration),
    animEasing: oneOf(t.animEasing, entries(EASINGS), d.animEasing),
    animOnce: t.animOnce !== false,
    pageTransition: oneOf(
      t.pageTransition,
      entries(PAGE_TRANSITIONS),
      d.pageTransition,
    ),
    smoothScroll: t.smoothScroll === true,
    scrollProgress: t.scrollProgress === true,
    darkMode: oneOf(t.darkMode, DARK_MODES, d.darkMode),
    darkBackground: color(t.darkBackground, d.darkBackground),
    darkText: color(t.darkText, d.darkText),
    darkPrimary: color(t.darkPrimary, d.darkPrimary),
    currency:
      typeof t.currency === 'string' ? t.currency.slice(0, 3) : d.currency,
    customFonts,
  };
}

// Google families the site actually uses, for the stylesheet link.
export function usedGoogleFonts(theme) {
  const t = normalizeTheme(theme);
  const used = [t.font, t.headingFont].filter(isGoogleFont);
  return GOOGLE_FONTS.filter((f) => used.includes(`g:${f.name}`));
}

function palette(t, { bg, text, primary }, custom) {
  const secondary = t.secondary || primary;
  return [
    `--eb-bg:${bg}`,
    `--eb-text:${text}`,
    `--eb-primary:${primary}`,
    `--eb-on-primary:${contrastColor(primary)}`,
    `--eb-secondary:${secondary}`,
    `--eb-on-secondary:${contrastColor(secondary)}`,
    `--eb-muted:${custom.muted || 'color-mix(in srgb, var(--eb-text) 62%, var(--eb-bg))'}`,
    `--eb-surface:${custom.surface || 'color-mix(in srgb, var(--eb-text) 5%, var(--eb-bg))'}`,
    `--eb-border:${custom.border || 'color-mix(in srgb, var(--eb-text) 14%, var(--eb-bg))'}`,
  ].join(';');
}

const BUTTONS = {
  solid: {
    bg: 'var(--eb-primary)',
    fg: 'var(--eb-on-primary)',
    ring: '0 0 #0000',
  },
  outline: {
    bg: 'transparent',
    fg: 'var(--eb-primary)',
    ring: 'inset 0 0 0 1.5px var(--eb-primary)',
  },
  soft: {
    bg: 'color-mix(in srgb, var(--eb-primary) 14%, var(--eb-bg))',
    fg: 'var(--eb-primary)',
    ring: '0 0 #0000',
  },
};

// CSS for the theme. fontSrc(font) picks the URL of an uploaded font; it defaults to the embedded data URI.
export function themeCss(raw, { fontSrc = (f) => f.data } = {}) {
  const t = normalizeTheme(raw);
  const body = resolveFont(t.font, t.customFonts);
  const head = t.headingFont ? resolveFont(t.headingFont, t.customFonts) : body;
  const btn = BUTTONS[t.buttonStyle];
  const custom = { muted: t.muted, surface: t.surface, border: t.border };

  const faces = t.customFonts
    .map(
      (f) =>
        `@font-face{font-family:"${uploadedFamily(f.id)}";src:url("${fontSrc(f)}") format("${FONT_EXTENSIONS[f.ext]}");font-weight:100 900;font-display:swap}`,
    )
    .join('\n');

  const light = [
    palette(t, { bg: t.background, text: t.text, primary: t.primary }, custom),
    `--eb-font:${body.stack}`,
    `--eb-heading-font:${head.stack}`,
    `--eb-heading-weight:${t.headingWeight}`,
    `--eb-base-size:${t.baseSize}px`,
    `--eb-line:${t.lineHeight}`,
    `--eb-radius:${t.radius}px`,
    `--eb-btn-radius:${{ inherit: 'var(--eb-radius)', square: '0px', pill: '999px' }[t.buttonShape]}`,
    `--eb-btn-bg:${btn.bg}`,
    `--eb-btn-fg:${btn.fg}`,
    `--eb-btn-ring:${btn.ring}`,
    `--eb-shadow:${SHADOWS[t.shadow]}`,
    `--eb-container:${t.containerWidth}px`,
    `--eb-section-y:${t.sectionSpacing}px`,
  ].join(';');

  const dark = palette(
    t,
    { bg: t.darkBackground, text: t.darkText, primary: t.darkPrimary },
    {},
  );
  const rules = [faces, `.eb-site{${light}}`];
  if (t.darkMode !== 'off') rules.push(`.eb-site[data-theme="dark"]{${dark}}`);
  if (t.darkMode === 'system') {
    rules.push(
      `@media (prefers-color-scheme:dark){.eb-site:not([data-theme="light"]){${dark}}}`,
    );
  }
  return rules.filter(Boolean).join('\n');
}
