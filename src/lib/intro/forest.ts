import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FOG_COLOR, ps2Basic, ps2Tex, patchPS2, rng, vnoise } from './ps2';
import type { IntroModule, ModuleCtx } from './types';

/**
 * Bosque nocturno estilo PlayStation 2 (Silent Hill / Siren / MGS3): todo procedural, sin assets.
 * - Iluminación horneada en color de vértice (cara a la luna más clara, oquedades y sombras de copa más oscuras).
 * - Texturas de 32-64 px con muestreo nearest; billboards cruzados con alphaTest para el sotobosque.
 * - Pocas llamadas de dibujo: árboles/rocas/helechos en InstancedMesh, niebla y haces fusionados en una malla.
 * - Determinista: semilla fija y `update` solo depende de `p` (sin movimiento ocioso).
 */

// ---------------------------------------------------------------- constantes y utilidades

const X_HALF = 50;
const Z_MAX = 15;
/** Dirección hacia la luna (en el cielo) y luz de relleno desde el lado de la cámara (para leer los troncos). */
const MOON_DIR = new THREE.Vector3(-0.05, 0.36, -0.93).normalize();
const FILL_DIR = new THREE.Vector3(-0.3, 0.6, 0.7).normalize();
/** Dirección horizontal (unitaria) en la que caen las sombras (opuesta a la luna). */
const SHADOW_DIR = { x: 0.05, z: 0.9987 };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const fract = (x: number) => x - Math.floor(x);
/** Hash 3D barato en [0,1). */
const h3 = (x: number, y: number, z: number) =>
  fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);

/** Ruido de valor periódico (para que las texturas teselen sin costuras). */
function pn(x: number, y: number, px: number, py: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const w = (i: number, p: number) => ((i % p) + p) % p;
  const hh = (ix: number, iy: number) => h3(w(ix, px), w(iy, py), seed);
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hh(x0, y0);
  const b = hh(x0 + 1, y0);
  const c = hh(x0, y0 + 1);
  const d = hh(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

type Px = (x: number, y: number) => [number, number, number, number];
/** Textura nearest a partir de una función por píxel (RGBA 0-255). */
function pixelTex(size: number, f: Px): THREE.CanvasTexture {
  return ps2Tex(size, (c, s) => {
    const id = c.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const [r, g, b, a] = f(x, y);
        const i = (y * s + x) * 4;
        id.data[i] = r;
        id.data[i + 1] = g;
        id.data[i + 2] = b;
        id.data[i + 3] = a;
      }
    }
    c.putImageData(id, 0, 0);
  });
}

// ---------------------------------------------------------------- texturas procedurales

