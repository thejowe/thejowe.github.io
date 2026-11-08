import * as THREE from 'three';
import type { IntroPath, PathPoint } from './types';

const LENGTH = 40;
const EYE = 1.65;
/** Altura de la luz sobre los ojos: flota por encima de la cabeza y hay que alzar el brazo. */
const WISP_RISE = 0.8;
/** Alcance del brazo (ver HANDS_TOUCH) y empujón final de la cámara hacia la luz. */
const REACH = 1.2;
const LUNGE = 0.35;
/** Distancia horizontal de la parada a la luz: tras el empujón, la luz queda a REACH en línea recta. */
const STOP_TO_WISP = Math.sqrt(REACH * REACH - WISP_RISE * WISP_RISE) + LUNGE;

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
  wisp.y = EYE + WISP_RISE;
  return { length: LENGTH, at, centerX, wisp, eyeHeight: EYE };
}
