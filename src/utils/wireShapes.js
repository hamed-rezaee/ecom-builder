// Kept free of three.js so the registry does not pull the renderer into the main bundle.
export const WIRE_SHAPES = [
  ['terrain', 'Terrain grid'],
  ['ripple', 'Ripple pond'],
  ['sphere', 'Sphere mesh'],
  ['lattice', 'Cube lattice'],
  ['torus', 'Torus'],
  ['helix', 'DNA helix'],
  ['tunnel', 'Tunnel'],
  ['galaxy', 'Galaxy'],
];

export const WIRE_STYLES = [
  ['lines', 'Lines'],
  ['dots', 'Dots'],
  ['both', 'Lines and dots'],
];

export const GRID_STYLES = [
  ['none', 'None'],
  ['scroll', 'Scrolling grid'],
  ['floor', 'Perspective floor'],
  ['dots', 'Twinkling dot grid'],
  ['pulse', 'Pulsing grid'],
];

const HEX = /^#[0-9a-f]{6}$/i;

// Untrusted values reach inline styles and the exported runtime, so validate them.
export const safeHex = (v, fallback = '#ffffff') =>
  typeof v === 'string' && HEX.test(v) ? v : fallback;

export const oneOf = (list, v, fallback) =>
  list.some(([k]) => k === v) ? v : fallback;