function makeTextures() {
  const ground = pixelTex(64, (x, y) => {
    const n1 = pn(x / 8, y / 8, 8, 8, 1);
    const n2 = pn(x / 4, y / 4, 16, 16, 2);
    const n3 = pn(x / 2, y / 2, 32, 32, 3);
    let r = lerp(40, 112, n1) + (n2 - 0.5) * 44 + (n3 - 0.5) * 20;
    let g = lerp(46, 104, n1) + (n2 - 0.5) * 38 + (n3 - 0.5) * 20;
    let b = lerp(30, 64, n1) + (n2 - 0.5) * 22 + (n3 - 0.5) * 12;
    const s = h3(x, y, 9);
    if (s < 0.05) [r, g, b] = [24, 30, 24];
    else if (s > 0.965) [r, g, b] = [130, 102, 62];
    else if (s > 0.93) [r, g, b] = [r * 0.7, g * 0.85, b * 0.7];
    const m = pn((x * 6) / 64, (y * 6) / 64, 6, 6, 4);
    if (m > 0.6) {
      const t = clamp01((m - 0.6) * 4);
      r = lerp(r, 46, t);
      g = lerp(g, 86, t);
      b = lerp(b, 50, t);
    }
    return [r, g, b, 255];
  });

  const dirt = pixelTex(64, (x, y) => {
    const u = x / 64;
    const e = Math.abs(u - 0.5) * 2;
    const edgeN = pn(y / 5, 3.3, 13, 1, 7);
    if (e > 0.72 + 0.26 * edgeN) return [0, 0, 0, 0];
    const n = pn(x / 4, y / 4, 16, 16, 5);
    let r = lerp(104, 142, n);
    let g = lerp(90, 122, n);
    let b = lerp(72, 98, n);
    const rut = Math.min(Math.abs(u - 0.27), Math.abs(u - 0.73));
    if (rut < 0.055) {
      r *= 0.62;
      g *= 0.62;
      b *= 0.62;
    }
    if (Math.abs(u - 0.5) < 0.1 && pn(x / 3, y / 3, 21, 21, 6) > 0.72) [r, g, b] = [74, 86, 56];
    const s = h3(x, y, 11);
    if (s < 0.045) [r, g, b] = [158, 150, 138];
    else if (s > 0.96) [r, g, b] = [52, 44, 36];
    if (e > 0.62) {
      const t = smooth(0.62, 0.9, e);
      r = lerp(r, 50, t);
      g = lerp(g, 62, t);
      b = lerp(b, 40, t);
    }
    return [r, g, b, 255];
  });

  const bark = pixelTex(64, (x, y) => {
    const v = 0.5 * pn(x / 2, y / 16, 32, 4, 4) + 0.3 * pn(x, y / 8, 64, 8, 2) + 0.2 * h3(x, y, 3);
    let r = lerp(40, 112, v);
    let g = lerp(32, 90, v);
    let b = lerp(26, 70, v);
    if (pn(x / 2, y / 32, 32, 2, 8) < 0.3) {
      r *= 0.55;
      g *= 0.55;
      b *= 0.55;
    }
    const m = pn(x / 8, y / 8, 8, 8, 12);
    if (m > 0.62) {
      const t = clamp01((m - 0.62) * 5);
      r = lerp(r, 58, t);
      g = lerp(g, 96, t);
      b = lerp(b, 52, t);
    }
    return [r, g, b, 255];
  });

  const needles = pixelTex(64, (x, y) => {
    const n = pn(x / 4, y / 4, 16, 16, 21);
    let r = lerp(24, 48, n);
    let g = lerp(48, 78, n);
    let b = lerp(34, 56, n);
    const s = h3(x, y, 22);
    if (s > 0.8) [r, g, b] = [64, 100, 66];
    else if (s < 0.12) [r, g, b] = [12, 26, 22];
    if ((x + y * 2) % 7 === 0) {
      r += 10;
      g += 14;
      b += 8;
    }
    return [r, g, b, 255];
  });

  const leaves = pixelTex(64, (x, y) => {
    const n = pn(x / 4, y / 4, 16, 16, 31);
    const n2 = pn(x / 2, y / 2, 32, 32, 32);
    let r = lerp(32, 62, n) + (n2 - 0.5) * 20;
    let g = lerp(54, 92, n) + (n2 - 0.5) * 26;
    let b = lerp(30, 50, n) + (n2 - 0.5) * 12;
    const s = h3(x, y, 33);
    if (s > 0.9) [r, g, b] = [86, 112, 56];
    else if (s < 0.1) [r, g, b] = [14, 28, 20];
    return [r, g, b, 255];
  });

  const rock = pixelTex(32, (x, y) => {
    const n = pn(x / 4, y / 4, 8, 8, 41);
    const v = lerp(70, 118, n) + (h3(x, y, 42) - 0.5) * 24;
    let r = v * 0.95;
    let g = v;
    let b = v * 1.08;
    if (pn(x / 2, y / 8, 16, 4, 43) < 0.2) {
      r *= 0.55;
      g *= 0.55;
      b *= 0.6;
    }
    if (pn(x / 8, y / 8, 4, 4, 44) > 0.6)
      [r, g, b] = [lerp(r, 54, 0.7), lerp(g, 88, 0.7), lerp(b, 56, 0.7)];
    return [r, g, b, 255];
  });

  const fern = ps2Tex(64, (c, s) => {
    c.clearRect(0, 0, s, s);
    const fronds: number[][] = [
      [32, 63, 30, 30, 33, 3],
      [28, 63, 14, 36, 5, 16],
      [36, 63, 52, 34, 59, 18],
      [30, 63, 20, 46, 10, 38],
      [34, 63, 46, 46, 55, 38],
    ];
    c.lineCap = 'round';
    for (const f of fronds) {
      const [bx, by, cx, cy, tx, ty] = f as [number, number, number, number, number, number];
      const pt = (t: number) => ({
        x: (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * tx,
        y: (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ty,
      });
      c.lineWidth = 2;
      c.strokeStyle = 'rgb(34,62,38)';
      c.beginPath();
      for (let k = 0; k <= 16; k++) {
        const p = pt(k / 16);
        if (k === 0) c.moveTo(p.x, p.y);
        else c.lineTo(p.x, p.y);
      }
      c.stroke();
      for (let k = 2; k <= 16; k++) {
        const t = k / 16;
        const p = pt(t);
        const q = pt(Math.min(1, t + 0.04));
        const tx2 = q.x - p.x;
        const ty2 = q.y - p.y;
        const tl = Math.hypot(tx2, ty2) || 1;
        const nx = -ty2 / tl;
        const ny = tx2 / tl;
        const len = (1 - t) * 12 + 3;
        const col = `rgb(${Math.round(lerp(36, 80, t))},${Math.round(lerp(64, 116, t))},${Math.round(lerp(46, 76, t))})`;
        c.strokeStyle = col;
        c.lineWidth = 2;
        for (const side of [-1, 1]) {
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(
            p.x + side * nx * len + (tx2 / tl) * len * 0.7,
            p.y + side * ny * len + (ty2 / tl) * len * 0.7,
          );
          c.stroke();
        }
      }
    }
  });

  const bush = ps2Tex(64, (c, s) => {
    c.clearRect(0, 0, s, s);
    const r = rng(77);
    c.fillStyle = 'rgb(22,42,30)';
    c.beginPath();
    c.ellipse(32, 36, 24, 22, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 110; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r());
      const x = 32 + Math.cos(a) * d * 27;
      const y = 34 + Math.sin(a) * d * 25;
      const k = r();
      c.fillStyle = `rgb(${Math.round(lerp(26, 58, k))},${Math.round(lerp(46, 88, k))},${Math.round(lerp(40, 66, k))})`;
      c.beginPath();
      c.ellipse(x, y, 4 + r() * 2.5, 2.4 + r() * 1.4, r() * Math.PI, 0, Math.PI * 2);
      c.fill();
    }
  });

  const grass = ps2Tex(32, (c, s) => {
    c.clearRect(0, 0, s, s);
    const r = rng(91);
    for (let i = 0; i < 18; i++) {
      const x = 2 + r() * (s - 4);
      const h = 12 + r() * 18;
      const lean = (r() - 0.5) * 8;
      const k = r();
      c.fillStyle = `rgb(${Math.round(lerp(44, 104, k))},${Math.round(lerp(72, 124, k))},${Math.round(lerp(42, 64, k))})`;
      c.beginPath();
      c.moveTo(x - 1.4, s);
      c.lineTo(x + 1.4, s);
      c.lineTo(x + lean, s - h);
      c.fill();
    }
  });

  const fog = pixelTex(64, (x, y) => {
    const dx = (x - 31.5) / 32;
    const dy = (y - 31.5) / 32;
    const r2 = dx * dx + dy * dy;
    const n = 0.55 + 0.9 * pn(x / 6, y / 6, 10, 10, 51);
    const a = Math.pow(Math.max(0, 1 - r2), 1.6) * n;
    const q = Math.round(clamp01(a) * 7) / 7;
    return [190, 208, 224, Math.round(q * 255)];
  });

  const shaft = pixelTex(32, (x, y) => {
    const u = (x - 15.5) / 16;
    const v = y / 31;
    const g = Math.exp(-(u * u) / 0.16) * Math.pow(Math.sin(Math.PI * v), 0.8);
    const n = 0.65 + 0.7 * pn(x / 3, y / 5, 10, 6, 61);
    const q = Math.round(clamp01(g * n) * 6) / 6;
    return [196, 224, 255, Math.round(q * 255)];
  });

  const moon = pixelTex(64, (x, y) => {
    const dx = x - 31.5;
    const dy = y - 31.5;
    const r = Math.hypot(dx, dy);
    if (r < 10.5) {
      const cr = pn(x / 5, y / 5, 13, 13, 71);
      const k = cr > 0.62 ? 0.78 : cr < 0.3 ? 0.9 : 1;
      return [Math.round(238 * k), Math.round(244 * k), Math.round(238 * k), 255];
    }
    const a = Math.pow(Math.max(0, 1 - (r - 10.5) / 21.5), 2.4);
    const q = Math.round(a * 8) / 8;
    return [150, 190, 235, Math.round(q * 150)];
  });

  return { ground, dirt, bark, needles, leaves, rock, fern, bush, grass, fog, shaft, moon };
}

// ---------------------------------------------------------------- geometría + horneado de luz

const UP = new THREE.Vector3(0, 1, 0);

/** Prepara una pieza: no indexada, transformada, con vértices perturbados (consistente por posición) y solo position+uv. */
function prep(geo: THREE.BufferGeometry, m: THREE.Matrix4, jit = 0): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(m);
  if (jit > 0) {
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const kx = Math.round(x * 400);
      const ky = Math.round(y * 400);
      const kz = Math.round(z * 400);
      p.setXYZ(
        i,
        x + (h3(kx, ky, kz) - 0.5) * jit,
        y + (h3(ky, kz, kx + 3) - 0.5) * jit,
        z + (h3(kz, kx, ky + 7) - 0.5) * jit,
      );
    }
  }
  g.deleteAttribute('normal');
  geo.dispose();
  return g;
}

function scaleUV(g: THREE.BufferGeometry, su: number, sv: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
}

