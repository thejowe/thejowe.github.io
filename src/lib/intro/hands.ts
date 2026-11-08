import * as THREE from 'three';
import { stepPhase, walkEnvelope } from './gait';
import { ps2Basic, ps2Tex, rng } from './ps2';
import { HANDS_TOUCH, T, type IntroModule, type ModuleCtx } from './types';

/**
 * Manos en primera persona estilo PS2.
 *
 * - Una malla con esqueleto (SkinnedMesh) por mano: 2 draw calls, ~1,5k triángulos en total.
 * - Geometría facetada generada por código (tubos de pocos lados), sombreado horneado por cara
 *   en color de vértice y un atlas procedural de 64x64 con muestreo nearest.
 * - Todo es función determinista del progreso `p` (nada depende del tiempo).
 * - Se renderizan sin test de profundidad y al final (como el arma de un FPS de PS2), así no
 *   atraviesan el bosque. El orden de los triángulos dentro de cada malla resuelve el solapado.
 */

// ───────────────────────── utilidades ─────────────────────────

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// ───────────────────────── atlas de textura (64x64) ─────────────────────────

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** Dedo/pulgar: 16 px alrededor (dorso en x=4, palma en x=12) x 32 px de base a punta. */
const R_FINGER: Rect = { x: 0, y: 0, w: 16, h: 32 };
/** Palma, dorso de la mano y antebrazo: 32 px alrededor (dorso en x=8, palma en x=24) x 32 de muñeca a nudillos. */
const R_PALM: Rect = { x: 16, y: 0, w: 32, h: 32 };
/** Manga de la chaqueta: 32 px alrededor x 32 px del puño al codo. */
const R_SLEEVE: Rect = { x: 0, y: 32, w: 32, h: 32 };
const ATLAS = 64;

/** UV de un punto (a alrededor del tubo 0..1, b a lo largo 0..1) dentro de un rectángulo del atlas. */
function uvOf(r: Rect, a: number, b: number): [number, number] {
  const e = 0.012; // margen para que nearest no se salga del rectángulo
  const x = r.x + e + a * (r.w - 2 * e);
  const y = r.y + e + b * (r.h - 2 * e);
  return [x / ATLAS, 1 - y / ATLAS];
}

