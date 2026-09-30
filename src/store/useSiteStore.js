import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createBlock, registry } from '../blocks/registry';
import { createStarterSite } from '../data/starterSite';
import { normalizeSite } from '../export/siteJson';
import { GLOBAL_IDS, nudgeBlocks } from '../utils/dnd';
import { slugify, uid } from '../utils/helpers';
import { setSaveStatus } from './saveStatus';
import { toast } from './toastStore';

const HISTORY_LIMIT = 80;
const SAVE_DELAY = 400;

let lastKey = null;
let lastTime = 0;
let lastStorageToast = 0;

let pending = null;
let saveTimer = null;
let lastSaved = null;

function flushSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!pending) return;
  const { name, value } = pending;
  pending = null;
  try {
    localStorage.setItem(name, JSON.stringify(value));
    setSaveStatus('saved');
  } catch {
    setSaveStatus('error');
    const now = Date.now();
    if (now - lastStorageToast > 5000) {
      lastStorageToast = now;
      toast(
        'Browser storage is full. Export your site or remove large images.',
        { type: 'error' },
      );
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave();
  });
}

// Writes are debounced; only site or page changes are persisted.
const storage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    const { site, currentPageId } = value.state;
    if (
      lastSaved &&
      lastSaved.site === site &&
      lastSaved.currentPageId === currentPageId
    )
      return;
    lastSaved = { site, currentPageId };
    pending = { name, value };
    setSaveStatus('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, SAVE_DELAY);
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // storage unavailable
    }
  },
};

const updateBlocks = (site, pageId, fn) => ({
  ...site,
  pages: site.pages.map((p) =>
    p.id === pageId ? { ...p, blocks: fn(p.blocks) } : p,
  ),
});

const uniqueSlug = (base, pages) => {
  let slug = base;
  for (let i = 2; pages.some((p) => p.slug === slug); i++)
    slug = `${base}-${i}`;
  return slug;
};

const NONE = { selectedId: null, selectedIds: [] };

