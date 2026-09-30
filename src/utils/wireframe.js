import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  LinearFilter,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';
import { WIRE_SHAPES, WIRE_STYLES, oneOf, safeHex } from './wireShapes';

// Untrusted input (data-wire attribute, old sites): always returns a safe option set.
export function parseWireOptions(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const speed = Number(o.speed);
  return {
    shape: oneOf(WIRE_SHAPES, o.shape, 'terrain'),
    style: oneOf(WIRE_STYLES, o.style, 'lines'),
    color: safeHex(o.color),
    speed: Number.isFinite(speed) ? Math.min(100, Math.max(0, speed)) : 50,
    pulse: o.pulse !== false,
    interactive: o.interactive !== false,
  };
}

const TAU = Math.PI * 2;

// Deterministic noise in [0, 1) so shapes look the same on every load.
const rnd = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Soft round sprite for dots; a DataTexture avoids needing a 2D canvas context.
function dotTexture() {
  const s = 32;
  const data = new Uint8Array(s * s * 4);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const d = Math.hypot(((x + 0.5) / s) * 2 - 1, ((y + 0.5) / s) * 2 - 1);
      const a = Math.max(0, 1 - d);
      const i = (y * s + x) * 4;
      data.fill(255, i, i + 3);
      data[i + 3] = Math.round(a * a * (3 - 2 * a) * 255);
    }
  }
  const tex = new DataTexture(data, s, s);
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

const terrainWave = (x, y, z, t) =>
  0.45 * Math.sin(x * 0.7 + t * 1.2) * Math.cos(z * 0.6 + t * 0.9) +
  0.25 * Math.sin((x + z) * 0.5 - t * 0.7);

const rippleWave = (x, y, z, t) => {
  const r = Math.hypot(x, z);
  return 0.7 * Math.sin(r * 1.3 - t * 2.4) * Math.exp(-r * 0.14);
};

function planeShape(wave) {
  const n = 36;
  const size = 16;
  const positions = new Float32Array((n + 1) * (n + 1) * 3);
  const normals = new Float32Array(positions.length);
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const k = (j * (n + 1) + i) * 3;
      positions[k] = (i / n - 0.5) * size;
      positions[k + 2] = (j / n - 0.5) * size;
      normals[k + 1] = 1;
    }
  }
  const index = [];
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const a = j * (n + 1) + i;
      if (i < n) index.push(a, a + 1);
      if (j < n) index.push(a, a + n + 1);
    }
  }
  return {
    positions,
    normals,
    index: new Uint16Array(index),
    camera: [0, 4.2, 9],
    tiltX: 0,
    sway: true,
    dot: 0.14,
    wave,
  };
}

const terrainShape = () => planeShape(terrainWave);
const rippleShape = () => planeShape(rippleWave);

function radialNormals(positions) {
  const normals = new Float32Array(positions.length);
  const v = new Vector3();
  for (let k = 0; k < positions.length; k += 3) {
    v.set(positions[k], positions[k + 1], positions[k + 2]);
    if (v.lengthSq() > 1e-6) v.normalize();
    normals[k] = v.x;
    normals[k + 1] = v.y;
    normals[k + 2] = v.z;
  }
  return normals;
}

function sphereShape() {
  const ico = new IcosahedronGeometry(3.2, 3);
  const wire = new WireframeGeometry(ico);
  const raw = wire.attributes.position.array;
  ico.dispose();
  wire.dispose();
  // Merge duplicate vertices so dots do not stack and brighten.
  const seen = new Map();
  const unique = [];
  const index = [];
  for (let k = 0; k < raw.length; k += 3) {
    const key = `${raw[k].toFixed(3)},${raw[k + 1].toFixed(3)},${raw[k + 2].toFixed(3)}`;
    let id = seen.get(key);
    if (id === undefined) {
      id = unique.length / 3;
      seen.set(key, id);
      unique.push(raw[k], raw[k + 1], raw[k + 2]);
    }
    index.push(id);
  }
  const positions = Float32Array.from(unique);
  return {
    positions,
    normals: radialNormals(positions),
    index: new Uint16Array(index),
    camera: [0, 0, 9],
    tiltX: 0.3,
    dot: 0.09,
    wave: (x, y, z, t) => 0.18 * Math.sin(y * 2.2 - t * 1.8),
  };
}