function drawAtlas(c: CanvasRenderingContext2D) {
  const rnd = rng(1337);
  const px = (x: number, y: number, r: number, g: number, b: number) => {
    c.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    c.fillRect(x, y, 1, 1);
  };
  const noisy = (x: number, y: number, r: number, g: number, b: number, amp: number) => {
    const n = (rnd() - 0.5) * amp;
    px(x, y, r + n, g + n * 0.8, b + n * 0.7);
  };
  const SKIN: [number, number, number] = [208, 154, 122];
  c.fillStyle = '#000';
  c.fillRect(0, 0, ATLAS, ATLAS);

  // ── Dedos (0..15, 0..31) ──
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 16; x++) {
      const dors = Math.abs(x - 4) <= 3; // cara del dorso
      const k = dors ? 1 : 1.04;
      noisy(x, y, SKIN[0] * k, SKIN[1] * k, SKIN[2] * k, 10);
    }
  }
  // Pliegues de las articulaciones (dorso: arrugas; palma: líneas más marcadas).
  for (const jy of [13, 22]) {
    for (let x = 1; x <= 7; x++) if (x !== 4 || jy === 13) px(x, jy, 150, 100, 84);
    for (let x = 9; x <= 15; x++) {
      px(x, jy - 1, 160, 104, 88);
      px(x, jy, 176, 120, 100);
    }
    for (const x of [3, 5]) px(x, jy + 1, 182, 128, 106);
  }
  // Almohadilla de la yema (palma) y uña (dorso).
  for (let y = 24; y < 32; y++) for (let x = 9; x <= 15; x++) noisy(x, y, 228, 174, 144, 8);
  for (let y = 24; y <= 31; y++) for (let x = 1; x <= 7; x++) px(x, y, 168, 112, 94); // borde de la uña
  for (let y = 25; y <= 30; y++) for (let x = 2; x <= 6; x++) noisy(x, y, 236, 192, 176, 8);
  for (let x = 2; x <= 6; x++) px(x, 25, 244, 222, 214); // lúnula
  for (let x = 2; x <= 6; x++) px(x, 31, 214, 168, 150); // borde libre

  // ── Palma, dorso y antebrazo (16..47, 0..31) ──
  for (let y = 0; y < 32; y++) {
    for (let lx = 0; lx < 32; lx++) {
      const dors = lx >= 2 && lx <= 14;
      const flush = dors ? 0.97 : 1.06;
      noisy(16 + lx, y, SKIN[0] * flush, SKIN[1] * flush * 0.98, SKIN[2] * flush, 12);
    }
  }
  // Tendones (líneas más claras) y venas (azuladas) en el dorso.
  for (const lx of [5, 7, 9, 11]) for (let y = 8; y < 30; y++) px(16 + lx, y, 224, 170, 138);
  const vein = (pts: Array<[number, number]>) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i]!;
      const [x1, y1] = pts[i + 1]!;
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= n; s++) {
        px(16 + Math.round(lerp(x0, x1, s / n)), Math.round(lerp(y0, y1, s / n)), 126, 112, 138);
      }
    }
  };
  vein([
    [6, 1],
    [7, 7],
    [6, 13],
    [5, 19],
    [4, 25],
  ]);
  vein([
    [7, 7],
    [9, 11],
    [10, 17],
    [11, 22],
  ]);
  vein([
    [6, 13],
    [4, 15],
    [3, 19],
  ]);
  // Nudillos.
  for (const lx of [4, 6, 9, 11]) {
    px(16 + lx, 29, 176, 118, 96);
    px(16 + lx, 30, 164, 108, 90);
    px(16 + lx + 1, 29, 232, 176, 146);
  }
  // Palma: almohadilla y líneas de la mano.
  for (let y = 4; y < 30; y++)
    for (let lx = 18; lx <= 30; lx++) noisy(16 + lx, y, 226, 170, 140, 8);
  const crease = (pts: Array<[number, number]>) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i]!;
      const [x1, y1] = pts[i + 1]!;
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= n; s++) {
        px(16 + Math.round(lerp(x0, x1, s / n)), Math.round(lerp(y0, y1, s / n)), 150, 96, 80);
      }
    }
  };
  crease([
    [19, 22],
    [23, 21],
    [28, 22],
  ]); // línea del corazón
  crease([
    [19, 15],
    [24, 15],
    [29, 17],
  ]); // línea de la cabeza
  crease([
    [21, 7],
    [20, 12],
    [22, 18],
    [25, 24],
  ]); // línea de la vida

  // ── Manga (0..31, 32..63): chaqueta oscura gastada con puño de canalé ──
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) noisy(x, 32 + y, 70, 78, 90, 14);
  }
  // Parches gastados más claros.
  for (let i = 0; i < 9; i++) {
    const bx = Math.floor(rnd() * 28);
    const by = 8 + Math.floor(rnd() * 20);
    for (let y = 0; y < 2 + (i % 2); y++)
      for (let x = 0; x < 3 + (i % 3); x++) noisy((bx + x) % 32, 32 + by + y, 100, 106, 110, 8);
  }
  // Arrugas horizontales (par oscuro/claro) interrumpidas.
  for (let y = 9; y < 32; y += 5 + (y % 3)) {
    const off = Math.floor(rnd() * 8);
    for (let x = 0; x < 24; x++) {
      px((x + off) % 32, 32 + y, 46, 52, 62);
      if ((x & 7) !== 7) px((x + off) % 32, 32 + y + 1, 96, 104, 116);
    }
  }
  // Costuras laterales (dos, en la mitad y en el borde del rectángulo).
  for (let y = 5; y < 32; y++) {
    px(0, 32 + y, 26, 28, 34);
    px(16, 32 + y, 26, 28, 34);
  }
  // Puño de canalé: franjas verticales y borde deshilachado.
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 32; x++) {
      const stripe = (x & 1) === 0;
      noisy(x, 32 + y, stripe ? 52 : 86, stripe ? 58 : 94, stripe ? 68 : 106, 6);
    }
  }
  for (let x = 0; x < 32; x++) {
    px(x, 32 + 5, 24, 26, 32);
    if (rnd() > 0.35) px(x, 32, 84, 86, 84);
  }
}