type ColorFn = (p: THREE.Vector3, n: THREE.Vector3, rnd: number, out: THREE.Color) => void;
/** Hornea color de vértice por cara (facetado) a partir de una función de sombreado. */
function paint(g: THREE.BufferGeometry, fn: ColorFn): THREE.BufferGeometry {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  const e = new THREE.Vector3();
  const out = new THREE.Color();
  for (let i = 0; i + 2 < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.subVectors(b, a).cross(e.subVectors(c, a)).normalize();
    const rnd = h3((a.x + b.x + c.x) * 2.1, (a.y + b.y + c.y) * 2.1, (a.z + b.z + c.z) * 2.1);
    for (let k = 0; k < 3; k++) {
      const p = k === 0 ? a : k === 1 ? b : c;
      fn(p, n, rnd, out);
      col[(i + k) * 3] = out.r;
      col[(i + k) * 3 + 1] = out.g;
      col[(i + k) * 3 + 2] = out.b;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Irradiancia nocturna horneada: ambiente de cielo + luna + relleno. */
function nightLight(n: THREE.Vector3): number {
  return 0.3 + 0.14 * n.y + 0.6 * Math.max(0, n.dot(MOON_DIR)) + 0.5 * Math.max(0, n.dot(FILL_DIR));
}

/** Aplica tinte frío al valor de luz. */
function tintOut(out: THREE.Color, r: number, g: number, b: number, l: number) {
  out.setRGB(r * l * 0.82, g * l * 0.97, b * l * 1.12);
}

function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(list, false);
  for (const x of list) x.dispose();
  return g;
}

/** Cilindro cónico orientado: devuelve el extremo final. */
function limb(
  list: THREE.BufferGeometry[],
  start: THREE.Vector3,
  dir: THREE.Vector3,
  len: number,
  r0: number,
  r1: number,
  sides: number,
  jit = 0.03,
): THREE.Vector3 {
  const g = new THREE.CylinderGeometry(r1, r0, len, sides, 1, true);
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
  const part = prep(g, new THREE.Matrix4().compose(start, q, new THREE.Vector3(1, 1, 1)), jit);
  scaleUV(part, 1, Math.max(0.5, len / 2.2));
  list.push(part);
  return start.clone().addScaledVector(dir, len);
}

interface TreeGeo {
  geo: THREE.BufferGeometry;
  /** true si tiene grupo de follaje (material 1). */
  hasLeaf: boolean;
  height: number;
  crown: number;
}

function finishTree(
  bark: THREE.BufferGeometry[],
  leaf: THREE.BufferGeometry[],
  height: number,
  crown: number,
): TreeGeo {
  const b = merge(bark);
  if (!leaf.length) return { geo: b, hasLeaf: false, height, crown };
  const l = merge(leaf);
  const geo = mergeGeometries([b, l], true);
  b.dispose();
  l.dispose();
  return { geo, hasLeaf: true, height, crown };
}

const BARK_COL = [0.95, 0.85, 0.75] as const;

function barkPaint(g: THREE.BufferGeometry, grey: number, mossy: boolean): THREE.BufferGeometry {
  return paint(g, (p, n, rnd, out) => {
    const occ = 0.4 + 0.6 * smooth(0, 3.2, p.y);
    const l = nightLight(n) * occ * (0.82 + 0.36 * rnd);
    const [r, gg, b] = BARK_COL;
    const gr = (r + gg + b) / 3;
    tintOut(out, lerp(r, gr, grey), lerp(gg, gr, grey), lerp(b, gr, grey), l * 2.9);
    if (mossy && p.y < 2.4) out.g *= 1 + 0.35 * (1 - p.y / 2.4);
  });
}

function leafPaint(
  g: THREE.BufferGeometry,
  y0: number,
  y1: number,
  base: readonly [number, number, number],
): THREE.BufferGeometry {
  return paint(g, (p, n, rnd, out) => {
    const occ = 0.42 + 0.58 * smooth(y0, y1, p.y);
    const l = nightLight(n) * occ * (0.78 + 0.44 * rnd);
    tintOut(out, base[0], base[1], base[2], l * 3.4);
  });
}

function buildPine(
  seed: number,
  H: number,
  tiers: number,
  rBase: number,
  tierH: number,
  trunkR: number,
  hueShift: number,
): TreeGeo {
  const r = rng(seed);
  const bark: THREE.BufferGeometry[] = [];
  const leaf: THREE.BufferGeometry[] = [];
  limb(bark, new THREE.Vector3(0, -0.3, 0), UP, H * 0.9, trunkR, trunkR * 0.3, 6, 0.04);
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const y0 = H * 0.2 + t * H * 0.66;
    const rad = rBase * (1 - 0.8 * t) * (0.9 + 0.22 * r());
    const h = tierH * (1 - 0.35 * t) * (0.95 + 0.2 * r());
    const cone = new THREE.ConeGeometry(rad, h, 7, 1, false);
    cone.translate(0, h / 2, 0);
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler((r() - 0.5) * 0.12, r() * Math.PI * 2, (r() - 0.5) * 0.12),
    );
    const part = prep(
      cone,
      new THREE.Matrix4().compose(new THREE.Vector3(0, y0, 0), q, new THREE.Vector3(1, 1, 1)),
      rad * 0.16,
    );
    scaleUV(part, 2, 1.3);
    leaf.push(part);
  }
  const top = new THREE.ConeGeometry(0.3, 1.6, 5, 1, false);
  top.translate(0, 0.8 + H * 0.84, 0);
  leaf.push(prep(top, new THREE.Matrix4(), 0.05));
  const bk = bark.map((g) => barkPaint(g, 0.1, true));
  const lf = leaf.map((g) =>
    leafPaint(g, H * 0.18, H * 0.95, [0.5 + hueShift, 0.78, 0.62 - hueShift]),
  );
  return finishTree(bk, lf, H, rBase);
}

function buildBroad(seed: number): TreeGeo {
  const r = rng(seed);
  const bark: THREE.BufferGeometry[] = [];
  const leaf: THREE.BufferGeometry[] = [];
  const base = new THREE.Vector3(0, -0.3, 0);
  limb(bark, base, UP, 5.4, 0.52, 0.3, 7, 0.05);
  // Arranque ensanchado del tronco.
  const flare = new THREE.CylinderGeometry(0.5, 0.95, 0.9, 7, 1, true);
  flare.translate(0, 0.15, 0);
  const fp = prep(flare, new THREE.Matrix4(), 0.08);
  scaleUV(fp, 1, 0.5);
  bark.push(fp);
  // Tres ramas maestras.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + r();
    const d = new THREE.Vector3(Math.cos(a) * 0.7, 0.75, Math.sin(a) * 0.7).normalize();
    limb(bark, new THREE.Vector3(0, 3.8 + r() * 0.6, 0), d, 2.4, 0.18, 0.07, 5, 0.04);
  }
  const blobs = 6;
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + r() * 0.7;
    const rad = i === 0 ? 0.001 : 1.5 + r() * 0.9;
    const rr = i === 0 ? 0 : rad;
    const rd = 1.7 + r() * 0.8;
    const ico = new THREE.IcosahedronGeometry(rd, 0);
    const pos = new THREE.Vector3(
      Math.cos(a) * rr * 0.8,
      5.4 + r() * 2.2 + (i === 0 ? 1.2 : 0),
      Math.sin(a) * rr * 0.8,
    );
    const sc = new THREE.Vector3(1 + r() * 0.2, 0.78 + r() * 0.15, 1 + r() * 0.2);
    const part = prep(ico, new THREE.Matrix4().compose(pos, new THREE.Quaternion(), sc), 0.7);
    scaleUV(part, 1.6, 1.6);
    leaf.push(part);
  }
  const bk = bark.map((g) => barkPaint(g, 0.0, true));
  const lf = leaf.map((g) => leafPaint(g, 4.2, 9.5, [0.5, 0.8, 0.5]));
  return finishTree(bk, lf, 9.5, 3.2);
}