function latticeShape() {
  const n = 6;
  const gap = 1.3;
  const positions = new Float32Array(n * n * n * 3);
  const at = (x, y, z) => x * n * n + y * n + z;
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const k = at(x, y, z) * 3;
        positions[k] = (x - (n - 1) / 2) * gap;
        positions[k + 1] = (y - (n - 1) / 2) * gap;
        positions[k + 2] = (z - (n - 1) / 2) * gap;
      }
    }
  }
  const index = [];
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const a = at(x, y, z);
        if (x < n - 1) index.push(a, at(x + 1, y, z));
        if (y < n - 1) index.push(a, at(x, y + 1, z));
        if (z < n - 1) index.push(a, at(x, y, z + 1));
      }
    }
  }
  return {
    positions,
    normals: radialNormals(positions),
    index: new Uint16Array(index),
    camera: [0, 0, 11],
    tiltX: 0.35,
    dot: 0.12,
    wave: (x, y, z, t) => 0.15 * Math.sin((x + y + z) * 0.8 - t * 1.6),
  };
}

function torusShape() {
  const n = 48;
  const m = 16;
  const R = 3;
  const r = 1.2;
  const positions = new Float32Array(n * m * 3);
  const normals = new Float32Array(n * m * 3);
  const index = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TAU;
    for (let j = 0; j < m; j++) {
      const ph = (j / m) * TAU;
      const a = i * m + j;
      const k = a * 3;
      positions[k] = (R + r * Math.cos(ph)) * Math.cos(th);
      positions[k + 1] = r * Math.sin(ph);
      positions[k + 2] = (R + r * Math.cos(ph)) * Math.sin(th);
      normals[k] = Math.cos(ph) * Math.cos(th);
      normals[k + 1] = Math.sin(ph);
      normals[k + 2] = Math.cos(ph) * Math.sin(th);
      index.push(a, ((i + 1) % n) * m + j, a, i * m + ((j + 1) % m));
    }
  }
  return {
    positions,
    normals,
    index: new Uint16Array(index),
    camera: [0, 0, 10],
    tiltX: 0.9,
    dot: 0.1,
    wave: (x, y, z, t) => 0.2 * Math.sin(Math.atan2(z, x) * 5 + t * 2),
  };
}

function helixShape() {
  const steps = 90;
  const turns = 3;
  const radius = 1.8;
  const height = 8;
  const positions = new Float32Array((steps + 1) * 2 * 3);
  const normals = new Float32Array(positions.length);
  const index = [];
  const B = steps + 1;
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps - 0.5) * height;
    for (let s = 0; s < 2; s++) {
      const ang = (i / steps) * turns * TAU + s * Math.PI;
      const k = (s * B + i) * 3;
      positions[k] = Math.cos(ang) * radius;
      positions[k + 1] = y;
      positions[k + 2] = Math.sin(ang) * radius;
      normals[k] = Math.cos(ang);
      normals[k + 2] = Math.sin(ang);
    }
    if (i < steps) index.push(i, i + 1, B + i, B + i + 1);
    if (i % 3 === 0) index.push(i, B + i);
  }
  return {
    positions,
    normals,
    index: new Uint16Array(index),
    camera: [0, 0, 11],
    tiltX: 0.15,
    spinY: 0.4,
    dot: 0.11,
    wave: (x, y, z, t) => 0.15 * Math.sin(y * 2 - t * 2),
  };
}

function tunnelShape() {
  const rings = 22;
  const seg = 20;
  const radius = 4;
  const positions = new Float32Array(rings * seg * 3);
  const normals = new Float32Array(positions.length);
  const index = [];
  for (let i = 0; i < rings; i++) {
    const z = (0.5 - i / (rings - 1)) * 22;
    for (let j = 0; j < seg; j++) {
      const a = i * seg + j;
      const k = a * 3;
      const ang = (j / seg) * TAU;
      positions[k] = Math.cos(ang) * radius;
      positions[k + 1] = Math.sin(ang) * radius;
      positions[k + 2] = z;
      normals[k] = Math.cos(ang);
      normals[k + 1] = Math.sin(ang);
      index.push(a, i * seg + ((j + 1) % seg));
      if (i < rings - 1) index.push(a, a + seg);
    }
  }
  return {
    positions,
    normals,
    index: new Uint16Array(index),
    camera: [0, 0, 13],
    tiltX: 0,
    spinY: 0,
    spinZ: 0.3,
    dot: 0.13,
    wave: (x, y, z, t) => 0.35 * Math.sin(z * 0.9 - t * 2.5),
  };
}