// ───────────────────────── geometría ─────────────────────────

interface Ring {
  c: THREE.Vector3;
  rx: number;
  ry: number;
  /** Hueso A con peso `w`; el resto del peso al hueso B. */
  a: number;
  b: number;
  w: number;
  /** Posición a lo largo del tubo (0..1) para la UV. */
  bn: number;
  /** Oclusión horneada (1 = sin sombra). */
  ao: number;
}
interface Limb {
  rings: Ring[];
  sides: number;
  rect: Rect;
  apex?: { p: THREE.Vector3; bone: number };
}
interface Vtx {
  p: THREE.Vector3;
  u: number;
  v: number;
  a: number;
  b: number;
  w: number;
  ao: number;
}

const SHADE_DARK = new THREE.Color(0.5, 0.52, 0.66);
const SHADE_LIGHT = new THREE.Color(0.96, 1.0, 1.0);

class MeshBuilder {
  readonly pos: number[] = [];
  readonly uv: number[] = [];
  readonly col: number[] = [];
  readonly skinIdx: number[] = [];
  readonly skinW: number[] = [];
  /** +1 mano derecha, -1 izquierda (espejo en X con el devanado invertido). */
  constructor(private readonly m: 1 | -1) {}

  private tri(v0: Vtx, v1: Vtx, v2: Vtx) {
    const m = this.m;
    const vs = m > 0 ? [v0, v1, v2] : [v0, v2, v1];
    const P = vs.map((v) => new THREE.Vector3(v.p.x * m, v.p.y, v.p.z));
    const n = new THREE.Vector3()
      .subVectors(P[1]!, P[0]!)
      .cross(new THREE.Vector3().subVectors(P[2]!, P[0]!))
      .normalize();
    // Sombreado horneado por cara: arriba más claro y azulado (luna), abajo oscuro.
    const t = smooth(0, 1, clamp01(0.5 + 0.5 * n.y + 0.12 * n.z));
    const ao = (v0.ao + v1.ao + v2.ao) / 3;
    const r = lerp(SHADE_DARK.r, SHADE_LIGHT.r, t) * ao;
    const g = lerp(SHADE_DARK.g, SHADE_LIGHT.g, t) * ao;
    const b = lerp(SHADE_DARK.b, SHADE_LIGHT.b, t) * ao;
    for (let i = 0; i < 3; i++) {
      const v = vs[i]!;
      this.pos.push(P[i]!.x, P[i]!.y, P[i]!.z);
      this.uv.push(v.u, v.v);
      this.col.push(r, g, b);
      this.skinIdx.push(v.a, v.b, 0, 0);
      this.skinW.push(v.w, 1 - v.w, 0, 0);
    }
  }

