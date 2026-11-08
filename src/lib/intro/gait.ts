import { T } from './types';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Fracción recorrida del sendero (0..1) para un progreso de scroll: arranque y parada suaves. */
export function walkParam(p: number): number {
  const walk = clamp01((p - T.walkStart) / (T.walkEnd - T.walkStart));
  return walk * walk * (3 - 2 * walk) * 0.35 + walk * 0.65;
}

/** Fase del paso (radianes): un paso cada ~0.75 m recorridos. Compartida por cámara y manos. */
export function stepPhase(p: number, pathLength: number): number {
  return walkParam(p) * pathLength * (Math.PI / 0.75);
}

/** 0 quieto → 1 caminando a ritmo normal; baja a 0 al arrancar y al parar. */
export function walkEnvelope(p: number): number {
  const w = walkParam(p);
  return Math.min(1, w / 0.04, (1 - w) / 0.06);
}