function galaxyShape() {
  const arms = 3;
  const per = 120;
  const dust = 260;
  const total = arms * per + dust;
  const positions = new Float32Array(total * 3);
  const normals = new Float32Array(total * 3);
  const index = [];
  for (let arm = 0; arm < arms; arm++) {
    for (let j = 0; j < per; j++) {
      const t = j / (per - 1);
      const a = arm * per + j;
      const ang = (arm / arms) * TAU + t * 3.2 + (rnd(a) - 0.5) * 0.12;
      const r = 0.4 + t * 5.5;
      positions[a * 3] = Math.cos(ang) * r;
      positions[a * 3 + 1] = (rnd(a + 500) - 0.5) * 0.5 * t;
      positions[a * 3 + 2] = Math.sin(ang) * r;
      if (j < per - 1) index.push(a, a + 1);
    }
  }
  // Dust is not indexed, so only the dots styles draw it.
  for (let d = 0; d < dust; d++) {
    const a = arms * per + d;
    const ang = rnd(a) * TAU;
    const r = 0.5 + rnd(a + 900) * 6;
    positions[a * 3] = Math.cos(ang) * r;
    positions[a * 3 + 1] = (rnd(a + 1300) - 0.5) * 1.6;
    positions[a * 3 + 2] = Math.sin(ang) * r;
  }
  for (let v = 0; v < total; v++) normals[v * 3 + 1] = 1;
  return {
    positions,
    normals,
    index: new Uint16Array(index),
    camera: [0, 3.5, 9.5],
    tiltX: 0.25,
    spinY: 0.2,
    dot: 0.12,
    wave: (x, y, z, t) => 0.35 * Math.sin(Math.hypot(x, z) * 1.4 - t * 2),
  };
}

const BUILDERS = {
  terrain: terrainShape,
  ripple: rippleShape,
  sphere: sphereShape,
  lattice: latticeShape,
  torus: torusShape,
  helix: helixShape,
  tunnel: tunnelShape,
  galaxy: galaxyShape,
};

