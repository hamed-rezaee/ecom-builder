import { describe, expect, it } from 'vitest';
import { createStarterSite } from '../data/starterSite';
import { normalizeSite, parseSiteFile, serializeSite } from './siteJson';

describe('siteJson', () => {
  it('fills the extended theme for files saved before it existed', () => {
    const site = createStarterSite();
    site.theme = {
      primary: '#123456',
      font: 'serif',
      radius: 4,
      currency: '$',
    };
    delete site.themePresets;
    const parsed = parseSiteFile(serializeSite(site));
    expect(parsed.theme.primary).toBe('#123456');
    expect(parsed.theme.darkMode).toBe('off');
    expect(parsed.themePresets).toEqual([]);
  });

  it('round-trips the starter site', () => {
    const site = createStarterSite();
    const parsed = parseSiteFile(serializeSite(site));
    expect(parsed.pages).toHaveLength(site.pages.length);
    expect(parsed.pages[0].blocks.map((b) => b.type)).toEqual(
      site.pages[0].blocks.map((b) => b.type),
    );
  });

  it('rejects invalid JSON and non-site data', () => {
    expect(() => parseSiteFile('{oops')).toThrow(/valid JSON/);
    expect(() => parseSiteFile('[]')).toThrow(/not a site/);
    expect(() => normalizeSite({ pages: [] })).toThrow(/no pages/);
  });

  it('rejects files from a newer version', () => {
    const text = JSON.stringify({
      format: 'ecom-builder-site',
      version: 99,
      site: {},
    });
    expect(() => parseSiteFile(text)).toThrow(/newer/);
  });

  it('drops unknown blocks and fills missing props with defaults', () => {
    const site = normalizeSite({
      pages: [
        {
          id: 'p1',
          name: 'Home',
          slug: 'home',
          blocks: [
            { id: 'x', type: 'nope', props: {} },
            { id: 'h', type: 'hero', props: { heading: 'Hi' } },
          ],
        },
      ],
    });
    expect(site.pages[0].blocks).toHaveLength(1);
    expect(site.pages[0].blocks[0].props.heading).toBe('Hi');
    expect(site.pages[0].blocks[0].props.align).toBeDefined();
    expect(site.pages[0].isHome).toBe(true);
  });

  it('makes duplicate ids and slugs unique', () => {
    const block = { id: 'same', type: 'hero', props: {} };
    const site = normalizeSite({
      pages: [
        { id: 'p', name: 'A', slug: 'a', blocks: [block, block] },
        { id: 'p', name: 'A', slug: 'a', blocks: [] },
      ],
    });
    expect(new Set(site.pages.map((p) => p.id)).size).toBe(2);
    expect(new Set(site.pages.map((p) => p.slug)).size).toBe(2);
    expect(new Set(site.pages[0].blocks.map((b) => b.id)).size).toBe(2);
  });
});
