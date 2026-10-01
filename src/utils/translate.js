import { registry } from '../blocks/registry';
import { UI_STRINGS, uiKeys } from './i18n';

// Fields holding URLs or search terms are not translated.
const SKIP = new Set(['url', 'query']);

function walkFields(fields, value, path, visit) {
  for (const f of fields) {
    const v = value?.[f.key];
    if ((f.type === 'text' || f.type === 'textarea') && !SKIP.has(f.key)) {
      if (typeof v === 'string' && v.trim()) visit([...path, f.key], v, f.type);
    } else if (f.type === 'list' && Array.isArray(v)) {
      v.forEach((item, i) =>
        walkFields(f.itemFields, item, [...path, f.key, i], visit),
      );
    }
  }
}

// Groups of { key, source, multiline } for every translatable string in the site.
export function collectStrings(site) {
  const groups = [];
  const add = (title, fn) => {
    const items = [];
    fn((key, source, multiline = false) =>
      items.push({ key, source, multiline }),
    );
    if (items.length) groups.push({ title, items });
  };

  add('Site', (push) => push('site:name', site.name));
  add('Header', (push) =>
    walkFields(registry.header.fields, site.header, [], (p, v, t) =>
      push(`header:${p.join('.')}`, v, t === 'textarea'),
    ),
  );
  for (const page of site.pages) {
    add(`Page: ${page.name}`, (push) => {
      push(`page:${page.id}:name`, page.name);
      for (const b of page.blocks) {
        walkFields(registry[b.type].fields, b.props, [], (p, v, t) =>
          push(`b:${b.id}:${p.join('.')}`, v, t === 'textarea'),
        );
      }
    });
  }
  add('Footer', (push) =>
    walkFields(registry.footer.fields, site.footer, [], (p, v, t) =>
      push(`footer:${p.join('.')}`, v, t === 'textarea'),
    ),
  );
  add('Products', (push) => {
    for (const p of site.products) {
      if (p.name) push(`product:${p.id}:name`, p.name);
      if (p.description)
        push(`product:${p.id}:description`, p.description, true);
    }
  });
  add('Store text', (push) => {
    for (const k of uiKeys) push(`ui:${k}`, UI_STRINGS[k]);
  });
  return groups;
}

function setPath(root, path, value) {
  let node = root;
  for (let i = 0; i < path.length - 1; i++) {
    node = node?.[path[i]];
    if (node == null) return;
  }
  const last = path[path.length - 1];
  if (node && typeof node[last] === 'string') node[last] = value;
}

const parsePath = (s) =>
  s.split('.').map((x) => (/^\d+$/.test(x) ? Number(x) : x));

// Returns a copy of the site with the locale's translations applied and `ui` text attached.
export function localizeSite(site, locale) {
  const map =
    locale && locale !== site.locales.default
      ? (site.translations?.[locale] ?? {})
      : {};
  const out = {
    ...site,
    header: structuredClone(site.header),
    footer: structuredClone(site.footer),
    products: structuredClone(site.products),
    pages: structuredClone(site.pages),
    ui: { ...UI_STRINGS },
  };
  const blocks = new Map(
    out.pages.flatMap((p) => p.blocks).map((b) => [b.id, b]),
  );
  const products = new Map(out.products.map((p) => [p.id, p]));
  const pages = new Map(out.pages.map((p) => [p.id, p]));

  for (const [key, text] of Object.entries(map)) {
    if (!text.trim()) continue;
    const [kind, a, b] = key.split(':');
    if (kind === 'site') out.name = text;
    else if (kind === 'header') setPath(out.header, parsePath(a), text);
    else if (kind === 'footer') setPath(out.footer, parsePath(a), text);
    else if (kind === 'ui' && Object.hasOwn(UI_STRINGS, a)) out.ui[a] = text;
    else if (kind === 'page' && pages.has(a) && b === 'name')
      pages.get(a).name = text;
    else if (
      kind === 'product' &&
      products.has(a) &&
      (b === 'name' || b === 'description')
    )
      products.get(a)[b] = text;
    else if (kind === 'b' && blocks.has(a) && b)
      setPath(blocks.get(a).props, parsePath(b), text);
  }
  return out;
}
