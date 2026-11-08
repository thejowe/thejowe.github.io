import { vnoise } from '../intro/ps2';

/**
 * El sol del modo Amanecer: hermano de la luna del bosque (src/lib/pixel/moon.ts). Mismo lienzo de
 * 64x64, disco con manchas suaves, rayos cortos en 8 direcciones y halo cálido en 8 niveles.
 * Caracteres: `1`..`8` halo, `u` disco, `v`/`x` manchas, `z` rayos.
 */
export const SUN_PALETTE: Record<string, string> = {
  '1': 'rgb(255 190 100 / 0.07)',
  '2': 'rgb(255 190 100 / 0.14)',
  '3': 'rgb(255 190 100 / 0.22)',
  '4': 'rgb(255 190 100 / 0.3)',
  '5': 'rgb(255 190 100 / 0.4)',
  '6': 'rgb(255 190 100 / 0.5)',
  '7': 'rgb(255 190 100 / 0.6)',
  '8': 'rgb(255 190 100 / 0.7)',
  u: 'rgb(255 240 176)',
  v: 'rgb(255 222 128)',
  x: 'rgb(255 200 96)',
  z: 'rgb(255 176 64)',
};

const SIZE = 64;

export const sunRows: string[] = (() => {
  const rows: string[] = [];
  for (let y = 0; y < SIZE; y++) {
    let row = '';
    for (let x = 0; x < SIZE; x++) {
      const dx = x - 31.5;
      const dy = y - 31.5;
      const r = Math.hypot(dx, dy);
      // Ángulo respecto a la dirección de rayo más cercana (cada 45°)
      const a = (Math.atan2(dy, dx) * 180) / Math.PI;
      const off = Math.abs(((a % 45) + 45) % 45);
      const nearRay = Math.min(off, 45 - off) < (r < 15 ? 6 : 3.4);
      if (r < 10.5) {
        const n = vnoise(x / 5, y / 5, 33);
        row += n > 0.8 ? 'x' : n < 0.2 ? 'v' : 'u';
      } else if (r >= 12.5 && r <= 19 && nearRay) {
        row += 'z';
      } else {
        const h = Math.pow(Math.max(0, 1 - (r - 10.5) / 21.5), 2.2);
        const q = Math.round(h * 8);
        row += q > 0 ? String(q) : '.';
      }
    }
    rows.push(row);
  }
  return rows;
})();