  addLimb(l: Limb) {
    const N = l.sides;
    const rs = l.rings;
    const up = new THREE.Vector3(0, 1, 0);
    const pts = rs.map((r, i) => {
      const prev = rs[Math.max(0, i - 1)]!.c;
      const next = rs[Math.min(rs.length - 1, i + 1)]!.c;
      const t = new THREE.Vector3().subVectors(next, prev).normalize();
      const ref = Math.abs(t.y) > 0.95 ? new THREE.Vector3(0, 0, -1) : up;
      const side = new THREE.Vector3().crossVectors(t, ref).normalize();
      const upv = new THREE.Vector3().crossVectors(side, t).normalize();
      return Array.from({ length: N }, (_, k) => {
        const th = (Math.PI * 2 * k) / N;
        return r.c
          .clone()
          .addScaledVector(side, r.rx * Math.cos(th))
          .addScaledVector(upv, r.ry * Math.sin(th));
      });
    });
    const vtx = (i: number, k: number, a: number): Vtx => {
      const r = rs[i]!;
      const [u, v] = uvOf(l.rect, a, r.bn);
      return { p: pts[i]![k % N]!, u, v, a: r.a, b: r.b, w: r.w, ao: r.ao };
    };
    for (let i = 0; i < rs.length - 1; i++) {
      for (let k = 0; k < N; k++) {
        const a0 = k / N;
        const a1 = (k + 1) / N;
        const A0 = vtx(i, k, a0);
        const A1 = vtx(i, k + 1, a1);
        const B0 = vtx(i + 1, k, a0);
        const B1 = vtx(i + 1, k + 1, a1);
        this.tri(A0, B0, A1);
        this.tri(A1, B0, B1);
      }
    }
    if (l.apex) {
      const last = rs.length - 1;
      for (let k = 0; k < N; k++) {
        const [u, v] = uvOf(l.rect, (k + 0.5) / N, 1);
        const apex: Vtx = { p: l.apex.p, u, v, a: l.apex.bone, b: l.apex.bone, w: 1, ao: 1 };
        this.tri(vtx(last, k, k / N), apex, vtx(last, k + 1, (k + 1) / N));
      }
    }
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.skinIdx, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.skinW, 4));
    return g;
  }
}

// ───────────────────────── esqueleto y malla de una mano ─────────────────────────

/** Mano en reposo: dedos hacia -Z, palma hacia -Y, pulgar hacia -X (mano derecha). Metros. */
const KZ = -0.092; // z de los nudillos
const FY = -0.002;
const FINGERS = [
  { x: -0.031, len: [0.04, 0.025, 0.022], r: [0.0098, 0.0092, 0.0084, 0.0072] }, // índice
  { x: -0.0105, len: [0.044, 0.027, 0.023], r: [0.0098, 0.0092, 0.0084, 0.0072] }, // corazón
  { x: 0.0105, len: [0.04, 0.025, 0.022], r: [0.0094, 0.0088, 0.008, 0.0068] }, // anular
  { x: 0.0305, len: [0.031, 0.019, 0.018], r: [0.0088, 0.0082, 0.0074, 0.0064] }, // meñique
] as const;
const BASE_K = [1.25, 1.35, 1.4, 1.45];
const SPREAD_K = [1, 0.3, -0.4, -1];

interface Rig {
  mesh: THREE.SkinnedMesh;
  root: THREE.Bone;
  fingers: THREE.Bone[][];
  thumb: THREE.Bone[];
  /** Yema del índice (punto que toca la luz). */
  tip: THREE.Object3D;
  m: 1 | -1;
  skeleton: THREE.Skeleton;
}