function buildDead(seed: number, H: number, nBranch: number, bend: number): TreeGeo {
  const r = rng(seed);
  const bark: THREE.BufferGeometry[] = [];
  const segs = 5;
  let pos = new THREE.Vector3(0, -0.3, 0);
  let dir = new THREE.Vector3(0, 1, 0);
  const trunkPts: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  const segLen = H / segs;
  for (let i = 0; i < segs; i++) {
    trunkPts.push({ p: pos.clone(), d: dir.clone() });
    const r0 = 0.26 * (1 - i / (segs + 1));
    const r1 = 0.26 * (1 - (i + 1) / (segs + 1));
    pos = limb(bark, pos, dir, segLen * 1.05, r0, r1 * 0.9, 5, 0.03);
    dir = new THREE.Vector3(dir.x + (r() - 0.5) * bend, 1, dir.z + (r() - 0.5) * bend).normalize();
  }
  for (let i = 0; i < nBranch; i++) {
    const tp = trunkPts[1 + Math.floor(r() * (segs - 1))]!;
    const a = r() * Math.PI * 2;
    const up = 0.35 + r() * 0.7;
    let d = new THREE.Vector3(Math.cos(a), up, Math.sin(a)).normalize();
    let p = tp.p.clone().addScaledVector(tp.d, segLen * r());
    const bl = 1.3 + r() * 1.6;
    const rad = 0.09 + r() * 0.04;
    p = limb(bark, p, d, bl, rad, rad * 0.45, 4, 0.03);
    // Segunda sección + ramita, más finas y curvadas hacia arriba.
    d = new THREE.Vector3(d.x + (r() - 0.5) * 0.8, d.y + 0.5, d.z + (r() - 0.5) * 0.8).normalize();
    const p2 = limb(bark, p, d, bl * 0.8, rad * 0.45, rad * 0.18, 4, 0.02);
    if (r() > 0.4) {
      const d2 = new THREE.Vector3((r() - 0.5) * 1.5, 0.6, (r() - 0.5) * 1.5).normalize();
      limb(bark, p2, d2, bl * 0.5, rad * 0.2, 0.012, 3, 0.01);
    }
  }
  const bk = bark.map((g) => barkPaint(g, 0.75, false));
  return finishTree(bk, [], H + 2, 1.2);
}

/** Dos o tres planos cruzados con base en y=0 y degradado vertical horneado. */
function crossQuads(
  n: number,
  w: number,
  h: number,
  lean: number,
  c0: number,
  c1: number,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k * Math.PI) / n;
    const cx = (Math.cos(a) * w) / 2;
    const cz = (Math.sin(a) * w) / 2;
    const o = k * 4;
    pos.push(-cx, -0.04, -cz, cx, -0.04, cz, cx + lean, h, cz, -cx + lean, h, -cz);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    col.push(c0, c0, c0, c0, c0, c0, c1, c1, c1, c1, c1, c1);
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- módulo principal

interface Inst {
  x: number;
  y: number;
  z: number;
  yaw: number;
  sx: number;
  sy: number;
  sz: number;
  rx?: number;
  rz?: number;
  col: THREE.Color;
}