// Mounts an animated wireframe canvas in `el`. Returns a dispose function; no-op without WebGL.
export function mountWireframe(el, rawOptions) {
  const opts = parseWireOptions(rawOptions);
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  canvas.setAttribute('aria-hidden', 'true');
  el.appendChild(canvas);

  const shape = BUILDERS[opts.shape]();
  const count = shape.positions.length / 3;
  const wantLines = opts.style !== 'dots';
  const wantDots = opts.style !== 'lines';

  // Edges fade toward the rim so the structure melts into the hero background.
  let maxR = 0;
  for (let v = 0; v < count; v++) {
    maxR = Math.max(
      maxR,
      Math.hypot(
        shape.positions[v * 3],
        shape.positions[v * 3 + 1],
        shape.positions[v * 3 + 2],
      ),
    );
  }
  const fade = new Float32Array(count);
  for (let v = 0; v < count; v++) {
    const r = Math.hypot(
      shape.positions[v * 3],
      shape.positions[v * 3 + 1],
      shape.positions[v * 3 + 2],
    );
    fade[v] = 1 - 0.75 * (r / (maxR || 1)) ** 2;
  }

  const positions = new Float32Array(shape.positions);
  const colors = new Float32Array(count * 3);
  const dotColors = new Float32Array(count * 3);
  const positionAttr = new BufferAttribute(positions, 3);
  const colorAttr = new BufferAttribute(colors, 3);
  const dotColorAttr = new BufferAttribute(dotColors, 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', positionAttr);
  geometry.setAttribute('color', colorAttr);
  geometry.setIndex(new BufferAttribute(shape.index, 1));
  const material = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  // Dots use their own unindexed geometry over the same positions, so every vertex draws once.
  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute('position', positionAttr);
  dotGeometry.setAttribute('color', dotColorAttr);
  const sprite = dotTexture();
  const dotMaterial = new PointsMaterial({
    size: shape.dot,
    map: sprite,
    vertexColors: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const base = new Color(opts.color);

  const scene = new Scene();
  const group = new Group();
  if (wantLines) {
    const lines = new LineSegments(geometry, material);
    lines.frustumCulled = false;
    group.add(lines);
  }
  if (wantDots) {
    const dots = new Points(dotGeometry, dotMaterial);
    dots.frustumCulled = false;
    group.add(dots);
  }
  scene.add(group);
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  const raycaster = new Raycaster();
  const localRay = raycaster.ray.clone();
  const point = new Vector3();

  const pointer = { x: 0, y: 0, inside: false };
  const tilt = { x: 0, y: 0 };
  const drag = { x: 0, y: 0, active: false, lastX: 0, lastY: 0 };
  let hover = 0;
  let time = 0;
  let last = 0;
  let frame = 0;
  let visible = false;
  let width = 0;

  function resize() {
    const w = el.clientWidth;
    const h = el.clientHeight;
    width = w;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const k = camera.aspect < 1 ? 1 / Math.sqrt(camera.aspect) : 1;
    camera.position.set(...shape.camera).multiplyScalar(k);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  function update(dt) {
    time += (dt * opts.speed) / 50;
    const ease = Math.min(1, dt * 4);
    const targetX = pointer.inside && opts.interactive ? -pointer.y * 0.25 : 0;
    const targetY = pointer.inside && opts.interactive ? pointer.x * 0.35 : 0;
    tilt.x += (targetX - tilt.x) * ease;
    tilt.y += (targetY - tilt.y) * ease;
    hover += ((pointer.inside && opts.interactive ? 1 : 0) - hover) * ease;

    group.rotation.x = shape.tiltX + drag.x + tilt.x;
    const spin = shape.sway
      ? Math.sin(time * 0.3) * 0.3
      : time * (shape.spinY ?? 0.25);
    group.rotation.y = spin + drag.y + tilt.y;
    group.rotation.z = time * (shape.spinZ ?? 0);
    group.updateMatrixWorld(true);

    let inverse = null;
    if (hover > 0.01) {
      raycaster.setFromCamera(pointer, camera);
      inverse = group.matrixWorld.clone().invert();
      localRay.copy(raycaster.ray).applyMatrix4(inverse);
    }

    const src = shape.positions;
    const nrm = shape.normals;
    for (let v = 0; v < count; v++) {
      const k = v * 3;
      const x = src[k];
      const y = src[k + 1];
      const z = src[k + 2];
      const wave = shape.wave(x, y, z, time);
      let glow = 0;
      if (inverse) {
        point.set(
          x + nrm[k] * wave,
          y + nrm[k + 1] * wave,
          z + nrm[k + 2] * wave,
        );
        glow = Math.exp(-localRay.distanceSqToPoint(point) / 2.5) * hover;
      }
      const lift = wave + glow * 0.6;
      positions[k] = x + nrm[k] * lift;
      positions[k + 1] = y + nrm[k + 1] * lift;
      positions[k + 2] = z + nrm[k + 2] * lift;
      // Expanding bright rings travel outward from the center.
      const ring = opts.pulse
        ? Math.max(0, Math.sin(Math.hypot(x, y, z) * 1.1 - time * 2.4)) ** 8
        : 0;
      const level = fade[v] * (0.4 + 0.6 * glow + 0.25 * wave + 0.7 * ring);
      colors[k] = base.r * level;
      colors[k + 1] = base.g * level;
      colors[k + 2] = base.b * level;
      // Each dot twinkles on its own phase.
      const twinkle = 0.65 + 0.35 * Math.sin(time * 3 + v * 12.9898);
      const dotLevel = Math.min(1.6, level * 1.4 * twinkle);
      dotColors[k] = base.r * dotLevel;
      dotColors[k + 1] = base.g * dotLevel;
      dotColors[k + 2] = base.b * dotLevel;
    }
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    dotColorAttr.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function loop(now) {
    frame = requestAnimationFrame(loop);
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    if (width) update(dt);
  }

  function start() {
    if (reduced || frame) return;
    last = 0;
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reduced && width && visible) update(0);
  });
  resizeObserver.observe(el);

  const visibleObserver = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) {
      resize();
      if (reduced) update(0);
      else start();
    } else {
      stop();
    }
  });
  visibleObserver.observe(el);

  // The hero content sits above the canvas, so listen on the hero itself.
  const host = el.closest('.eb-hero') || el;
  const listeners = [];
  const listen = (type, fn) => {
    host.addEventListener(type, fn);
    listeners.push([type, fn]);
  };
  if (opts.interactive && !reduced) {
    host.classList.add('eb-wire-host');
    const toNdc = (e) => {
      const r = el.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    listen('pointermove', (e) => {
      toNdc(e);
      pointer.inside = true;
      if (drag.active) {
        drag.y += (e.clientX - drag.lastX) * 0.008;
        drag.x = Math.max(
          -1,
          Math.min(1, drag.x + (e.clientY - drag.lastY) * 0.008),
        );
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
      }
    });
    listen('pointerleave', () => {
      pointer.inside = false;
      drag.active = false;
    });
    listen('pointerdown', (e) => {
      if (
        e.button !== 0 ||
        e.target.closest('a, button, input, select, textarea')
      )
        return;
      drag.active = true;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
    });
    const endDrag = () => {
      drag.active = false;
    };
    listen('pointerup', endDrag);
    listen('pointercancel', endDrag);
  }

  resize();

  return function dispose() {
    stop();
    resizeObserver.disconnect();
    visibleObserver.disconnect();
    listeners.forEach(([type, fn]) => host.removeEventListener(type, fn));
    host.classList.remove('eb-wire-host');
    geometry.dispose();
    dotGeometry.dispose();
    material.dispose();
    dotMaterial.dispose();
    sprite.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
