import { cn } from './helpers';

export const ENTRANCES = [
  ['none', 'None'],
  ['fade', 'Fade in'],
  ['fade-up', 'Fade up'],
  ['fade-down', 'Fade down'],
  ['fade-left', 'Fade from right'],
  ['fade-right', 'Fade from left'],
  ['zoom-in', 'Zoom in'],
  ['zoom-out', 'Zoom out'],
  ['flip-up', 'Flip up'],
];

export const HOVERS = [
  ['none', 'None'],
  ['lift', 'Lift'],
  ['scale', 'Scale up'],
  ['glow', 'Glow'],
];

export const EASINGS = [
  ['ease-out', 'Ease out'],
  ['ease', 'Ease'],
  ['ease-in-out', 'Ease in-out'],
  ['ease-out-back', 'Bounce out'],
  ['linear', 'Linear'],
];

export const PAGE_TRANSITIONS = [
  ['none', 'None'],
  ['fade', 'Fade'],
  ['slide', 'Slide up'],
];

const values = (list) => list.map(([v]) => v);
const clamp = (v, min, max, fb) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
};

export const DEFAULT_ANIM = {
  entrance: 'inherit',
  hover: 'inherit',
  delay: 0,
  duration: 0,
};

// Per-block animation settings; 'inherit' and duration 0 defer to the theme defaults.
export function normalizeAnim(raw) {
  const a = raw && typeof raw === 'object' ? raw : {};
  return {
    entrance:
      a.entrance === 'inherit' || values(ENTRANCES).includes(a.entrance)
        ? a.entrance
        : 'inherit',
    hover:
      a.hover === 'inherit' || values(HOVERS).includes(a.hover)
        ? a.hover
        : 'inherit',
    delay: clamp(a.delay, 0, 2000, 0),
    duration: clamp(a.duration, 0, 3000, 0),
  };
}

// Wrapper attributes for a block, or null when it needs no wrapper.
export function animAttrs(rawAnim, theme) {
  const a = normalizeAnim(rawAnim);
  const entrance =
    a.entrance === 'inherit' ? (theme.animEntrance ?? 'none') : a.entrance;
  const hover = a.hover === 'inherit' ? (theme.animHover ?? 'none') : a.hover;
  if (entrance === 'none' && hover === 'none') return null;
  const attrs = {
    className: cn('eb-anim', hover !== 'none' && `eb-hover-${hover}`),
  };
  if (entrance !== 'none') {
    attrs['data-aos'] = entrance;
    if (a.delay) attrs['data-aos-delay'] = String(a.delay);
    if (a.duration) attrs['data-aos-duration'] = String(a.duration);
  }
  return attrs;
}