function buildRig(m: 1 | -1, mat: THREE.Material): Rig {
  const bones: THREE.Bone[] = [];
  const mk = (parent: THREE.Object3D, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.position.set(x * m, y, z);
    parent.add(b);
    bones.push(b);
    return b;
  };
  const root = mk(new THREE.Object3D(), 0, 0, 0);
  root.position.set(0, 0, 0);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const B = new MeshBuilder(m);
  const ring = (
    c: THREE.Vector3,
    rx: number,
    ry: number,
    a: number,
    b: number,
    w: number,
    bn: number,
    ao = 1,
  ): Ring => ({
    c,
    rx,
    ry,
    a,
    b,
    w,
    bn,
    ao,
  });

  // Antebrazo de piel (asoma por el puño y rellena huecos) → manga → palma → pulgar → dedos.
  B.addLimb({
    sides: 8,
    rect: R_PALM,
    rings: [
      ring(V(0, 0, 0.0), 0.03, 0.021, 0, 0, 1, 0, 0.9),
      ring(V(0, 0, 0.2), 0.036, 0.03, 0, 0, 1, 0.05, 0.7),
      ring(V(0, 0, 0.7), 0.05, 0.045, 0, 0, 1, 0.1, 0.5),
    ],
  });
  B.addLimb({
    sides: 8,
    rect: R_SLEEVE,
    rings: [
      ring(V(0, 0, 0.03), 0.046, 0.039, 0, 0, 1, 0, 0.85),
      ring(V(0, 0, 0.078), 0.047, 0.04, 0, 0, 1, 0.1, 0.85),
      ring(V(0, 0, 0.088), 0.056, 0.049, 0, 0, 1, 0.14, 0.9),
      ring(V(0, 0, 0.3), 0.062, 0.055, 0, 0, 1, 0.4, 0.75),
      ring(V(0, 0, 0.98), 0.07, 0.062, 0, 0, 1, 1, 0.45),
    ],
  });
  B.addLimb({
    sides: 8,
    rect: R_PALM,
    rings: [
      ring(V(0.002, 0, 0.0), 0.029, 0.017, 0, 0, 1, 0, 0.8),
      ring(V(0, 0, -0.045), 0.039, 0.019, 0, 0, 1, 0.5, 0.92),
      ring(V(0, 0, KZ), 0.043, 0.0145, 0, 0, 1, 1, 0.95),
    ],
  });

  // Pulgar: base en el borde de la palma, dos falanges.
  const d = V(-0.5, -0.2, -0.85).normalize();
  const tA = V(-0.03, -0.003, -0.022);
  const tB = tA.clone().addScaledVector(d, 0.032);
  const tC = tB.clone().addScaledVector(d, 0.03);
  const tD = tC.clone().addScaledVector(d, 0.026);
  const t0 = mk(root, tB.x, tB.y, tB.z);
  const t1 = mk(t0, tC.x - tB.x, tC.y - tB.y, tC.z - tB.z);
  const ti0 = bones.indexOf(t0);
  const ti1 = bones.indexOf(t1);
  B.addLimb({
    sides: 6,
    rect: R_FINGER,
    rings: [
      ring(tA, 0.0155, 0.0135, 0, 0, 1, 0, 0.85),
      ring(tB, 0.0128, 0.012, 0, ti0, 0.5, 0.3, 0.92),
      ring(tC, 0.0112, 0.0105, ti0, ti1, 0.5, 0.62, 0.97),
      ring(tD, 0.0094, 0.0088, ti1, ti1, 1, 0.97, 1),
    ],
    apex: { p: tD.clone().addScaledVector(d, 0.008), bone: ti1 },
  });

  const fingerBones: THREE.Bone[][] = [];
  let tip: THREE.Object3D = new THREE.Object3D();
  FINGERS.forEach((f, fi) => {
    const f0 = mk(root, f.x, FY, KZ);
    const f1 = mk(f0, 0, 0, -f.len[0]);
    const f2 = mk(f1, 0, 0, -f.len[1]);
    fingerBones.push([f0, f1, f2]);
    const i0 = bones.indexOf(f0);
    const z1 = KZ - f.len[0];
    const z2 = z1 - f.len[1];
    const z3 = z2 - f.len[2];
    const tot = KZ - z3;
    B.addLimb({
      sides: 6,
      rect: R_FINGER,
      rings: [
        ring(V(f.x, FY, KZ + 0.004), f.r[0], f.r[0] * 0.92, i0, i0, 1, 0, 0.85),
        ring(V(f.x, FY, z1), f.r[1], f.r[1] * 0.92, i0, i0 + 1, 0.5, (KZ - z1) / tot, 0.93),
        ring(V(f.x, FY, z2), f.r[2], f.r[2] * 0.92, i0 + 1, i0 + 2, 0.5, (KZ - z2) / tot, 0.97),
        ring(V(f.x, FY, z3), f.r[3], f.r[3] * 0.92, i0 + 2, i0 + 2, 1, 0.97, 1),
      ],
      apex: { p: V(f.x, FY - 0.001, z3 - 0.007), bone: i0 + 2 },
    });
    if (fi === 0) {
      tip = new THREE.Object3D();
      tip.position.set(0, -0.003, -f.len[2] - 0.006);
      f2.add(tip);
    }
  });

  const geo = B.build();
  const mesh = new THREE.SkinnedMesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.add(root);
  mesh.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  mesh.bind(skeleton);
  return { mesh, root, fingers: fingerBones, thumb: [t0, t1], tip, m, skeleton };
}

