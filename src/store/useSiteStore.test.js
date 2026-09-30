import { beforeEach, describe, expect, it } from 'vitest';
import { selectPage, useSiteStore } from './useSiteStore';

const store = () => useSiteStore.getState();
const types = () => selectPage(store()).blocks.map((b) => b.type);

beforeEach(() => {
  store().resetSite();
  useSiteStore.setState({ clipboard: [] });
});

describe('block actions', () => {
  it('adds a block at an index and selects it', () => {
    store().addBlock('spacer', 1);
    expect(types()[1]).toBe('spacer');
    expect(store().selectedIds).toHaveLength(1);
  });

  it('moves a block and supports undo/redo', () => {
    const before = types();
    store().moveBlock(0, 2);
    expect(types()).toEqual([
      before[1],
      before[2],
      before[0],
      ...before.slice(3),
    ]);
    store().undo();
    expect(types()).toEqual(before);
    store().redo();
    expect(types()[2]).toBe(before[0]);
  });

  it('removes and duplicates multiple blocks', () => {
    const [a, b] = selectPage(store()).blocks;
    const count = types().length;
    store().duplicateBlocks([a.id, b.id]);
    expect(types()).toHaveLength(count + 2);
    expect(store().selectedIds).toHaveLength(2);
    store().removeBlocks(store().selectedIds);
    expect(types()).toHaveLength(count);
    expect(store().selectedIds).toEqual([]);
  });

  it('moves the selection together', () => {
    const blocks = selectPage(store()).blocks;
    useSiteStore.setState({
      selectedIds: [blocks[1].id, blocks[2].id],
      selectedId: blocks[2].id,
    });
    store().moveSelected(-1);
    const ids = selectPage(store()).blocks.map((b) => b.id);
    expect(ids.slice(0, 3)).toEqual([blocks[1].id, blocks[2].id, blocks[0].id]);
  });
});

describe('selection', () => {
  it('toggles and ranges', () => {
    const ids = selectPage(store()).blocks.map((b) => b.id);
    store().select(ids[1]);
    store().toggleSelect(ids[3]);
    expect(store().selectedIds).toEqual([ids[1], ids[3]]);
    store().select(ids[1]);
    store().selectRange(ids[3]);
    expect(store().selectedIds).toEqual(ids.slice(1, 4));
  });

  it('does not put header or footer in the block selection', () => {
    store().select('header');
    expect(store().selectedId).toBe('header');
    expect(store().selectedIds).toEqual([]);
  });
});

describe('clipboard', () => {
  it('copies, pastes with fresh ids, and cuts', () => {
    const [first] = selectPage(store()).blocks;
    const count = types().length;
    store().select(first.id);
    expect(store().copySelected()).toBe(1);
    expect(store().paste()).toBe(1);
    const blocks = selectPage(store()).blocks;
    expect(blocks).toHaveLength(count + 1);
    expect(blocks[1].type).toBe(first.type);
    expect(blocks[1].id).not.toBe(first.id);

    store().cutSelected();
    expect(types()).toHaveLength(count);
    expect(store().clipboard).toHaveLength(1);
  });

  it('ignores paste with an empty clipboard', () => {
    expect(store().paste()).toBe(0);
  });
});

describe('coalescing', () => {
  it('merges rapid edits to the same field into one history entry', () => {
    const id = selectPage(store()).blocks[0].id;
    const pastBefore = store().past.length;
    store().updateProps(id, { heading: 'A' });
    store().updateProps(id, { heading: 'AB' });
    expect(store().past.length).toBe(pastBefore + 1);
  });
});

describe('animation and theme presets', () => {
  it('updates block animation, survives duplicate, and undoes', () => {
    const id = selectPage(store()).blocks[0].id;
    store().updateAnim(id, { entrance: 'zoom-in', delay: 300 });
    expect(selectPage(store()).blocks[0].anim).toMatchObject({
      entrance: 'zoom-in',
      delay: 300,
    });
    store().duplicateBlock(id);
    expect(selectPage(store()).blocks[1].anim.entrance).toBe('zoom-in');
    store().undo();
    store().undo();
    expect(selectPage(store()).blocks[0].anim).toBeUndefined();
  });

  it('saves and deletes theme presets', () => {
    store().updateTheme({ primary: '#ff0000' });
    store().saveThemePreset('Red');
    const [preset] = store().site.themePresets;
    expect(preset.name).toBe('Red');
    expect(preset.theme.primary).toBe('#ff0000');
    expect(preset.theme).not.toHaveProperty('currency');
    store().deleteThemePreset(preset.id);
    expect(store().site.themePresets).toHaveLength(0);
  });
});
