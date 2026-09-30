// Font values stored in the theme: a system key ('sans'), 'g:<Google family>' or 'u:<uploaded font id>'.

const SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

export const SYSTEM_FONTS = {
  sans: { label: 'Modern sans', stack: SANS },
  serif: { label: 'Classic serif', stack: SERIF },
  humanist: {
    label: 'Humanist',
    stack: '"Trebuchet MS", "Gill Sans", Calibri, sans-serif',
  },
  mono: { label: 'Mono', stack: MONO },
};

const FALLBACK = { sans: SANS, serif: SERIF, mono: MONO };

// Weights are limited to ones each family serves; asking for a missing weight fails the whole request.
const g = (name, kind, weights) => ({ name, kind, weights });
export const GOOGLE_FONTS = [
  g('Inter', 'sans', '400;500;600;700;800'),
  g('Poppins', 'sans', '400;500;600;700;800'),
  g('Montserrat', 'sans', '400;500;600;700;800'),
  g('DM Sans', 'sans', '400;500;600;700'),
  g('Nunito', 'sans', '400;600;700;800'),
  g('Raleway', 'sans', '400;500;600;700;800'),
  g('Work Sans', 'sans', '400;500;600;700;800'),
  g('Manrope', 'sans', '400;500;600;700;800'),
  g('Outfit', 'sans', '400;500;600;700;800'),
  g('Space Grotesk', 'sans', '400;500;700'),
  g('Rubik', 'sans', '400;500;600;700;800'),
  g('Oswald', 'sans', '400;500;600;700'),
  g('Bebas Neue', 'sans', '400'),
  g('Playfair Display', 'serif', '400;500;600;700;800'),
  g('Lora', 'serif', '400;500;600;700'),
  g('Merriweather', 'serif', '400;700'),
  g('Source Serif 4', 'serif', '400;600;700;800'),
  g('Cormorant Garamond', 'serif', '400;500;600;700'),
  g('DM Serif Display', 'serif', '400'),
  g('Roboto Slab', 'serif', '400;500;600;700;800'),
  g('Lobster', 'sans', '400'),
  g('Pacifico', 'sans', '400'),
  g('Fira Code', 'mono', '400;500;700'),
  g('Space Mono', 'mono', '400;700'),
];

const GOOGLE_BY_NAME = Object.fromEntries(GOOGLE_FONTS.map((f) => [f.name, f]));

export const FONT_EXTENSIONS = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
};

export const isSystemFont = (v) => Object.hasOwn(SYSTEM_FONTS, v);
export const isGoogleFont = (v) =>
  typeof v === 'string' &&
  v.startsWith('g:') &&
  Object.hasOwn(GOOGLE_BY_NAME, v.slice(2));
export const uploadedFamily = (id) => `eb-font-${id}`;

// Returns { stack, google?, upload? }; unknown values fall back to the default sans font.
export function resolveFont(value, customFonts = []) {
  if (isSystemFont(value)) return { stack: SYSTEM_FONTS[value].stack };
  if (isGoogleFont(value)) {
    const f = GOOGLE_BY_NAME[value.slice(2)];
    return { stack: `"${f.name}", ${FALLBACK[f.kind]}`, google: f };
  }
  if (typeof value === 'string' && value.startsWith('u:')) {
    const upload = customFonts.find((f) => f.id === value.slice(2));
    if (upload)
      return { stack: `"${uploadedFamily(upload.id)}", ${SANS}`, upload };
  }
  return { stack: SANS };
}

export function googleFontsUrl(families) {
  const parts = families.map(
    (f) => `family=${f.name.replace(/ /g, '+')}:wght@${f.weights}`,
  );
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
}