export function createForest(ctx: ModuleCtx): IntroModule {
  const t0 = performance.now();
  const { path } = ctx;
  const group = new THREE.Group();
  const toDispose: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(o: T): T => {
    toDispose.push(o);
    return o;
  };
  const instMeshes: THREE.InstancedMesh[] = [];

  const Z_MIN = -(path.length + 35);
  const wisp = path.wisp;
  const R = rng(20240607);

  // ---- texturas y materiales
  const tex = makeTextures();
  for (const t of Object.values(tex)) track(t);
  const mat = (p: THREE.MeshBasicMaterialParameters) =>
    track(ps2Basic({ vertexColors: true, ...p }));
  const mTerrain = mat({ map: tex.ground });
  const mPath = mat({
    map: tex.dirt,
    alphaTest: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mBark = mat({ map: tex.bark });
  const mNeedle = mat({ map: tex.needles });
  const mLeaf = mat({ map: tex.leaves });
  const mRock = mat({ map: tex.rock });
  const mFern = mat({ map: tex.fern, alphaTest: 0.5, side: THREE.DoubleSide });
  const mBush = mat({ map: tex.bush, alphaTest: 0.5, side: THREE.DoubleSide });
  const mGrass = mat({ map: tex.grass, alphaTest: 0.5, side: THREE.DoubleSide });
  const mPlain = mat({});

  // ---- terreno
  const NX = 84;
  const NZ = 100;
  const DX = (2 * X_HALF) / NX;
  const DZ = (Z_MAX - Z_MIN) / NZ;
  const VX = NX + 1;
  const gi = (ix: number, iz: number) => iz * VX + ix;

  const heightRaw = (x: number, z: number): number => {
    const ad = Math.abs(x - path.centerX(z));
    let flat = smooth(2.3, 6.8, ad);
    const dw = Math.hypot(x - wisp.x, z - wisp.z);
    flat *= smooth(4, 10, dw);
    let h = (vnoise(x * 0.07 + 10, z * 0.07, 5) - 0.5) * 4.2;
    h += (vnoise(x * 0.2, z * 0.2, 6) - 0.5) * 1.2;
    h += (vnoise(x * 0.6, z * 0.6, 8) - 0.5) * 0.28;
    h += smooth(12, 42, ad) * (ad - 12) * 0.14;
    return h * flat;
  };
  const hGrid = new Float32Array(VX * (NZ + 1));
  for (let iz = 0; iz <= NZ; iz++) {
    for (let ix = 0; ix <= NX; ix++) {
      hGrid[gi(ix, iz)] = heightRaw(-X_HALF + ix * DX, Z_MAX - iz * DZ);
    }
  }
  /** Altura bilineal del terreno (coincide con la malla). */
  const hAt = (x: number, z: number): number => {
    const fx = clamp01((x + X_HALF) / (2 * X_HALF)) * NX;
    const fz = clamp01((Z_MAX - z) / (Z_MAX - Z_MIN)) * NZ;
    const ix = Math.min(NX - 1, Math.floor(fx));
    const iz = Math.min(NZ - 1, Math.floor(fz));
    const tx = fx - ix;
    const tz = fz - iz;
    const a = hGrid[gi(ix, iz)]!;
    const b = hGrid[gi(ix + 1, iz)]!;
    const c = hGrid[gi(ix, iz + 1)]!;
    const d = hGrid[gi(ix + 1, iz + 1)]!;
    return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
  };

  // ---- colocación de árboles (rechazo con separación mínima y despeje del sendero)
  const TREE_N = 520;
  const cell = 2.3;
  const buckets = new Map<number, number[]>();
  const bkey = (cx: number, cz: number) => cx * 4096 + cz;
  interface Tree extends Inst {
    type: number;
  }
  const trees: Tree[] = [];
  const treePts: { x: number; z: number }[] = [];
  for (let tries = 0; tries < 40000 && trees.length < TREE_N; tries++) {
    const x = (R() * 2 - 1) * (X_HALF - 2);
    const z = Z_MAX - R() * (Z_MAX - Z_MIN) * 0.985;
    const ad = Math.abs(x - path.centerX(z));
    let clear = 2.9;
    if (z < -56 && z > wisp.z - 4) clear = 4.6;
    if (ad < clear) continue;
    if (Math.hypot(x - wisp.x, z - wisp.z) < 8) continue;
    const pa = (0.32 + 0.68 * smooth(3, 14, ad)) * (1 - 0.55 * smooth(26, 46, ad));
    if (R() > pa) continue;
    const cx = Math.floor(x / cell);
    const cz = Math.floor(z / cell);
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++) {
      for (let dz = -1; dz <= 1 && ok; dz++) {
        const arr = buckets.get(bkey(cx + dx, cz + dz));
        if (!arr) continue;
        for (const j of arr) {
          const o = treePts[j]!;
          if ((o.x - x) ** 2 + (o.z - z) ** 2 < cell * cell) {
            ok = false;
            break;
          }
        }
      }
    }
    if (!ok) continue;
    const near = ad < 8;
    const rt = R();
    let type: number;
    if (near) type = rt < 0.3 ? 0 : rt < 0.52 ? 1 : rt < 0.64 ? 2 : rt < 0.84 ? 3 : 4;
    else type = rt < 0.3 ? 0 : rt < 0.56 ? 1 : rt < 0.78 ? 2 : rt < 0.9 ? 3 : 4;
    const s = lerp(0.82, 1.32, R());
    const idx = treePts.length;
    treePts.push({ x, z });
    const bk = buckets.get(bkey(cx, cz));
    if (bk) bk.push(idx);
    else buckets.set(bkey(cx, cz), [idx]);
    trees.push({
      type,
      x,
      z,
      y: hAt(x, z),
      yaw: (R() - 0.5) * 1.4,
      sx: s * (0.9 + 0.2 * R()),
      sy: s * (0.9 + 0.25 * R()),
      sz: 0,
      rx: (R() - 0.5) * 0.07,
      rz: (R() - 0.5) * 0.07,
      col: new THREE.Color(),
    });
  }
  for (const t of trees) t.sz = t.sx;

  // ---- campo de sombras horneado (copas -> manchas oscuras; huecos -> claros lunares)
  const shade = new Float32Array(VX * (NZ + 1));
  for (let iz = 0; iz <= NZ; iz++) {
    for (let ix = 0; ix <= NX; ix++) {
      const x = -X_HALF + ix * DX;
      const z = Z_MAX - iz * DZ;
      shade[gi(ix, iz)] = 0.12 + 0.34 * vnoise(x * 0.11 + 4, z * 0.11, 21);
    }
  }
  const stamp = (cx: number, cz: number, rad: number, amt: number) => {
    const i0 = Math.max(0, Math.floor((cx - rad + X_HALF) / DX));
    const i1 = Math.min(NX, Math.ceil((cx + rad + X_HALF) / DX));
    const j0 = Math.max(0, Math.floor((Z_MAX - (cz + rad)) / DZ));
    const j1 = Math.min(NZ, Math.ceil((Z_MAX - (cz - rad)) / DZ));
    for (let iz = j0; iz <= j1; iz++) {
      for (let ix = i0; ix <= i1; ix++) {
        const x = -X_HALF + ix * DX;
        const z = Z_MAX - iz * DZ;
        const d2 = ((x - cx) ** 2 + (z - cz) ** 2) / (rad * rad);
        if (d2 < 1) {
          const k = gi(ix, iz);
          shade[k] = Math.min(1, shade[k]! + amt * (1 - d2));
        }
      }
    }
  };
  const treeGeos: TreeGeo[] = [
    buildPine(11, 13, 7, 2.5, 3.0, 0.22, 0),
    buildPine(23, 9.5, 5, 2.9, 2.6, 0.2, 0.04),
    buildBroad(37),
    buildDead(53, 8.5, 7, 0.9),
    buildDead(67, 11, 5, 0.55),
  ];
  for (const t of trees) {
    const g = treeGeos[t.type]!;
    const ht = g.height * t.sy;
    const rc = g.crown * t.sx * (t.type >= 3 ? 1 : 0.85);
    const amt = t.type >= 3 ? 0.1 : 0.5;
    stamp(t.x, t.z, rc, amt);
    if (t.type < 3) {
      for (let k = 1; k <= 4; k++) {
        stamp(
          t.x + SHADOW_DIR.x * ht * 0.3 * k,
          t.z + SHADOW_DIR.z * ht * 0.3 * k,
          rc * (1 - 0.1 * k),
          0.17,
        );
      }
    }
  }
  for (let iz = 0; iz <= NZ; iz++) {
    for (let ix = 0; ix <= NX; ix++) {
      const x = -X_HALF + ix * DX;
      const z = Z_MAX - iz * DZ;
      const dw = Math.hypot(x - wisp.x, z - wisp.z);
      const k = gi(ix, iz);
      shade[k] = shade[k]! * lerp(0.15, 1, smooth(2, 11, dw));
    }
  }
  const litAt = (x: number, z: number): number => {
    const ix = Math.round(clamp01((x + X_HALF) / (2 * X_HALF)) * NX);
    const iz = Math.round(clamp01((Z_MAX - z) / (Z_MAX - Z_MIN)) * NZ);
    return 1 - shade[gi(ix, iz)]!;
  };

  // Color de las instancias de árbol según claro/sombra.
  for (const t of trees) {
    const l = litAt(t.x, t.z);
    const v = 1.2 + 0.4 * l + (R() - 0.5) * 0.18;
    t.col.setRGB(v * (0.94 + R() * 0.1), v, v * (0.96 + R() * 0.1));
  }

  // ---- malla del terreno
  {
    const pos = new Float32Array(VX * (NZ + 1) * 3);
    const uv = new Float32Array(VX * (NZ + 1) * 2);
    const col = new Float32Array(VX * (NZ + 1) * 3);
    const SH = new THREE.Color().setRGB(0.12, 0.16, 0.16);
    const LI = new THREE.Color().setRGB(0.62, 0.78, 0.7);
    const c = new THREE.Color();
    const hc = (ix: number, iz: number) =>
      hGrid[gi(Math.min(NX, Math.max(0, ix)), Math.min(NZ, Math.max(0, iz)))]!;
    const nrm = new THREE.Vector3();
    for (let iz = 0; iz <= NZ; iz++) {
      for (let ix = 0; ix <= NX; ix++) {
        const k = gi(ix, iz);
        const x = -X_HALF + ix * DX;
        const z = Z_MAX - iz * DZ;
        const h = hGrid[k]!;
        pos[k * 3] = x;
        pos[k * 3 + 1] = h;
        pos[k * 3 + 2] = z;
        uv[k * 2] = x * 0.34;
        uv[k * 2 + 1] = z * 0.34;
        const cav = (hc(ix - 2, iz) + hc(ix + 2, iz) + hc(ix, iz - 2) + hc(ix, iz + 2)) / 4 - h;
        nrm
          .set(
            -(hc(ix + 1, iz) - hc(ix - 1, iz)) / (2 * DX),
            1,
            (hc(ix, iz + 1) - hc(ix, iz - 1)) / (2 * DZ),
          )
          .normalize();
        const ad = Math.abs(x - path.centerX(z));
        const lit = 1 - shade[k]!;
        c.copy(SH).lerp(LI, lit);
        const l =
          (0.55 + 0.75 * Math.max(0, nrm.dot(MOON_DIR)) + 0.3 * nrm.y) *
          (1 - Math.max(-0.15, Math.min(0.45, cav * 0.25)));
        const dirt = 1 - smooth(1.6, 4.8, ad);
        const vr = 0.88 + 0.24 * h3(ix, iz, 5);
        col[k * 3] = c.r * l * vr * (1 + 0.1 * dirt);
        col[k * 3 + 1] = c.g * l * vr * (1 + 0.0 * dirt);
        col[k * 3 + 2] = c.b * l * vr * (1 - 0.2 * dirt);
      }
    }
    const idx = new Uint16Array(NX * NZ * 6);
    let q = 0;
    for (let iz = 0; iz < NZ; iz++) {
      for (let ix = 0; ix < NX; ix++) {
        const a = gi(ix, iz);
        const b = a + 1;
        const cc = a + VX;
        const d = cc + 1;
        if ((ix + iz) % 2 === 0) {
          idx.set([a, b, cc, b, d, cc], q);
        } else {
          idx.set([a, b, d, a, d, cc], q);
        }
        q += 6;
      }
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const m = new THREE.Mesh(g, mTerrain);
    m.frustumCulled = false;
    group.add(m);
  }

  // ---- sendero de tierra (cinta que sigue centerX)
  {
    const z0 = Z_MAX - 3;
    const z1 = wisp.z - 7;
    const step = 0.7;
    const rows = Math.ceil((z0 - z1) / step) + 1;
    const cols = 7;
    const pos = new Float32Array(rows * cols * 3);
    const uv = new Float32Array(rows * cols * 2);
    const col = new Float32Array(rows * cols * 3);
    for (let j = 0; j < rows; j++) {
      const z = z0 - j * step;
      const cx = path.centerX(z);
      const hw = 1.5 + 0.22 * vnoise(z * 0.2, 3.3, 2);
      for (let i = 0; i < cols; i++) {
        const u = -1 + (2 * i) / (cols - 1);
        const x = cx + u * hw;
        const k = j * cols + i;
        pos[k * 3] = x;
        pos[k * 3 + 1] = hAt(x, z) + 0.05;
        pos[k * 3 + 2] = z;
        uv[k * 2] = (u + 1) / 2;
        uv[k * 2 + 1] = z * 0.3;
        const lit = Math.max(0.3, litAt(x, z));
        const v = lerp(0.3, 1.0, lit * lit) * (0.92 + 0.16 * h3(i, j, 3));
        col[k * 3] = v * 1.0;
        col[k * 3 + 1] = v * 0.97;
        col[k * 3 + 2] = v * 0.98;
      }
    }
    const idx: number[] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = j * cols + i;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, mPath);
    m.frustumCulled = false;
    group.add(m);
  }

  // ---- instanciado genérico
  const dummy = new THREE.Object3D();
  const addInstanced = (
    geo: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    items: Inst[],
  ) => {
    if (!items.length) return;
    const m = new THREE.InstancedMesh(geo, material, items.length);
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(it.rx ?? 0, it.yaw, it.rz ?? 0, 'YXZ');
      dummy.scale.set(it.sx, it.sy, it.sz);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, it.col);
    });
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    instMeshes.push(m);
    group.add(m);
  };

  // ---- árboles
  treeGeos.forEach((tg, type) => {
    track(tg.geo);
    const items = trees.filter((t) => t.type === type).map((t) => ({ ...t, y: t.y - 0.05 }));
    const mats = tg.hasLeaf ? [mBark, type === 2 ? mLeaf : mNeedle] : [mBark];
    addInstanced(tg.geo, tg.hasLeaf ? mats : mBark, items);
  });

  // ---- sotobosque
  interface Pt {
    x: number;
    z: number;
    ad: number;
  }
  const scatter = (n: number, minAd: number, maxAd: number, decay: number): Pt[] => {
    const out: Pt[] = [];
    for (let tries = 0; tries < n * 120 && out.length < n; tries++) {
      const x = (R() * 2 - 1) * (X_HALF - 3);
      const z = Z_MAX - R() * (Z_MAX - Z_MIN) * 0.97;
      const ad = Math.abs(x - path.centerX(z));
      if (ad < minAd || ad > maxAd) continue;
      if (R() > Math.exp(-(ad - minAd) / decay)) continue;
      out.push({ x, z, ad });
    }
    return out;
  };
  const tintCol = (lit: number, k: number, warm = 0): THREE.Color => {
    const v = (0.36 + 0.72 * lit) * k;
    return new THREE.Color().setRGB(v * (0.84 + warm), v * 0.98, v * 1.1);
  };

  // Helechos
  {
    const g = track(crossQuads(3, 1.5, 1.0, 0.1, 0.32, 1.25));
    const items: Inst[] = scatter(520, 1.7, 40, 9).map((p) => {
      const s = 0.6 + R() * 0.7;
      return {
        x: p.x,
        y: hAt(p.x, p.z),
        z: p.z,
        yaw: R() * Math.PI * 2,
        sx: s,
        sy: s * (0.8 + R() * 0.5),
        sz: s,
        col: tintCol(litAt(p.x, p.z), 0.68 + R() * 0.2, -0.06),
      };
    });
    addInstanced(g, mFern, items);
  }
  // Arbustos
  {
    const g = track(crossQuads(3, 2.0, 1.5, 0.05, 0.3, 1.2));
    const items: Inst[] = scatter(120, 2.5, 40, 12).map((p) => {
      const s = 0.55 + R() * 0.55;
      return {
        x: p.x,
        y: hAt(p.x, p.z),
        z: p.z,
        yaw: R() * Math.PI * 2,
        sx: s,
        sy: s * (0.8 + R() * 0.4),
        sz: s,
        col: tintCol(litAt(p.x, p.z), 0.6 + R() * 0.2, -0.08),
      };
    });
    addInstanced(g, mBush, items);
  }
  // Matas de hierba alta
  {
    const g = track(crossQuads(2, 0.9, 1.0, 0.08, 0.35, 1.3));
    const items: Inst[] = scatter(900, 1.45, 30, 7).map((p) => {
      const s = 0.7 + R() * 0.8;
      return {
        x: p.x,
        y: hAt(p.x, p.z),
        z: p.z,
        yaw: R() * Math.PI * 2,
        sx: s,
        sy: s * (0.7 + R() * 0.7),
        sz: s,
        col: tintCol(litAt(p.x, p.z), 0.75 + R() * 0.25, 0.0),
      };
    });
    addInstanced(g, mGrass, items);
  }
  // Rocas
  {
    const ico = new THREE.IcosahedronGeometry(1, 0);
    const part = prep(ico, new THREE.Matrix4(), 0.32);
    scaleUV(part, 1.4, 1.4);
    paint(part, (p, n, rnd, out) => {
      const l =
        (0.34 +
          0.4 * Math.max(0, n.y) +
          0.5 * Math.max(0, n.dot(MOON_DIR)) +
          0.35 * Math.max(0, n.dot(FILL_DIR))) *
        (0.8 + 0.4 * rnd);
      const occ = 0.55 + 0.45 * smooth(-0.7, 0.8, p.y);
      tintOut(out, 0.95, 1.0, 1.05, l * occ * 1.6);
    });
    track(part);
    const items: Inst[] = scatter(110, 1.7, 44, 14).map((p) => {
      let s = 0.22 + R() * R() * 1.5;
      if (p.ad < 3) s = Math.min(s, 0.45);
      return {
        x: p.x,
        y: hAt(p.x, p.z) + s * 0.15,
        z: p.z,
        yaw: R() * Math.PI * 2,
        sx: s * (0.9 + R() * 0.6),
        sy: s * (0.55 + R() * 0.45),
        sz: s * (0.9 + R() * 0.6),
        rx: (R() - 0.5) * 0.4,
        rz: (R() - 0.5) * 0.4,
        col: tintCol(litAt(p.x, p.z), 0.9 + R() * 0.3),
      };
    });
    addInstanced(part, mRock, items);
  }
  // Troncos caídos
  {
    const list: THREE.BufferGeometry[] = [];
    limb(list, new THREE.Vector3(-2, 0.3, 0), new THREE.Vector3(1, 0, 0), 4.2, 0.3, 0.24, 7, 0.05);
    limb(
      list,
      new THREE.Vector3(0.4, 0.28, 0.1),
      new THREE.Vector3(0.9, 0.1, 0.4).normalize(),
      1.3,
      0.1,
      0.04,
      4,
      0.02,
    );
    const g = merge(list.map((x) => barkPaint(x, 0.15, true)));
    track(g);
    const items: Inst[] = scatter(24, 3.2, 40, 14).map((p) => ({
      x: p.x,
      y: hAt(p.x, p.z) - 0.06,
      z: p.z,
      yaw: R() * Math.PI * 2,
      sx: 0.8 + R() * 0.7,
      sy: 0.8 + R() * 0.5,
      sz: 0.8 + R() * 0.5,
      rz: (R() - 0.5) * 0.12,
      col: tintCol(litAt(p.x, p.z), 0.9 + R() * 0.2),
    }));
    addInstanced(g, mBark, items);
  }
  // Setas pequeñas (racimos de tres)
  {
    const list: THREE.BufferGeometry[] = [];
    const offs: [number, number, number][] = [
      [0, 0, 1],
      [0.14, 0.05, 0.7],
      [-0.1, 0.12, 0.85],
    ];
    for (const [ox, oz, k] of offs) {
      const stem = new THREE.CylinderGeometry(0.018 * k, 0.026 * k, 0.12 * k, 5, 1, true);
      stem.translate(ox, 0.06 * k, oz);
      list.push(
        paint(prep(stem, new THREE.Matrix4(), 0), (_p, n, rnd, out) =>
          out
            .setRGB(0.85 * (0.8 + 0.3 * rnd), 0.88, 0.95)
            .multiplyScalar(0.7 + 0.5 * Math.max(0, n.y + 0.6)),
        ),
      );
      const cap = new THREE.ConeGeometry(0.075 * k, 0.07 * k, 6, 1, false);
      cap.translate(ox, 0.12 * k + 0.035 * k, oz);
      list.push(
        paint(prep(cap, new THREE.Matrix4(), 0.006), (_p, n, rnd, out) =>
          out
            .setRGB(1.1 * (0.85 + 0.3 * rnd), 1.0, 1.0)
            .multiplyScalar(0.8 + 0.6 * Math.max(0, n.y)),
        ),
      );
    }
    const g = merge(list);
    track(g);
    const items: Inst[] = scatter(70, 1.7, 22, 5).map((p) => {
      const warm = R() < 0.16;
      const c = warm
        ? new THREE.Color().setRGB(1.5, 0.8, 0.35)
        : new THREE.Color().setRGB(0.8 + R() * 0.3, 0.95, 1.2);
      return {
        x: p.x,
        y: hAt(p.x, p.z),
        z: p.z,
        yaw: R() * 6.28,
        sx: 1.3,
        sy: 1.3,
        sz: 1.3,
        col: c,
      };
    });
    addInstanced(g, mPlain, items);
  }
  // Zarzas: arcos de tallos finos
  {
    const list: THREE.BufferGeometry[] = [];
    const rb = rng(808);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rb();
      let d = new THREE.Vector3(Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6).normalize();
      let p = new THREE.Vector3((rb() - 0.5) * 0.2, 0, (rb() - 0.5) * 0.2);
      for (let k = 0; k < 4; k++) {
        p = limb(list, p, d, 0.4 - k * 0.03, 0.06 * (1 - k * 0.2), 0.05 * (1 - k * 0.22), 4, 0.02);
        d = new THREE.Vector3(d.x * 1.0, d.y - 0.42, d.z * 1.0).normalize();
      }
    }
    const g = merge(
      list.map((x) =>
        paint(x, (p, n, rnd, out) => {
          const l = nightLight(n) * (0.7 + 0.6 * rnd) * (0.5 + 0.5 * smooth(0, 0.8, p.y));
          out.setRGB(0.5 * l, 0.42 * l, 0.3 * l);
        }),
      ),
    );
    track(g);
    const items: Inst[] = scatter(26, 3.0, 22, 6).map((p) => {
      const s = 0.5 + R() * 0.45;
      return {
        x: p.x,
        y: hAt(p.x, p.z),
        z: p.z,
        yaw: R() * 6.28,
        sx: s,
        sy: s,
        sz: s,
        col: new THREE.Color().setRGB(0.7, 0.75, 0.75),
      };
    });
    addInstanced(g, mPlain, items);
  }

  // ---- cielo: cúpula, estrellas, luna (siguen a la cámara)
  const sky = new THREE.Group();
  sky.renderOrder = -10;
  group.add(sky);
  {
    const geo = track(new THREE.SphereGeometry(120, 24, 14));
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const c0 = new THREE.Color(FOG_COLOR);
    const c1 = new THREE.Color(0x1d4258);
    const c2 = new THREE.Color(0x0a1c33);
    const glow = new THREE.Color(0x3f6f8c);
    const c = new THREE.Color();
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      const y = Math.max(0, v.y);
      c.copy(c0)
        .lerp(c1, smooth(0.0, 0.2, y))
        .lerp(c2, smooth(0.2, 1, y));
      const gl = Math.pow(Math.max(0, v.dot(MOON_DIR)), 6) * smooth(0, 0.1, v.y);
      c.lerp(glow, gl * 0.55);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = track(
      ps2Basic({
        vertexColors: true,
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
        depthTest: false,
      }),
    );
    const dome = new THREE.Mesh(geo, m);
    dome.frustumCulled = false;
    dome.renderOrder = -10;
    sky.add(dome);
  }
  {
    const n = 460;
    const rs = rng(4242);
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = 0.1 + Math.pow(rs(), 0.8) * 0.9;
      const a = rs() * Math.PI * 2;
      const rr = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(a) * rr * 105;
      pos[i * 3 + 1] = y * 105;
      pos[i * 3 + 2] = Math.sin(a) * rr * 105;
      const b = Math.pow(rs(), 2.2) * 0.8 + 0.2;
      const fade = smooth(0.1, 0.35, y);
      const warm = rs();
      col[i * 3] = b * fade * (0.8 + warm * 0.3);
      col[i * 3 + 1] = b * fade * 0.92;
      col[i * 3 + 2] = b * fade * (1.15 - warm * 0.2);
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = track(
      patchPS2(
        new THREE.PointsMaterial({
          size: 1.9,
          sizeAttenuation: false,
          vertexColors: true,
          fog: false,
          depthWrite: false,
        }),
      ),
    );
    const pts = new THREE.Points(geo, m);
    pts.frustumCulled = false;
    pts.renderOrder = -9;
    sky.add(pts);
  }
  {
    const m = track(
      ps2Basic({
        map: tex.moon,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        side: THREE.DoubleSide,
      }),
    );
    const geo = track(new THREE.PlaneGeometry(52, 52));
    const moon = new THREE.Mesh(geo, m);
    moon.position.copy(MOON_DIR).multiplyScalar(100);
    moon.lookAt(0, 0, 0);
    moon.frustumCulled = false;
    moon.renderOrder = -8;
    sky.add(moon);
  }

  // ---- atmósfera: niebla baja, haces lunares, manchas de claro
  const fogMesh = (() => {
    const pos: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const rf = rng(999);
    let o = 0;
    for (let i = 0; i < 34; i++) {
      const z = Z_MAX - 2 - rf() * (Z_MAX - Z_MIN - 14);
      const x = path.centerX(z) + (rf() < 0.5 ? -1 : 1) * (3.5 + rf() * 9);
      const s = 5 + rf() * 6;
      const y = hAt(x, z) + 0.28 + rf() * 0.55;
      const ph = rf() * Math.PI;
      const cs = Math.cos(ph) * s;
      const sn = Math.sin(ph) * s;
      const corners: [number, number][] = [
        [-cs - sn, -sn + cs],
        [cs - sn, sn + cs],
        [cs + sn, sn - cs],
        [-cs + sn, -sn - cs],
      ];
      corners.forEach(([dx, dz]) => pos.push(x + dx, y, z + dz));
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      const v = 0.38 + rf() * 0.3;
      for (let k = 0; k < 4; k++) col.push(v * 0.78, v * 0.92, v * 1.05);
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
      o += 4;
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    const m = track(
      ps2Basic({
        map: tex.fog,
        vertexColors: true,
        transparent: true,
        opacity: 0.17,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    group.add(mesh);
    return mesh;
  })();

  {
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    let o = 0;
    const shafts: [number, number][] = [
      [-4, -5],
      [-9, 4.5],
      [-17, -6.5],
      [-26, 5.5],
      [-38, -4.5],
    ];
    const axis = new THREE.Vector3(-0.22, 1, -0.45).normalize();
    for (const [z, off] of shafts) {
      const bx = path.centerX(z) + off;
      const base = new THREE.Vector3(bx, hAt(bx, z) + 0.1, z);
      const len = 6.5;
      const top = base.clone().addScaledVector(axis, len);
      const w1 = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 0, 1)).normalize();
      const w2 = new THREE.Vector3().crossVectors(axis, w1).normalize();
      for (const w of [w1, w2]) {
        const hw = 1.1;
        const a = base.clone().addScaledVector(w, -hw);
        const b = base.clone().addScaledVector(w, hw);
        const c = top.clone().addScaledVector(w, hw * 1.35);
        const d = top.clone().addScaledVector(w, -hw * 1.35);
        for (const p of [a, b, c, d]) pos.push(p.x, p.y, p.z);
        uv.push(0, 0, 1, 0, 1, 1, 0, 1);
        idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
        o += 4;
      }
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    const m = track(
      ps2Basic({
        map: tex.shaft,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    group.add(mesh);

    // Manchas de claro donde caen los haces.
    const ppos: number[] = [];
    const puv: number[] = [];
    const pidx: number[] = [];
    let po = 0;
    for (const [z, off] of shafts) {
      const bx = path.centerX(z) + off + axis.x * 0.5;
      const y = hAt(bx, z) + 0.07;
      const sx = 2.6;
      const sz = 3.4;
      ppos.push(bx - sx, y, z + sz, bx + sx, y, z + sz, bx + sx, y, z - sz, bx - sx, y, z - sz);
      puv.push(0, 0, 1, 0, 1, 1, 0, 1);
      pidx.push(po, po + 1, po + 2, po, po + 2, po + 3);
      po += 4;
    }
    const pg = track(new THREE.BufferGeometry());
    pg.setAttribute('position', new THREE.Float32BufferAttribute(ppos, 3));
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(puv, 2));
    pg.setIndex(pidx);
    const pm = track(
      ps2Basic({
        map: tex.fog,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        color: 0xa8d0f0,
      }),
    );
    const pmesh = new THREE.Mesh(pg, pm);
    pmesh.frustumCulled = false;
    pmesh.renderOrder = 3;
    group.add(pmesh);
  }

  // ---- estadísticas (solo en desarrollo)
  const stats = { drawCalls: 0, triangles: 0 };
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh && !(o as THREE.Points).isPoints) return;
    const geo = m.geometry;
    const tri = geo.index ? geo.index.count / 3 : (geo.attributes.position?.count ?? 0) / 3;
    const n = (o as THREE.InstancedMesh).isInstancedMesh ? (o as THREE.InstancedMesh).count : 1;
    const groups = Array.isArray(m.material) ? geo.groups.length || 1 : 1;
    if (!(o as THREE.Points).isPoints) stats.triangles += tri * n;
    stats.drawCalls += groups;
  });
  group.userData.stats = stats;
  const buildMs = performance.now() - t0;
  group.userData.buildMs = buildMs;
  if (import.meta.env?.DEV) {
    console.info(
      `[forest] ${trees.length} árboles, ${stats.drawCalls} draw calls, ${Math.round(stats.triangles)} tris, ${buildMs.toFixed(0)} ms`,
    );
  }

  // ---- bucle: determinista respecto a p
  const cam = ctx.camera;
  sky.position.copy(cam.position);
  return {
    group,
    update(p: number) {
      sky.position.copy(cam.position);
      // La bruma baja se desplaza levemente con el avance (sin vaivén temporal).
      fogMesh.position.set(Math.sin(p * 5.5) * 0.6, 0, p * 2.5);
    },
    dispose() {
      for (const m of instMeshes) m.dispose();
      for (const d of toDispose) d.dispose();
      for (const g of treeGeos) g.geo.dispose();
    },
  };
}
