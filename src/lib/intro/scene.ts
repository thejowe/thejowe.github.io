import * as THREE from 'three';
import { stepPhase, walkEnvelope, walkParam } from './gait';
import { createPath } from './path';
import { createPS2Renderer, FOG_COLOR, ps2Uniforms } from './ps2';
import { HANDS_TOUCH, T, type IntroModule } from './types';

export interface IntroScene {
  /** Progreso de scroll 0..1 (ya suavizado por el scrub). Renderiza solo si cambió. */
  setProgress(p: number): void;
  /** Re-mide el canvas (tras resize). */
  resize(): void;
  dispose(): void;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Cede el hilo principal (scheduler.yield cuando existe) para que el resto de la página respire. */
const yieldToMain = (): Promise<void> => {
  const sched = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return sched?.yield ? sched.yield() : new Promise((r) => setTimeout(r, 0));
};

export async function createIntroScene(canvas: HTMLCanvasElement): Promise<IntroScene> {
  const ps2 = createPS2Renderer(canvas);
  const path = createPath();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG_COLOR);
  scene.fog = new THREE.FogExp2(FOG_COLOR, 0.045);

  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 160);
  scene.add(camera);

  const ctx = { path, camera };
  const [{ createForest }, { createHands }, { createWisp }] = await Promise.all([
    import('./forest'),
    import('./hands'),
    import('./wisp'),
  ]);
  // Cada módulo genera texturas y geometría: se cede el hilo entre ellos para no crear una tarea larga.
  const forest = createForest(ctx);
  await yieldToMain();
  const wisp = createWisp(ctx);
  await yieldToMain();
  const hands = createHands(ctx);
  await yieldToMain();
  const modules: IntroModule[] = [forest, wisp, hands];
  for (const m of modules) {
    // Las manos viven en el espacio de la cámara; el resto en el mundo.
    (m === modules[2] ? camera : scene).add(m.group);
  }
  ps2Uniforms.uWisp.value.copy(path.wisp);

  let progress = 0;
  let last = -1;
  let raf = 0;
  let lastT = performance.now();
  let disposed = false;

  const placeCamera = (p: number) => {
    const w = walkParam(p);
    const pt = path.at(w);
    const envelope = walkEnvelope(p);
    const phase = stepPhase(p, path.length);
    camera.position.copy(pt.pos);
    camera.position.y += Math.abs(Math.sin(phase)) * 0.05 * envelope;
    camera.position.x += Math.cos(phase) * 0.018 * envelope * pt.dir.z;
    // Empujón final hacia la luz al extender el brazo.
    const lunge = smooth(T.walkEnd, T.reachEnd, p) * 0.35;
    camera.position.addScaledVector(pt.dir, lunge);

    const look = pt.pos.clone().addScaledVector(pt.dir, 12);
    look.y -= 0.35;
    const toWisp = path.wisp.clone();
    camera.lookAt(look.lerp(toWisp, smooth(0.5, 0.82, w)));
    camera.rotation.z += Math.sin(phase) * 0.006 * envelope;
  };

  const draw = () => {
    raf = 0;
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    placeCamera(progress);
    for (const m of modules) m.update(progress, dt);
    ps2.render(scene, camera, smooth(T.touch, T.flashEnd, progress));
    last = progress;
  };

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    // En vertical se abre el campo de visión para que el pasillo y las manos sigan encuadrados.
    camera.fov = w / h < 1 ? 82 : 70;
    camera.updateProjectionMatrix();
    ps2.resize(w, h);
    last = -1;
    schedule();
  };

  const schedule = () => {
    if (!raf && !disposed) raf = requestAnimationFrame(draw);
  };

  resize();
  schedule();

  return {
    setProgress(p) {
      progress = clamp01(p);
      if (Math.abs(progress - last) > 1e-5) schedule();
    },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      for (const m of modules) m.dispose();
      ps2.dispose();
    },
  };
}

export { HANDS_TOUCH };
