import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createBlock } from '../blocks/registry';
import { createStarterSite } from '../data/starterSite';
import { slugify, uid } from '../utils/helpers';
import { toast } from './toastStore';

const HISTORY_LIMIT = 80;
const GLOBAL_IDS = ['header', 'footer'];

let lastKey = null;
let lastTime = 0;
let lastStorageToast = 0;

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
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      const now = Date.now();
      if (now - lastStorageToast > 5000) {
        lastStorageToast = now;
        toast(
          'Browser storage is full. Export your site or remove large images.',
          {
            type: 'error',
          },
        );
      }
    }
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

      return {
        site: initialSite,
        currentPageId: initialSite.pages[0].id,
        selectedId: null,
        device: 'desktop',
        past: [],
        future: [],

        select: (id) => set({ selectedId: id }),
        setDevice: (device) => set({ device }),
        setCurrentPage: (id) => set({ currentPageId: id, selectedId: null }),

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
            selectedId: null,
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
            selectedId: null,
          });
        },
        resetSite: () => {
          const fresh = createStarterSite();
          lastKey = null;
          set({
            site: fresh,
            currentPageId: fresh.pages[0].id,
            selectedId: null,
            past: [],
            future: [],
          });
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
          set({ selectedId: block.id });
        },
        moveBlock: (from, to) => {
          if (from === to) return;
          const pageId = get().currentPageId;
          commit((site) =>
            updateBlocks(site, pageId, (blocks) => {
              const next = [...blocks];
              next.splice(to, 0, next.splice(from, 1)[0]);
              return next;
            }),
          );
        },
        duplicateBlock: (id) => {
          const pageId = get().currentPageId;
          const copyId = uid('b');
          commit((site) =>
            updateBlocks(site, pageId, (blocks) => {
              const i = blocks.findIndex((b) => b.id === id);
              if (i < 0) return blocks;
              const next = [...blocks];
              next.splice(i + 1, 0, {
                ...structuredClone(blocks[i]),
                id: copyId,
              });
              return next;
            }),
          );
          set({ selectedId: copyId });
        },
        removeBlock: (id) => {
          const pageId = get().currentPageId;
          commit((site) =>
            updateBlocks(site, pageId, (blocks) =>
              blocks.filter((b) => b.id !== id),
            ),
          );
          set({ selectedId: null });
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
          set({ currentPageId: page.id, selectedId: null });
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
            blocks: source.blocks.map((b) => ({
              ...structuredClone(b),
              id: uid('b'),
            })),
          };
          commit((site) => ({ ...site, pages: [...site.pages, page] }));
          set({ currentPageId: page.id, selectedId: null });
        },
        deletePage: (id) => {
          const { site, currentPageId } = get();
          const page = site.pages.find((p) => p.id === id);
          if (!page || page.isHome) return;
          commit((s) => ({ ...s, pages: s.pages.filter((p) => p.id !== id) }));
          if (currentPageId === id)
            set({ currentPageId: site.pages[0].id, selectedId: null });
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
      version: 1,
      storage,
      partialize: (s) => ({ site: s.site, currentPageId: s.currentPageId }),
      merge: (persisted, current) =>
        persisted?.site?.pages?.length ? { ...current, ...persisted } : current,
    },
  ),
);

export const selectPage = (s) =>
  s.site.pages.find((p) => s.currentPageId === p.id) ?? s.site.pages[0];