// ───────────────────────── poses ─────────────────────────

interface Pose {
  /** Posición de la muñeca como fracción del encuadre a profundidad d (metros). */
  fx: number;
  fy: number;
  d: number;
  pitch: number;
  yaw: number;
  roll: number;
  /** Curvatura de cada dedo (0 abierto, ~1 puño; negativo = hiperextensión). */
  c0: number;
  c1: number;
  c2: number;
  c3: number;
  spread: number;
  tAbd: number;
  tCurl: number;
  /** Desplazamiento en metros (balanceo del paso). */
  dx: number;
  dy: number;
  dz: number;
}
const KEYS: Array<keyof Pose> = [
  'fx',
  'fy',
  'd',
  'pitch',
  'yaw',
  'roll',
  'c0',
  'c1',
  'c2',
  'c3',
  'spread',
  'tAbd',
  'tCurl',
  'dx',
  'dy',
  'dz',
];
function mixPose(a: Pose, b: Pose, t: number): Pose {
  const o = { ...a };
  for (const k of KEYS) o[k] = lerp(a[k], b[k], t);
  return o;
}
const pose = (o: Partial<Pose>): Pose => ({
  fx: 0,
  fy: 0,
  d: 0.5,
  pitch: 0,
  yaw: 0,
  roll: 0,
  c0: 0,
  c1: 0,
  c2: 0,
  c3: 0,
  spread: 0,
  tAbd: 0,
  tCurl: 0,
  dx: 0,
  dy: 0,
  dz: 0,
  ...o,
});

// Derecha
const REST_R = pose({
  fx: 0.46,
  fy: -0.42,
  d: 0.4,
  pitch: 0.8,
  yaw: 0.2,
  roll: -0.35,
  c0: 0.3,
  c1: 0.4,
  c2: 0.5,
  c3: 0.58,
  spread: 0.1,
  tAbd: 0.2,
  tCurl: 0.35,
});
const CONTACT_R = pose({
  fx: 0.08,
  fy: -0.2,
  d: 1.02,
  pitch: 0.7,
  yaw: 0.4,
  roll: -0.55,
  c0: 0.04,
  c1: 0.08,
  c2: 0.17,
  c3: 0.28,
  spread: 0.2,
  tAbd: 0.6,
  tCurl: 0.1,
});
const FLINCH_R = pose({
  fx: 0.2,
  fy: -0.12,
  d: 0.85,
  pitch: 1.0,
  yaw: 0.25,
  roll: -0.8,
  c0: -0.6,
  c1: -0.6,
  c2: -0.6,
  c3: -0.6,
  spread: 0.55,
  tAbd: 0.95,
  tCurl: -0.5,
});
const FLINCH2_R = pose({
  fx: 0.26,
  fy: 0.0,
  d: 0.78,
  pitch: 1.2,
  yaw: 0.2,
  roll: -0.9,
  c0: -0.6,
  c1: -0.6,
  c2: -0.6,
  c3: -0.6,
  spread: 0.55,
  tAbd: 0.95,
  tCurl: -0.5,
});
// Izquierda
const REST_L = pose({
  fx: -0.46,
  fy: -0.42,
  d: 0.4,
  pitch: 0.8,
  yaw: -0.2,
  roll: 0.35,
  c0: 0.34,
  c1: 0.44,
  c2: 0.54,
  c3: 0.62,
  spread: 0.1,
  tAbd: 0.2,
  tCurl: 0.4,
});
const GUARD_L = pose({
  fx: -0.46,
  fy: -0.3,
  d: 0.5,
  pitch: 0.7,
  yaw: -0.3,
  roll: 0.55,
  c0: 0.08,
  c1: 0.1,
  c2: 0.14,
  c3: 0.2,
  spread: 0.25,
  tAbd: 0.5,
  tCurl: 0.1,
});
const COVER_L = pose({
  fx: -0.14,
  fy: 0.12,
  d: 0.36,
  pitch: 1.3,
  yaw: -0.15,
  roll: 0.3,
  c0: -0.1,
  c1: -0.1,
  c2: -0.1,
  c3: -0.1,
  spread: 0.4,
  tAbd: 0.7,
  tCurl: 0,
});