const only = (id) => {
  if (!id) return NONE;
  return GLOBAL_IDS.includes(id)
    ? { selectedId: id, selectedIds: [] }
    : { selectedId: id, selectedIds: [id] };
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const cloneBlock = (b) => ({ ...structuredClone(b), id: uid('b') });

const initialSite = createStarterSite();

const validPageId = (site, id) =>
  site.pages.some((p) => p.id === id) ? id : site.pages[0].id;

export const useSiteStore = create(
  persist(
    (set, get) => {
      const commit = (recipe, key) => {
        const { site, past } = get();
        const next = recipe(site);
        if (next === site) return;
        const now = Date.now();
        const coalesce = key && key === lastKey && now - lastTime < 1000;
        lastKey = key ?? null;
        lastTime = now;
        set({
          site: next,
          past: coalesce ? past : [...past, site].slice(-HISTORY_LIMIT),
          future: [],
        });
      };

      const pageBlocks = () => {
        const { site, currentPageId } = get();
        return (site.pages.find((p) => p.id === currentPageId) ?? site.pages[0])
          .blocks;
      };

      const say = (announcement) => set({ announcement });

      return {
        site: initialSite,
        currentPageId: initialSite.pages[0].id,
        ...NONE,
        device: 'desktop',
        past: [],
        future: [],
        clipboard: [],
        announcement: '',

        select: (id) => set(only(id)),
        toggleSelect: (id) => {
          const { selectedIds } = get();
          const ids = selectedIds.includes(id)
            ? selectedIds.filter((x) => x !== id)
            : [...selectedIds, id];
          set({ selectedIds: ids, selectedId: ids.at(-1) ?? null });
        },
        selectRange: (id) => {
          const ids = pageBlocks().map((b) => b.id);
          const anchor = ids.indexOf(get().selectedId);
          const target = ids.indexOf(id);
          if (anchor < 0 || target < 0) return set(only(id));
          const [a, b] = anchor < target ? [anchor, target] : [target, anchor];
          set({ selectedIds: ids.slice(a, b + 1), selectedId: id });
        },
        selectAll: () => {
          const ids = pageBlocks().map((b) => b.id);
          if (ids.length) set({ selectedIds: ids, selectedId: ids.at(-1) });
        },
        setDevice: (device) => set({ device }),
        setCurrentPage: (id) => set({ currentPageId: id, ...NONE }),

        undo: () => {
          const { past, future, site } = get();
          if (!past.length) return;
          lastKey = null;
          const prev = past[past.length - 1];
          set({
            site: prev,
            currentPageId: validPageId(prev, get().currentPageId),
            past: past.slice(0, -1),
            future: [site, ...future],
            ...NONE,
          });
        },
        redo: () => {
          const { past, future, site } = get();
          if (!future.length) return;
          lastKey = null;
          set({
            site: future[0],
            currentPageId: validPageId(future[0], get().currentPageId),
            past: [...past, site],
            future: future.slice(1),
            ...NONE,
          });
        },
        resetSite: () => {
          const fresh = createStarterSite();
          lastKey = null;
          set({
            site: fresh,
            currentPageId: fresh.pages[0].id,
            ...NONE,
            past: [],
            future: [],
          });
        },
        importSite: (site) => {
          commit(() => site);
          set({ currentPageId: site.pages[0].id, ...NONE });
        },

        addBlock: (type, index) => {
          const block = createBlock(type);
          const pageId = get().currentPageId;
          commit((site) =>
            updateBlocks(site, pageId, (blocks) => {
              const next = [...blocks];
              next.splice(index ?? next.length, 0, block);
              return next;
            }),
          );
          set(only(block.id));
          say(`Added ${registry[type].label} block.`);
        },
        moveBlock: (from, to) => {
          if (from === to) return;
          const pageId = get().currentPageId;
          const moved = pageBlocks()[from];
          commit((site) =>
            updateBlocks(site, pageId, (blocks) => {
              const next = [...blocks];
              next.splice(to, 0, next.splice(from, 1)[0]);
              return next;
            }),
          );
          if (moved)
            say(
              `Moved ${registry[moved.type].label} to position ${to + 1} of ${pageBlocks().length}.`,
            );
        },
        moveSelected: (direction) => {
          const { selectedIds, currentPageId } = get();
          if (!selectedIds.length) return;
          const blocks = pageBlocks();
          const next = nudgeBlocks(blocks, new Set(selectedIds), direction);
          if (next === blocks) return;
          commit((site) => updateBlocks(site, currentPageId, () => next));
          say(
            `Moved ${plural(selectedIds.length, 'block')} ${direction < 0 ? 'up' : 'down'}.`,
          );
        },
        duplicateBlocks: (ids) => {
          const pageId = get().currentPageId;
          const wanted = new Set(ids);
          const source = pageBlocks().filter((b) => wanted.has(b.id));
          if (!source.length) return;
          const copies = source.map(cloneBlock);
          const after = pageBlocks().findLastIndex((b) => wanted.has(b.id));
          commit((site) =>
            updateBlocks(site, pageId, (blocks) => {
              const next = [...blocks];
              next.splice(after + 1, 0, ...copies);
              return next;
            }),
          );
          const newIds = copies.map((b) => b.id);
          set({ selectedIds: newIds, selectedId: newIds.at(-1) });
          say(`Duplicated ${plural(copies.length, 'block')}.`);
        },
        duplicateBlock: (id) => get().duplicateBlocks([id]),
        removeBlocks: (ids) => {
          const pageId = get().currentPageId;
          const doomed = new Set(ids);
          commit((site) =>
            updateBlocks(site, pageId, (blocks) => {
              const next = blocks.filter((b) => !doomed.has(b.id));
              return next.length === blocks.length ? blocks : next;
            }),
          );
          set(NONE);
          say(`Deleted ${plural(doomed.size, 'block')}.`);
        },
        removeBlock: (id) => get().removeBlocks([id]),

        copySelected: () => {
          const ids = new Set(get().selectedIds);
          const blocks = pageBlocks().filter((b) => ids.has(b.id));
          if (!blocks.length) return 0;
          set({ clipboard: structuredClone(blocks) });
          return blocks.length;
        },
        cutSelected: () => {
          const count = get().copySelected();
          if (count) get().removeBlocks(get().selectedIds);
          return count;
        },
        paste: () => {
          const { clipboard, currentPageId, selectedIds } = get();
          if (!clipboard.length) return 0;
          const copies = clipboard.map(cloneBlock);
          const sel = new Set(selectedIds);
          const at = pageBlocks().findLastIndex((b) => sel.has(b.id));
          commit((site) =>
            updateBlocks(site, currentPageId, (blocks) => {
              const next = [...blocks];
              next.splice(at < 0 ? next.length : at + 1, 0, ...copies);
              return next;
            }),
          );
          const ids = copies.map((b) => b.id);
          set({ selectedIds: ids, selectedId: ids.at(-1) });
          say(`Pasted ${plural(copies.length, 'block')}.`);
          return copies.length;
        },
        updateProps: (id, patch) => {
          const pageId = get().currentPageId;
          const key = `${id}:${Object.keys(patch)[0]}`;
          commit((site) => {
            if (GLOBAL_IDS.includes(id))
              return { ...site, [id]: { ...site[id], ...patch } };
            return updateBlocks(site, pageId, (blocks) =>
              blocks.map((b) =>
                b.id === id ? { ...b, props: { ...b.props, ...patch } } : b,
              ),
            );
          }, key);
        },

        addPage: (name) => {
          const title = name.trim() || 'New page';
          const page = {
            id: uid('pg'),
            name: title,
            slug: uniqueSlug(slugify(title), get().site.pages),
            blocks: [createBlock('richText', { heading: title })],
          };
          commit((site) => ({ ...site, pages: [...site.pages, page] }));
          set({ currentPageId: page.id, ...NONE });
        },
        renamePage: (id, name) =>
          commit(
            (site) => ({
              ...site,
              pages: site.pages.map((p) => (p.id === id ? { ...p, name } : p)),
            }),
            `page:${id}`,
          ),
        duplicatePage: (id) => {
          const source = get().site.pages.find((p) => p.id === id);
          if (!source) return;
          const page = {
            ...structuredClone(source),
            id: uid('pg'),
            name: `${source.name} copy`,
            slug: uniqueSlug(`${source.slug}-copy`, get().site.pages),
            isHome: false,
            blocks: source.blocks.map(cloneBlock),
          };
          commit((site) => ({ ...site, pages: [...site.pages, page] }));
          set({ currentPageId: page.id, ...NONE });
        },
        deletePage: (id) => {
          const { site, currentPageId } = get();
          const page = site.pages.find((p) => p.id === id);
          if (!page || page.isHome) return;
          commit((s) => ({ ...s, pages: s.pages.filter((p) => p.id !== id) }));
          if (currentPageId === id)
            set({ currentPageId: site.pages[0].id, ...NONE });
        },

        addProduct: () => {
          const id = uid('prod');
          commit((site) => ({
            ...site,
            products: [
              ...site.products,
              {
                id,
                name: 'New product',
                price: 25,
                description: '',
                image: '',
              },
            ],
          }));
          return id;
        },
        updateProduct: (id, patch) =>
          commit(
            (site) => ({
              ...site,
              products: site.products.map((p) =>
                p.id === id ? { ...p, ...patch } : p,
              ),
            }),
            `product:${id}:${Object.keys(patch)[0]}`,
          ),
        removeProduct: (id) =>
          commit((site) => ({
            ...site,
            products: site.products.filter((p) => p.id !== id),
          })),

        updateTheme: (patch) =>
          commit(
            (site) => ({ ...site, theme: { ...site.theme, ...patch } }),
            `theme:${Object.keys(patch)[0]}`,
          ),
        updateSiteName: (name) =>
          commit((site) => ({ ...site, name }), 'siteName'),
      };
    },
    {
      name: 'ecom-builder-site',
      version: 2,
      storage,
      partialize: (s) => ({ site: s.site, currentPageId: s.currentPageId }),
      // v1 and v2 share one shape; loading re-validates either.
      migrate: (persisted) => persisted,
      merge: (persisted, current) => {
        if (!persisted?.site) return current;
        try {
          const site = normalizeSite(persisted.site);
          return {
            ...current,
            site,
            currentPageId: validPageId(site, persisted.currentPageId),
          };
        } catch {
          return current;
        }
      },
    },
  ),
);

export const selectPage = (s) =>
  s.site.pages.find((p) => s.currentPageId === p.id) ?? s.site.pages[0];
