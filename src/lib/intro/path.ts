import * as THREE from 'three';
import type { IntroPath, PathPoint } from './types';

const LENGTH = 70;
const EYE = 1.65;
/** Distancia de la parada a la luz; menos el empujón final de 0.35 m = 1.2 m (ver HANDS_TOUCH). */
const STOP_TO_WISP = 1.55;

/** Eje sinuoso del sendero. z negativo = hacia delante. */
const centerX = (z: number) => 5 * Math.sin(-z * 0.05) + 2 * Math.sin(-z * 0.13 + 1);

export function createPath(): IntroPath {
  const at = (t: number): PathPoint => {
    const k = Math.min(1, Math.max(0, t));
    const z = -k * LENGTH;
    const pos = new THREE.Vector3(centerX(z), EYE, z);
    const ahead = new THREE.Vector3(centerX(z - 0.5), EYE, z - 0.5);
    const dir = ahead.sub(pos).setY(0).normalize();
    return { pos, dir };
  };
  const end = at(1);
  const wisp = end.pos.clone().addScaledVector(end.dir, STOP_TO_WISP);
  wisp.y = EYE - 0.15;
  return { length: LENGTH, at, centerX, wisp, eyeHeight: EYE };
}