/** Balanceo del paso: brazos alternos, adelante/atrás y arriba/abajo, con micro-flexión de dedos. */
function walkSway(base: Pose, s: 1 | -1, phase: number, env: number): Pose {
  const o = { ...base };
  const sw = Math.sin(phase);
  o.dz += s * 0.055 * sw * env;
  o.dy += (-0.014 * Math.cos(phase * 2) - 0.01 * Math.abs(sw)) * env;
  o.dx += -s * 0.01 * Math.cos(phase) * env;
  o.pitch += s * 0.06 * sw * env;
  o.roll += s * 0.07 * Math.sin(phase + 0.6) * env;
  o.c0 += 0.06 * Math.sin(phase + 0.0) * env;
  o.c1 += 0.06 * Math.sin(phase + 0.4) * env;
  o.c2 += 0.06 * Math.sin(phase + 0.8) * env;
  o.c3 += 0.06 * Math.sin(phase + 1.2) * env;
  return o;
}

function rightPose(p: number, phase: number, env: number): Pose {
  const u = clamp01((p - T.reachStart) / (T.reachEnd - T.reachStart));
  const e = easeInOut(u);
  const rest = walkSway(REST_R, 1, phase, env);
  const reach = mixPose(rest, CONTACT_R, e);
  // Índice y corazón lideran la apertura; el pulgar se separa; anular y meñique les siguen.
  reach.c0 = lerp(rest.c0, CONTACT_R.c0, smooth(0.0, 0.5, u));
  reach.c1 = lerp(rest.c1, CONTACT_R.c1, smooth(0.05, 0.58, u));
  reach.c2 = lerp(rest.c2, CONTACT_R.c2, smooth(0.2, 0.85, u));
  reach.c3 = lerp(rest.c3, CONTACT_R.c3, smooth(0.28, 1.0, u));
  reach.tAbd = lerp(rest.tAbd, CONTACT_R.tAbd, smooth(0.1, 0.7, u));
  // Tras el toque: sobresalto (rápido) y alzado lento como cegada.
  const f = easeOutCubic(clamp01((p - T.touch) / 0.012));
  const g = smooth(T.touch + 0.01, T.fadeStart, p);
  return mixPose(mixPose(reach, FLINCH_R, f), FLINCH2_R, g);
}

function leftPose(p: number, phase: number, env: number): Pose {
  const u = clamp01((p - T.reachStart) / (T.reachEnd - T.reachStart));
  const rest = walkSway(REST_L, -1, phase, env);
  const guard = mixPose(rest, GUARD_L, easeInOut(smooth(0.1, 1, u)));
  const cover = easeOutCubic(clamp01((p - T.touch) / 0.035));
  return mixPose(guard, COVER_L, cover);
}

// ───────────────────────── módulo ─────────────────────────

const WARM_TINT = new THREE.Color(1.0, 0.84, 0.7);
const COOL_TINT = new THREE.Color(0.92, 0.95, 1.0);

