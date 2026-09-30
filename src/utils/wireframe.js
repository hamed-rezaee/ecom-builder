import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';
import { WIRE_SHAPES } from './wireShapes';

const HEX = /^#[0-9a-f]{6}$/i;

// Untrusted input (data-wire attribute, old sites): always returns a safe option set.
export function parseWireOptions(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const speed = Number(o.speed);
  return {
    shape: WIRE_SHAPES.some(([v]) => v === o.shape) ? o.shape : 'terrain',
    color:
      typeof o.color === 'string' && HEX.test(o.color) ? o.color : '#ffffff',
    speed: Number.isFinite(speed) ? Math.min(100, Math.max(0, speed)) : 50,
    interactive: o.interactive !== false,
  };
}

function terrainShape() {
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
  };
}

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
  const positions = Float32Array.from(wire.attributes.position.array);
  ico.dispose();
  wire.dispose();
  return {
    positions,
    normals: radialNormals(positions),
    index: null,
    camera: [0, 0, 9],
    tiltX: 0.3,
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
  };
}

const BUILDERS = {
  terrain: terrainShape,
  sphere: sphereShape,
  lattice: latticeShape,
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
  const isTerrain = opts.shape === 'terrain';

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
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  if (shape.index) geometry.setIndex(new BufferAttribute(shape.index, 1));
  const material = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const base = new Color(opts.color);

  const scene = new Scene();
  const group = new Group();
  group.add(new LineSegments(geometry, material));
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
    group.rotation.y =
      (isTerrain ? Math.sin(time * 0.3) * 0.3 : time * 0.25) + drag.y + tilt.y;
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
      let wave = 0;
      if (isTerrain) {
        const x = src[k];
        const z = src[k + 2];
        wave =
          0.45 *
            Math.sin(x * 0.7 + time * 1.2) *
            Math.cos(z * 0.6 + time * 0.9) +
          0.25 * Math.sin((x + z) * 0.5 - time * 0.7);
      }
      let glow = 0;
      if (inverse) {
        point.set(src[k], src[k + 1] + wave, src[k + 2]);
        glow = Math.exp(-localRay.distanceSqToPoint(point) / 2.5) * hover;
      }
      const lift = wave + glow * 0.6;
      positions[k] = src[k] + nrm[k] * lift;
      positions[k + 1] = src[k + 1] + nrm[k + 1] * lift;
      positions[k + 2] = src[k + 2] + nrm[k + 2] * lift;
      const level =
        fade[v] * (0.4 + 0.6 * glow + (isTerrain ? 0.25 * wave : 0));
      colors[k] = base.r * level;
      colors[k + 1] = base.g * level;
      colors[k + 2] = base.b * level;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
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
    material.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
