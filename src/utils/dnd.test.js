import { describe, expect, it } from 'vitest';
import { END_ID, nudgeBlocks, resolveDropIndex, resolveMove } from './dnd';

const blockIds = ['a', 'b', 'c'];
const rect = { top: 100, height: 100 };

describe('nudgeBlocks', () => {
  const blocks = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
  const ids = (list) => list.map((b) => b.id).join('');

  it('moves a single block', () => {
    expect(ids(nudgeBlocks(blocks, new Set(['c']), -1))).toBe('acbd');
    expect(ids(nudgeBlocks(blocks, new Set(['b']), 1))).toBe('acbd');
  });

  it('keeps a selected group in order', () => {
    expect(ids(nudgeBlocks(blocks, new Set(['b', 'c']), -1))).toBe('bcad');
    expect(ids(nudgeBlocks(blocks, new Set(['b', 'c']), 1))).toBe('adbc');
  });

  it('returns the same array at the edges', () => {
    expect(nudgeBlocks(blocks, new Set(['a']), -1)).toBe(blocks);
    expect(nudgeBlocks(blocks, new Set(['d']), 1)).toBe(blocks);
  });
});

describe('resolveDropIndex', () => {
  it('returns null when not over anything', () => {
    expect(resolveDropIndex({ overId: null, blockIds })).toBeNull();
  });

  it('maps header, footer and end zone', () => {
    expect(resolveDropIndex({ overId: 'header', blockIds })).toBe(0);
    expect(resolveDropIndex({ overId: 'footer', blockIds })).toBe(3);
    expect(resolveDropIndex({ overId: END_ID, blockIds })).toBe(3);
  });

  it('uses the block midpoint to choose before or after', () => {
    expect(
      resolveDropIndex({ overId: 'b', blockIds, overRect: rect, y: 120 }),
    ).toBe(1);
    expect(
      resolveDropIndex({ overId: 'b', blockIds, overRect: rect, y: 180 }),
    ).toBe(2);
  });

  it('falls back to before when pointer position is unknown', () => {
    expect(
      resolveDropIndex({ overId: 'c', blockIds, overRect: rect, y: null }),
    ).toBe(2);
  });

  it('ignores unknown ids', () => {
    expect(resolveDropIndex({ overId: 'zzz', blockIds })).toBeNull();
  });
});

describe('resolveMove', () => {
  it('moves onto the hovered block index', () => {
    expect(resolveMove({ activeId: 'a', overId: 'c', blockIds })).toEqual({
      from: 0,
      to: 2,
    });
    expect(resolveMove({ activeId: 'c', overId: 'a', blockIds })).toEqual({
      from: 2,
      to: 0,
    });
  });

  it('returns null for no-op or invalid moves', () => {
    expect(resolveMove({ activeId: 'a', overId: 'a', blockIds })).toBeNull();
    expect(resolveMove({ activeId: 'x', overId: 'a', blockIds })).toBeNull();
    expect(resolveMove({ activeId: 'a', overId: null, blockIds })).toBeNull();
  });

  it('maps header and footer to the list edges', () => {
    expect(resolveMove({ activeId: 'c', overId: 'header', blockIds })).toEqual({
      from: 2,
      to: 0,
    });
    expect(resolveMove({ activeId: 'a', overId: 'footer', blockIds })).toEqual({
      from: 0,
      to: 2,
    });
    expect(resolveMove({ activeId: 'c', overId: END_ID, blockIds })).toBeNull();
  });
});