export function createHands(ctx: ModuleCtx): IntroModule {
  const group = new THREE.Group();
  group.name = 'hands';

  const map = ps2Tex(ATLAS, (c) => drawAtlas(c));
  const mat = ps2Basic({
    map,
    vertexColors: true,
    fog: false,
    depthTest: false,
    depthWrite: false,
  });

  const right = buildRig(1, mat);
  const left = buildRig(-1, mat);
  right.mesh.renderOrder = 1001;
  left.mesh.renderOrder = 1000;
  right.mesh.name = 'hand-right';
  left.mesh.name = 'hand-left';
  group.add(left.mesh, right.mesh);

  const tmp = new THREE.Vector3();
  const tipCamera = (): THREE.Vector3 => {
    group.updateMatrixWorld(true);
    right.tip.getWorldPosition(tmp);
    return group.worldToLocal(tmp);
  };

  const place = (rig: Rig, P: Pose, tanH: number, tanV: number, aspect: number, hs: number) => {
    const dEff = P.d * (aspect < 1 ? 1.12 : 1);
    const fx = aspect < 1 ? P.fx * 1.55 : P.fx; // en vertical se separan para no cruzarse
    rig.root.position.set(fx * dEff * tanH + P.dx, P.fy * dEff * tanV + P.dy, -dEff + P.dz);
    rig.root.rotation.set(P.pitch, P.yaw, P.roll, 'YXZ');
    rig.root.scale.setScalar(hs);
    const cs = [P.c0, P.c1, P.c2, P.c3];
    rig.fingers.forEach((bs, i) => {
      const c = cs[i]!;
      const k = c >= 0 ? 1 : 0.3;
      bs[0]!.rotation.set(-c * BASE_K[i]! * k, rig.m * P.spread * SPREAD_K[i]!, 0);
      bs[1]!.rotation.set(-c * 1.5 * k, 0, 0);
      bs[2]!.rotation.set(-c * 0.9 * k, 0, 0);
    });
    rig.thumb[0]!.rotation.set(-P.tCurl * 0.5, rig.m * P.tAbd, 0);
    rig.thumb[1]!.rotation.set(-P.tCurl * 0.8, 0, 0);
  };

  const update = (p: number) => {
    const cam = ctx.camera;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const tanH = tanV * cam.aspect;
    const hs = cam.aspect < 1 ? 1.0 : 1.3;
    const phase = stepPhase(p, ctx.path.length);
    const env = walkEnvelope(p);

    place(left, leftPose(p, phase, env), tanH, tanV, cam.aspect, hs);
    const R = rightPose(p, phase, env);
    place(right, R, tanH, tanV, cam.aspect, hs);

    // La yema del índice debe coincidir exactamente con HANDS_TOUCH al llegar (y mientras dura) el
    // contacto: se corrige la posición de la muñeca con la cinemática real del esqueleto.
    const u = clamp01((p - T.reachStart) / (T.reachEnd - T.reachStart));
    const f = easeOutCubic(clamp01((p - T.touch) / 0.012));
    const cw = smooth(0.2, 1, u) * (1 - f);
    if (cw > 0) {
      const t = tipCamera();
      right.root.position.x += (HANDS_TOUCH.x - t.x) * cw;
      right.root.position.y += (HANDS_TOUCH.y - t.y) * cw;
      right.root.position.z += (HANDS_TOUCH.z - t.z) * cw;
    }

    // Tinte: azulado lunar en el bosque, cálido al acercarse a la luz.
    mat.color.copy(COOL_TINT).lerp(WARM_TINT, smooth(0.55, 0.88, p));
    left.mesh.updateMatrixWorld(true);
    right.mesh.updateMatrixWorld(true);
  };

  if (import.meta.env?.DEV) {
    // Solo en desarrollo: permite medir la yema del índice en espacio de cámara desde el laboratorio.
    (globalThis as unknown as { __handsDebug: unknown }).__handsDebug = {
      tip: () => {
        const t = tipCamera();
        return [t.x, t.y, t.z];
      },
    };
  }

  return {
    group,
    update,
    dispose() {
      for (const r of [left, right]) {
        r.mesh.geometry.dispose();
        r.skeleton.dispose();
      }
      mat.dispose();
      map.dispose();
      group.clear();
    },
  };
}
