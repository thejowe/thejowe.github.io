import * as THREE from 'three';

/**
 * Pipeline "PlayStation 2": render a baja resolución con muestreo nearest, vértices cuantizados a la
 * rejilla de píxeles (el temblor típico), iluminación por vértice, niebla corta, texturas sin mipmaps
 * y una pasada final con dither Bayer y color de 5 bits por canal.
 */

/** Uniforms compartidos por todos los materiales PS2 (misma referencia en todos). */
export const ps2Uniforms = {
  uRes: { value: new THREE.Vector2(320, 240) },
  uWisp: { value: new THREE.Vector3(0, 1.5, -72) },
  /** Intensidad de la luz de la luciérnaga sobre la geometría cercana (iluminación por vértice). */
  uWispPower: { value: 0.0 },
  uWispColor: { value: new THREE.Color(1.0, 0.78, 0.42) },
};

/**
 * Parchea un material de three (MeshBasic / PointsMaterial / LineBasic) para el look PS2:
 * snapping de vértices + luz cálida de la luz por vértice. No reemplaza `fog`/`vertexColors`/`map`.
 */
export function patchPS2<T extends THREE.Material>(mat: T): T {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, ps2Uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec2 uRes; uniform vec3 uWisp; uniform float uWispPower; uniform vec3 uWispColor;
        varying vec3 vWisp;`,
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        {
          vec4 wp = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
          #endif
          wp = modelMatrix * wp;
          vec3 dv = wp.xyz - uWisp;
          vWisp = uWispColor * uWispPower / (1.0 + dot(dv, dv) * 0.35);
        }
        {
          vec2 g = uRes * 0.5;
          gl_Position.xy = floor(gl_Position.xy / gl_Position.w * g + 0.5) / g * gl_Position.w;
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n varying vec3 vWisp;`)
      .replace(
        '#include <opaque_fragment>',
        `outgoingLight += diffuseColor.rgb * vWisp;\n#include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => 'ps2';
  return mat;
}

/** Material base PS2: sin luces de three (todo es color de vértice + textura + niebla). */
export function ps2Basic(params: THREE.MeshBasicMaterialParameters = {}): THREE.MeshBasicMaterial {
  return patchPS2(new THREE.MeshBasicMaterial({ fog: true, ...params }));
}

/** Textura procedural pequeña, nearest, sin mipmaps (centelleo propio de PS2). */
export function ps2Tex(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  repeat: [number, number] = [1, 1],
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** PRNG determinista (mulberry32) para que cada carga sea igual. */
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ruido de valor 2D suave, determinista, en [0,1]. */
export function vnoise(x: number, y: number, seed = 1): number {
  const h = (ix: number, iy: number) => {
    let n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = h(x0, y0);
  const b = h(x0 + 1, y0);
  const c = h(x0, y0 + 1);
  const d = h(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export const FOG_COLOR = 0x0a1620;

export interface PS2Renderer {
  render(scene: THREE.Scene, camera: THREE.Camera, flash: number): void;
  resize(cssW: number, cssH: number): void;
  dispose(): void;
}

const POST_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const POST_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uFlash;
varying vec2 vUv;
const float B[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
float bayer(vec2 p) { vec2 q = mod(floor(p), 4.0); return (B[int(q.y) * 4 + int(q.x)] + 0.5) / 16.0; }
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  c += (bayer(vUv * uRes) - 0.5) * (1.0 / 20.0);
  c = floor(c * 31.0 + 0.5) / 31.0;
  vec2 q = vUv - 0.5;
  c *= 1.0 - dot(q, q) * 0.85;
  c = pow(c, vec3(0.96)) * vec3(1.02, 1.0, 1.04);
  c = mix(c, vec3(1.0, 0.94, 0.8), uFlash);
  gl_FragColor = vec4(c, 1.0);
}`;

export function createPS2Renderer(canvas: HTMLCanvasElement): PS2Renderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const target = new THREE.WebGLRenderTarget(320, 240, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    generateMipmaps: false,
  });
  target.texture.colorSpace = THREE.SRGBColorSpace;

  const postMat = new THREE.ShaderMaterial({
    vertexShader: POST_VERT,
    fragmentShader: POST_FRAG,
    uniforms: {
      tDiffuse: { value: target.texture },
      uRes: ps2Uniforms.uRes,
      uFlash: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
  quad.frustumCulled = false;
  const postScene = new THREE.Scene();
  postScene.add(quad);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    resize(cssW, cssH) {
      const aspect = cssW / cssH;
      const base = 240;
      const w = aspect >= 1 ? Math.round(base * aspect) : base;
      const h = aspect >= 1 ? base : Math.round(base / aspect);
      target.setSize(w, h);
      ps2Uniforms.uRes.value.set(w, h);
      renderer.setSize(cssW, cssH, false);
    },
    render(scene, camera, flash) {
      postMat.uniforms.uFlash!.value = flash;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
    },
    dispose() {
      target.dispose();
      postMat.dispose();
      quad.geometry.dispose();
      renderer.dispose();
    },
  };
}
