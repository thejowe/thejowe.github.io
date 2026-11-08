import type * as THREE from 'three';

/**
 * Línea de tiempo de la intro, en progreso de scroll (0 → 1). Fuente única para todos los módulos.
 * 0 → walkStart: quieto, bosque lejano. walkStart → walkEnd: camina por el sendero hacia la luz.
 * reachStart → reachEnd: la mano derecha se alarga hacia la luz. touch: contacto y estallido.
 * touch → flashEnd: el blanco cálido sube. fadeStart → 1: el blanco se disipa (lo hace el DOM).
 */
export const T = {
  walkStart: 0.04,
  walkEnd: 0.78,
  reachStart: 0.6,
  reachEnd: 0.86,
  touch: 0.88,
  flashEnd: 0.93,
  fadeStart: 0.95,
} as const;

export interface PathPoint {
  /** Posición del ojo (altura incluida), sin balanceo de pasos. */
  pos: THREE.Vector3;
  /** Dirección de avance (unitaria, horizontal). */
  dir: THREE.Vector3;
}

export interface IntroPath {
  /** Longitud aproximada del recorrido en unidades de mundo (1 unidad ≈ 1 m). */
  length: number;
  /** Punto del sendero en t ∈ [0,1] (t=0 inicio, t=1 donde la cámara se detiene). */
  at(t: number): PathPoint;
  /** X del eje del sendero para una profundidad z (z negativo = hacia delante). Para despejar árboles. */
  centerX(z: number): number;
  /** Posición en el mundo de la luz (wisp). Siempre al frente de at(1). */
  wisp: THREE.Vector3;
  eyeHeight: number;
}

export interface ModuleCtx {
  path: IntroPath;
  camera: THREE.PerspectiveCamera;
}

export interface IntroModule {
  /** Se añade a la escena (el módulo `hands` se cuelga de la cámara en su lugar). */
  group: THREE.Object3D;
  /** Llamado cada fotograma con el progreso actual de scroll. Debe ser determinista respecto a `p`. */
  update(p: number, dt: number): void;
  dispose(): void;
}

/**
 * Punto, en el espacio de la cámara, donde la yema de los dedos de la mano derecha toca la luz
 * cuando p ≥ T.reachEnd. La cámara mira justo a la luz, que queda a 1.2 m en línea recta.
 */
export const HANDS_TOUCH = { x: 0, y: 0, z: -1.2 } as const;
