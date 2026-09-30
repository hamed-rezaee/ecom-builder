import { registry } from '../blocks/registry';
import { PRESET_KEYS } from '../data/themePresets';
import { createStarterSite } from '../data/starterSite';
import { normalizeAnim } from '../utils/animation';
import { slugify, uid } from '../utils/helpers';
import { normalizeTheme } from '../utils/theme';

export const SITE_FILE_VERSION = 1;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

const isObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, fallback) => (typeof v === 'string' ? v : fallback);

function normalizeBlock(raw) {
  if (!isObject(raw) || !registry[raw.type] || registry[raw.type].global)
    return null;
  const defaults = structuredClone(registry[raw.type].defaults);
  const block = {
    id: str(raw.id, '') || uid('b'),
    type: raw.type,
    props: { ...defaults, ...(isObject(raw.props) ? raw.props : {}) },
  };
  if (isObject(raw.anim)) block.anim = normalizeAnim(raw.anim);
  return block;
}

function normalizePresets(raw, customFonts) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw
    .filter((p) => isObject(p) && str(p.id, '') && isObject(p.theme))
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .slice(0, 24)
    .map((p) => {
      const theme = normalizeTheme({ ...p.theme, customFonts });
      return {
        id: p.id,
        name: str(p.name, 'Preset').slice(0, 40) || 'Preset',
        theme: Object.fromEntries(PRESET_KEYS.map((k) => [k, theme[k]])),
      };
    });
}

// Returns a structurally valid site or throws an Error with a user-facing message.
export function normalizeSite(input) {
  if (!isObject(input)) throw new Error('File is not a site export.');
  if (!Array.isArray(input.pages) || input.pages.length === 0) {
    throw new Error('Site has no pages.');
  }
  const base = createStarterSite();
  const usedIds = new Set();
  const usedSlugs = new Set();

  const pages = input.pages.map((p, i) => {
    if (!isObject(p)) throw new Error(`Page ${i + 1} is invalid.`);
    const name = str(p.name, '').trim() || `Page ${i + 1}`;
    let id = str(p.id, '') || uid('pg');
    while (usedIds.has(id)) id = uid('pg');
    usedIds.add(id);
    const baseSlug = slugify(str(p.slug, '') || name);
    let slug = baseSlug;
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${baseSlug}-${n}`;
    usedSlugs.add(slug);
    const seen = new Set();
    const blocks = (Array.isArray(p.blocks) ? p.blocks : [])
      .map(normalizeBlock)
      .filter(Boolean)
      .map((b) => {
        while (seen.has(b.id)) b.id = uid('b');
        seen.add(b.id);
        return b;
      });
    return { id, name, slug, isHome: p.isHome === true, blocks };
  });
  if (!pages.some((p) => p.isHome)) pages[0].isHome = true;

  const products = (Array.isArray(input.products) ? input.products : [])
    .filter((p) => isObject(p) && str(p.id, ''))
    .map((p) => ({
      id: p.id,
      name: str(p.name, 'Product'),
      price: Number.isFinite(Number(p.price)) ? Number(p.price) : 0,
      description: str(p.description, ''),
      image: str(p.image, ''),
    }));

  const theme = normalizeTheme({
    ...base.theme,
    ...(isObject(input.theme) ? input.theme : {}),
  });

  return {
    name: str(input.name, base.name),
    theme,
    themePresets: normalizePresets(input.themePresets, theme.customFonts),
    header: { ...base.header, ...(isObject(input.header) ? input.header : {}) },
    footer: { ...base.footer, ...(isObject(input.footer) ? input.footer : {}) },
    products,
    pages,
  };
}

export function serializeSite(site) {
  return JSON.stringify(
    { format: 'ecom-builder-site', version: SITE_FILE_VERSION, site },
    null,
    2,
  );
}

export function parseSiteFile(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  if (isObject(data) && data.format === 'ecom-builder-site') {
    if (data.version > SITE_FILE_VERSION) {
      throw new Error('File was created by a newer version of the builder.');
    }
    return normalizeSite(data.site);
  }
  return normalizeSite(data);
}

export function downloadSiteJson(site) {
  const blob = new Blob([serializeSite(site)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(site.name)}.site.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
