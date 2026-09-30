import { getEventCoordinates } from '@dnd-kit/utilities';
import { closestCenter, pointerWithin } from '@dnd-kit/core';

export const END_ID = 'canvas-end';
export const GLOBAL_IDS = ['header', 'footer'];

export const collision = (args) => {
  const within = pointerWithin(args);
  return within.length ? within : closestCenter(args);
};

// Vertical pointer position in viewport coordinates, or null for keyboard drags.
export function pointerY({ activatorEvent, delta }) {
  const coords = activatorEvent ? getEventCoordinates(activatorEvent) : null;
  return coords ? coords.y + delta.y : null;
}

// Insertion index for a new block dragged from the palette.
export function resolveDropIndex({ overId, blockIds, overRect, y }) {
  if (overId == null) return null;
  if (overId === 'header') return 0;
  if (overId === 'footer' || overId === END_ID) return blockIds.length;
  const i = blockIds.indexOf(overId);
  if (i < 0) return null;
  if (!overRect || y == null) return i;
  return y > overRect.top + overRect.height / 2 ? i + 1 : i;
}

// Source and target index for reordering an existing block, or null when nothing changes.
export function resolveMove({ activeId, overId, blockIds }) {
  const from = blockIds.indexOf(activeId);
  if (from < 0 || overId == null) return null;
  let to;
  if (overId === 'header') to = 0;
  else if (overId === 'footer' || overId === END_ID) to = blockIds.length - 1;
  else to = blockIds.indexOf(overId);
  return to < 0 || to === from ? null : { from, to };
}

// Shifts every selected block one step; selected neighbours keep their relative order. Returns the same array when nothing moves.
export function nudgeBlocks(blocks, selected, direction) {
  const next = [...blocks];
  let changed = false;
  const swap = (i, j) => {
    [next[i], next[j]] = [next[j], next[i]];
    changed = true;
  };
  if (direction < 0) {
    for (let i = 1; i < next.length; i++) {
      if (selected.has(next[i].id) && !selected.has(next[i - 1].id))
        swap(i, i - 1);
    }
  } else {
    for (let i = next.length - 2; i >= 0; i--) {
      if (selected.has(next[i].id) && !selected.has(next[i + 1].id))
        swap(i, i + 1);
    }
  }
  return changed ? next : blocks;
}
