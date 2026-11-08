import * as THREE from 'three';
import { patchPS2, ps2Tex, ps2Uniforms, rng } from './ps2';
import { T } from './types';
import type { IntroModule, ModuleCtx } from './types';

/**
 * La luz (wisp), sus motas y la explosión del contacto.
 * Todo es función pura del progreso `p` (reversible, sin acumular estado ni usar el reloj).
 * Draw calls: 3 sprites (halo grande, halo medio, núcleo) + 2 anillos + 3 Points = 8.
 */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

/** Textura radial con bandas escalonadas (look PS2: anillos de brillo, no degradado liso). */
function bandedRadial(size: number, stops: Array<[number, number]>) {
  return ps2Tex(size, (g, s) => {
    const img = g.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = Math.hypot(x + 0.5 - s / 2, y + 0.5 - s / 2) / (s / 2);
        let v = 0;
        for (const [rad, val] of stops) {
          if (r <= rad) {
            v = val;
            break;
          }
        }
        const i = (y * s + x) * 4;
        const c = Math.round(v * 255);
        img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
}

/** Anillo de onda: tres bandas de grosor. */
function ringTexture(size: number) {
  return ps2Tex(size, (g, s) => {
    const img = g.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = Math.hypot(x + 0.5 - s / 2, y + 0.5 - s / 2) / (s / 2);
        let v = 0;
        if (r > 0.72 && r <= 0.78) v = 0.3;
        else if (r > 0.78 && r <= 0.9) v = 1;
        else if (r > 0.9 && r <= 0.96) v = 0.35;
        const i = (y * s + x) * 4;
        const c = Math.round(v * 255);
        img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
}

function additiveSprite(map: THREE.Texture, color: number) {
  return new THREE.SpriteMaterial({
    map,
    color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    fog: false,
  });
}

function additivePoints(size: number, tint: THREE.ColorRepresentation) {
  return patchPS2(
    new THREE.PointsMaterial({
      size,
      sizeAttenuation: true,
      color: tint,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }),
  );
}

export function createWisp(ctx: ModuleCtx): IntroModule {
  const group = new THREE.Group();
  const origin = ctx.path.wisp.clone();
  const camera = ctx.camera;

  // ---- Texturas (pocos píxeles, nearest) ----
  const haloTex = bandedRadial(32, [
    [0.14, 1],
    [0.26, 0.55],
    [0.4, 0.28],
    [0.58, 0.12],
    [0.8, 0.045],
  ]);
  const midTex = bandedRadial(16, [
    [0.3, 1],
    [0.55, 0.45],
    [0.8, 0.14],
    [1, 0.04],
  ]);
  const coreTex = bandedRadial(16, [
    [0.35, 1],
    [0.62, 0.85],
    [0.9, 0.3],
  ]);
  const ring = ringTexture(48);

  // ---- La luz: halo grande, halo medio y núcleo (orden de render creciente) ----
  const haloMat = additiveSprite(haloTex, 0xff9c3c);
  const midMat = additiveSprite(midTex, 0xffc060);
  const coreMat = additiveSprite(coreTex, 0xfff3d0);
  const halo = new THREE.Sprite(haloMat);
  const mid = new THREE.Sprite(midMat);
  const core = new THREE.Sprite(coreMat);
  for (const [i, s] of [halo, mid, core].entries()) {
    s.position.copy(origin);
    s.renderOrder = 10 + i;
    group.add(s);
  }

  // ---- Anillos de onda ----
  const ringMats = [0, 1].map(() => additiveSprite(ring, 0xffd9a0));
  const rings = ringMats.map((m, i) => {
    const s = new THREE.Sprite(m);
    s.position.copy(origin);
    s.renderOrder = 14 + i;
    s.visible = false;
    group.add(s);
    return s;
  });

  // ---- Motas orbitales ----
  const MOTES = 12;
  const rm = rng(7);
  const moteBase = Array.from({ length: MOTES }, () => ({
    a: rm() * Math.PI * 2,
    speed: (rm() < 0.5 ? -1 : 1) * (2.2 + rm() * 2.2), // vueltas por recorrido completo
    tiltX: (rm() - 0.5) * 1.6,
    tiltZ: (rm() - 0.5) * 1.6,
    rad: 0.7 + rm() * 0.6,
    ph: rm(),
  }));
  const motePos = new Float32Array(MOTES * 3);
  const moteCol = new Float32Array(MOTES * 3);
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));
  const moteMat = additivePoints(1, 0xffe2a0);
  moteMat.fog = false;
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  motes.renderOrder = 12;
  group.add(motes);

  // ---- Chispas ----
  const SPARKS = 150;
  const rs = rng(99);
  const sparks = Array.from({ length: SPARKS }, () => {
    const th = rs() * Math.PI * 2;
    const cz = rs() * 2 - 1;
    const sr = Math.sqrt(1 - cz * cz);
    return {
      dx: sr * Math.cos(th),
      dy: cz,
      dz: sr * Math.sin(th),
      v: 0.7 + rs() * 3.6,
      g: (rs() - 0.35) * 5, // gravedad con signo
      life: 0.55 + rs() * 0.45,
      delay: rs() * 0.08,
    };
  });
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkCol = new Float32Array(SPARKS * 3);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
  const sparkMat = additivePoints(0.05, 0xffe9b0);
  sparkMat.fog = false;
  const sparkPts = new THREE.Points(sparkGeo, sparkMat);
  sparkPts.frustumCulled = false;
  sparkPts.renderOrder = 15;
  sparkPts.visible = false;
  group.add(sparkPts);

  const tmp = new THREE.Vector3();

  return {
    group,
    update(p) {
      const d = Math.max(0.5, camera.position.distanceTo(origin));
      const near = smooth(T.walkStart, T.walkEnd, p);
      const approach = smooth(T.walkStart, T.reachEnd, p);
      // Anticipación: justo antes del contacto la luz se concentra (más pequeña y más intensa).
      const antic = smooth(T.reachEnd, T.touch, p);
      // Explosión: u 0→1 desde el contacto hasta poco después del blanco total.
      const u = clamp01((p - T.touch) / (T.flashEnd - T.touch + 0.05));
      const eu = Math.pow(u, 1.3);

      // Latido escalonado, determinista en p (≈1 Hz a ritmo normal, amplitud pequeña).
      const beat = 1 + 0.06 * (Math.floor(Math.sin(p * 40) * 1.5) / 1.5) * (1 - antic);

      // Tamaño angular creciente ("hinchado"): minúsculo a lo lejos, grande de cerca.
      // Tamaño FÍSICO (metros) que crece con la cercanía, más la perspectiva natural (1/d): a lo lejos
      // es apenas un punto (mínimo ~1.5 px para que no desaparezca) y se hincha al acercarte.
      const body = (0.1 + 0.2 * Math.pow(approach, 1.4)) * (1 - 0.3 * antic) * beat;
      const baseOp = 0.4 + 0.6 * Math.pow(near, 0.8);
      const fadeOut = 1 - smooth(0.55, 1, u);

      // Iluminación del entorno (horneada por vértice en el parche PS2).
      const power = 0.15 + 1.35 * Math.pow(near, 1.2) + 0.25 * antic + 2.2 * smooth(0, 0.12, u);
      ps2Uniforms.uWispPower.value = power * beat;
      ps2Uniforms.uWisp.value.copy(origin);

      // Núcleo: crece hasta llenar la vista con el estallido.
      const coreSize = Math.max(body * 1.6, d * 0.009) + 6 * eu;
      core.scale.setScalar(coreSize);
      coreMat.opacity = Math.min(1, baseOp + 0.4 * antic) * (u > 0 ? 1 - smooth(0.7, 1, u) : 1);
      mid.scale.setScalar(Math.max(body * 4.2, d * 0.02) + 9 * eu);
      midMat.opacity = baseOp * 0.8 * fadeOut + 0.2 * antic;
      halo.scale.setScalar(Math.max(body * 8 * (1 - 0.35 * antic), d * 0.04) + 6 * eu);
      haloMat.opacity = baseOp * 0.7 * fadeOut + 0.15 * antic;
      const alive = u < 1;
      core.visible = mid.visible = halo.visible = alive;

      // Anillos de onda: nacen en el contacto y se expanden.
      for (let i = 0; i < 2; i++) {
        const ui = clamp01((u - i * 0.14) / (1 - i * 0.14));
        const r = rings[i]!;
        r.visible = ui > 0 && ui < 1;
        if (!r.visible) continue;
        r.scale.setScalar(0.25 + 8 * easeOut(ui));
        ringMats[i]!.opacity = (1 - ui) * (1 - ui) * 0.9;
      }

      // Motas orbitales: giran con p; radio y velocidad crecen al acercarse; se dispersan al estallar.
      const orbitR = Math.max(0.05 + 0.35 * Math.pow(approach, 1.3), d * 0.012) * (1 - 0.5 * antic);
      for (let i = 0; i < MOTES; i++) {
        const m = moteBase[i]!;
        const a = m.a + m.speed * p * Math.PI * 2 * (0.3 + approach);
        const r = orbitR * m.rad * (1 + 9 * eu);
        tmp.set(
          Math.cos(a) * r,
          Math.sin(a) * r * Math.cos(m.tiltX),
          Math.sin(a) * r * Math.sin(m.tiltZ),
        );
        motePos[i * 3] = origin.x + tmp.x;
        motePos[i * 3 + 1] = origin.y + tmp.y;
        motePos[i * 3 + 2] = origin.z + tmp.z;
        const b =
          (0.5 + 0.5 * approach) *
          (1 - u) *
          (0.7 + (0.3 * Math.floor(Math.sin(p * 55 + m.ph * 6.28) * 1.5 + 1.5)) / 2);
        moteCol[i * 3] = b;
        moteCol[i * 3 + 1] = b * 0.85;
        moteCol[i * 3 + 2] = b * 0.55;
      }
      moteMat.size = Math.max(d * 0.003, 0.01 + 0.018 * approach);
      moteGeo.attributes.position!.needsUpdate = true;
      moteGeo.attributes.color!.needsUpdate = true;
      motes.visible = alive && p > T.walkStart * 0.5;

      // Chispas: pos = origen + dir·v·e(u) + 0.5·g·u² (analítico, reversible).
      sparkPts.visible = u > 0 && u < 1;
      if (sparkPts.visible) {
        for (let i = 0; i < SPARKS; i++) {
          const s = sparks[i]!;
          const t = clamp01((u - s.delay) / s.life);
          const e = easeOut(t);
          sparkPos[i * 3] = origin.x + s.dx * s.v * e;
          sparkPos[i * 3 + 1] = origin.y + s.dy * s.v * e - 0.5 * s.g * t * t * 0.6;
          sparkPos[i * 3 + 2] = origin.z + s.dz * s.v * e;
          const b = t > 0 && t < 1 ? (1 - t) * (1 - t) : 0;
          sparkCol[i * 3] = b;
          sparkCol[i * 3 + 1] = b * 0.82;
          sparkCol[i * 3 + 2] = b * 0.5;
        }
        sparkMat.size = 0.06 * (1 - 0.6 * u);
        sparkGeo.attributes.position!.needsUpdate = true;
        sparkGeo.attributes.color!.needsUpdate = true;
      }
    },
    dispose() {
      for (const t of [haloTex, midTex, coreTex, ring]) t.dispose();
      for (const m of [haloMat, midMat, coreMat, ...ringMats, moteMat, sparkMat]) m.dispose();
      moteGeo.dispose();
      sparkGeo.dispose();
    },
  };
}
